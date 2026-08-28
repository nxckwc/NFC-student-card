"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import PasswordInput from "./PasswordInput";

interface LoginFormProps {
  mode: "login" | "signup";
  username: string;
  password: string;
  rememberMe: boolean;
  showPassword: boolean;
  errorMessage: string | null;
  noticeMessage: string | null;
  isBusy: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRememberMeChange: (value: boolean) => void;
  onTogglePassword: () => void;
  onToggleMode: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <div className="mb-2 text-sm font-semibold text-[#4c4947]">{label}</div>
    {children}
  </div>
);

const LoginForm = ({
  mode,
  username,
  password,
  rememberMe,
  showPassword,
  errorMessage,
  noticeMessage,
  isBusy,
  onUsernameChange,
  onPasswordChange,
  onRememberMeChange,
  onTogglePassword,
  onToggleMode,
  onSubmit,
}: LoginFormProps) => {
  const t = useTranslations("login.form");
  const isLoginMode = mode === "login";

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      <Field label={t("username")}>
        <input
          autoComplete="username"
          className="w-full rounded-xl border border-[#ded6d0] bg-white px-4 py-3 text-sm text-[#303536] outline-none transition placeholder:text-[#aaa19b] focus:border-[#c94f5f] focus:ring-3 focus:ring-[#f8e7e9]"
          disabled={isBusy}
          onChange={(e) => onUsernameChange(e.target.value)}
          placeholder={t("usernamePlaceholder")}
          required
          type="text"
          value={username}
        />
      </Field>

      <Field label={t("password")}>
        <PasswordInput
          disabled={isBusy}
          onChange={onPasswordChange}
          onToggle={onTogglePassword}
          placeholder={t("passwordPlaceholder")}
          show={showPassword}
          value={password}
        />
      </Field>

      {isLoginMode && (
        <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-[#68625e]">
          <input
            checked={rememberMe}
            className="h-4 w-4 cursor-pointer rounded accent-[#c94f5f]"
            disabled={isBusy}
            onChange={(e) => onRememberMeChange(e.target.checked)}
            type="checkbox"
          />
          {t("rememberMe")}
        </label>
      )}

      {noticeMessage && (
        <div className="rounded-xl border border-[#bfd4c6] bg-[#dfeae3] px-4 py-3 text-sm text-[#466052]">
          {noticeMessage}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-[#eccfd3] bg-[#f8e7e9] px-4 py-3 text-sm text-[#a93e4d]">
          {errorMessage}
        </div>
      )}

      <motion.button
        aria-busy={isBusy}
        className="group relative flex w-full cursor-pointer select-none items-center justify-center gap-2 rounded-xl bg-[#c94f5f] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(169,62,77,0.18)] transition hover:bg-[#a93e4d] disabled:cursor-wait disabled:opacity-70"
        disabled={isBusy}
        type="submit"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {isBusy
          ? isLoginMode
            ? t("submittingSignIn")
            : t("submittingSignUp")
          : isLoginMode
            ? t("submitSignIn")
            : t("submitSignUp")}
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </motion.button>

      <div className="text-center text-sm text-[#817873]">
        {isLoginMode ? t("signupPrompt") : t("signinPrompt")}{" "}
        <button
          className="cursor-pointer font-semibold text-[#b54554] hover:text-[#923744]"
          disabled={isBusy}
          onClick={onToggleMode}
          type="button"
        >
          {isLoginMode ? t("switchToSignUp") : t("switchToSignIn")}
        </button>
      </div>
    </form>
  );
};

export default LoginForm;