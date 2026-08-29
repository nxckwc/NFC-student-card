"use client"

import { CheckCircle2, IdCard, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

import { useTranslations} from "next-intl";

const HeroSection = () => {

  const t = useTranslations("login")

  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className="hidden select-none lg:block"
      initial={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.55 }}
    >
      <div className="inline-flex items-center gap-2 rounded-full border border-[#eccfd3] bg-[#fffdfb] px-3 py-1.5 text-sm font-semibold text-[#a93e4d]">
        <IdCard className="size-5" />
        { t("badge") }
      </div>

      <h1 className="mt-6 max-w-xl text-5xl font-bold leading-[1.08] text-[#303536]">
        { t("title") }
        <span className="block pt-2 text-4xl font-normal text-[#746d68]">
          { t("subtitle") }
        </span>
      </h1>

      <p className="mt-6 max-w-lg text-base leading-7 text-[#68625e]">
        { t("description") }
      </p>

      <div className="mt-8 flex gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-[#dfeae3] px-3 py-2 text-xs font-semibold text-[#466052]">
          <ShieldCheck className="size-4" /> Secure access
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-[#e1edf2] px-3 py-2 text-xs font-semibold text-[#45616d]">
          <CheckCircle2 className="size-4" /> Live attendance
        </div>
      </div>
    </motion.section>
  );
};

export default HeroSection;