"use client"

import { IdCard } from "lucide-react";
import { motion } from "motion/react";

import { useTranslations} from "next-intl";

const HeroSection = () => {

  const t = useTranslations("login")

  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className="hidden pr-6 lg:block select-none"
      initial={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.55 }}
    >
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-s font-semibold text-white/90 backdrop-blur">
        <IdCard className="h-6 w-6 text-red-400" />
        { t("badge") }
      </div>

      <h1 className="mt-5 text-5xl font-semibold tracking-tight text-white">
        { t("title") }
        <span className="antialiased text-4xl pt-2.5 pb-2 block bg-linear-to-r from-white to-white/55 bg-clip-text text-transparent">
          { t("subtitle") }
        </span>
      </h1>

      <p className="mt-5 max-w-md text-sm leading-6 text-white/70">
        { t("description") }
      </p>
    </motion.section>
  );
};

export default HeroSection;