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
    <div className="mb-2 text-sm font-semibold text-white/90">{label}</div>
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
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-red-500/70 focus:ring-2 focus:ring-red-500/20"
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
        <label className="flex cursor-pointer items-center gap-2 text-sm text-white/80 select-none">
          <input
            checked={rememberMe}
            className="h-4 w-4 rounded border-white/20 accent-red-500 cursor-pointer"
            disabled={isBusy}
            onChange={(e) => onRememberMeChange(e.target.checked)}
            type="checkbox"
          />
          {t("rememberMe")}
        </label>
      )}

      {noticeMessage && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {noticeMessage}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {errorMessage}
        </div>
      )}

      <motion.button
        aria-busy={isBusy}
        className="select-none cursor-pointer group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(239,68,68,0.25)]"
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

      <div className="text-center text-sm text-white/70">
        {isLoginMode ? t("signupPrompt") : t("signinPrompt")}{" "}
        <button
          className="cursor-pointer font-semibold text-red-300 hover:text-red-200"
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