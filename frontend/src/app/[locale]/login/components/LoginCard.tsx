"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import SchoolHeader from "./SchoolHeader";
import LoginForm from "./LoginForm";
import { useLoginForm } from "../hooks/useLoginForm";
import {useEffect} from "react";
import {useParams, useRouter} from "next/navigation";

const LoginCard = () => {
  const t = useTranslations("login");
  const {
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
  } = useLoginForm();
  const router = useRouter();
  const { locale } = useParams();
  useEffect(() => {
    if (isSuccess) setTimeout(() => router.push(`/${locale}/dashboard`), 1500);
  }, [isSuccess, locale, router]);
  return (
    <motion.section
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="flex flex-col justify-center lg:justify-end"
      initial={{ opacity: 0, scale: 0.98, y: 18 }}
      transition={{ delay: 0.05, duration: 0.55 }}
    >
      <div className="flex justify-center mb-2">
        <Image
          alt="cog top"
          className="object-cover"
          height={150}
          src="/cog-removebg-preview.png"
          width={150}
        />
      </div>

      <div className="relative min-w-104">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/35 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.60)] backdrop-blur">

          <div className={`${isSuccess ? "hidden" : "absolute"} left-0 top-0 h-0.5 w-full bg-linear-to-r from-transparent via-red-500/80 to-transparent`} />

          <motion.div
            animate={{ height: isSuccess ? 50 : "auto" }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex justify-center items-center"
          >
            <motion.div
              animate={{ opacity: isSuccess ? 1 : 0 }}
              className="text-3xl absolute font-bold"
            >
              {t("success")}
            </motion.div>

            <div className={`${isSuccess ? "opacity-0" : ""} w-full h-full`}>
              <SchoolHeader />
              <LoginForm
                mode={mode}
                username={username}
                password={password}
                rememberMe={rememberMe}
                showPassword={showPassword}
                errorMessage={errorMessage}
                noticeMessage={noticeMessage}
                isBusy={isBusy}
                onUsernameChange={setUsername}
                onPasswordChange={setPassword}
                onRememberMeChange={setRememberMe}
                onTogglePassword={() => setShowPassword((prev) => !prev)}
                onToggleMode={handleToggleMode}
                onSubmit={handleSubmit}
              />
            </div>
          </motion.div>

        </div>
      </div>

      <div className="flex justify-center mt-2">
        <Image
          alt="cog bottom"
          className="object-cover"
          height={150}
          src="/re-cog-removebg-preview.png"
          width={150}
        />
      </div>
    </motion.section>
  );
};

export default LoginCard;