import { useState } from "react";
import { useTranslations } from "next-intl";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3101";
const AUTH_TOKEN_KEY = "authToken";
type AuthMode = "login" | "signup";

const decodeJwtPayload = (token: string) => {
  const [, payload] = token.split(".");
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
    const json = atob(normalized + padding);
    return JSON.parse(json) as { exp?: number };
  } catch {
    return null;
  }
};

const isTokenExpired = (token: string) => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;

  const currentTimestampInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= currentTimestampInSeconds;
};

const restoreValidToken = () => {
  if (typeof window === "undefined") return null;

  const localToken = window.localStorage.getItem(AUTH_TOKEN_KEY);
  const sessionToken = window.sessionStorage.getItem(AUTH_TOKEN_KEY);
  const token = localToken ?? sessionToken;
  if (!token) return null;

  if (isTokenExpired(token)) {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
    return null;
  }

  return token;
};

const getAuthErrorMessage = (
  rawMessage: string | undefined,
  mode: AuthMode,
  t: ReturnType<typeof useTranslations>
) => {
  const message = (rawMessage ?? "").toLowerCase();

  if (message.includes("already taken")) return t("usernameTaken");
  if (message.includes("at least 6")) return t("passwordTooShort");
  if (message.includes("required")) return t("requiredFields");

  return mode === "login" ? t("invalidCredentials") : t("signupFailed");
};

export function useLoginForm() {
  const tError = useTranslations("login.errors");
  const tForm = useTranslations("login.form");
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(() => {
    return Boolean(restoreValidToken());
  });

  const isBusy = isSubmitting || isSuccess;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusy) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setNoticeMessage(null);

    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, {
        username,
        password,
      });
      const data = response.data;

      if (mode === "signup") {
        setMode("login");
        setPassword("");
        setNoticeMessage(tForm("signupSuccess"));
        return;
      }

      if (!data?.token) {
        throw new Error(tError("invalidCredentials"));
      }

      const storage = rememberMe ? window.localStorage : window.sessionStorage;
      const fallbackStorage = rememberMe ? window.sessionStorage : window.localStorage;
      storage.setItem(AUTH_TOKEN_KEY, data.token);
      fallbackStorage.removeItem(AUTH_TOKEN_KEY);

      setIsSuccess(true);
      setPassword("");
    } catch (error) {
      const message =
        axios.isAxiosError(error)
          ? getAuthErrorMessage(error.response?.data?.message, mode, tError)
          : error instanceof Error && error.message
            ? error.message
            : tError("invalidCredentials");
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleMode = () => {
    if (isBusy) return;
    setMode((prev) => (prev === "login" ? "signup" : "login"));
    setErrorMessage(null);
    setNoticeMessage(null);
    setPassword("");
  };

  return {
    mode,
    username, setUsername,
    password, setPassword,
    rememberMe, setRememberMe,
    showPassword, setShowPassword,
    errorMessage,
    noticeMessage,
    isBusy,
    isSuccess,
    handleSubmit,
    handleToggleMode,
  };
}