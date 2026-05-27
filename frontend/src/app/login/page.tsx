"use client";

import Image from "next/image";
import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, IdCard } from "lucide-react";





export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [isSuccess, setIsSuccess] = useState(true);
  const isBusy = isSubmitting || isPending || isSuccess;
  return (
    <main className={"relative min-h-screen overflow-hidden bg-neutral-950 px-4 py-10 text-neutral-100 sm:px-6 flex"}>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-[0.2] bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-size-[84px_84px]" />
        <div className="absolute inset-x-0 top-0 h-2/3 bg-linear-to-b from-red-500/25 to-transparent" />
      </div>

      <div className="relative overflow-hidden mx-auto flex max-w-6xl items-center min-w-[90%]">
        <div className={"flex w-full items-center justify-evenly"}>
          <motion.section
            animate={{ opacity: 1, y: 0 }}
            className="hidden pr-6 lg:block select-none"
            initial={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.55 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-s font-semibold text-white/90 backdrop-blur">
              <IdCard className="h-6 w-6 text-red-400" />
              ระบบจัดการบัตรนักเรียน
            </div>
            
            <h1 className="mt-5 text-5xl font-semibold tracking-tight text-white">
              ระบบบัตรนักเรียน
              <span className="antialiased text-4xl pt-2.5 pb-2 block bg-linear-to-r from-white to-white/55 bg-clip-text text-transparent">
                โรงเรียนพรานกระต่ายพิทยาคม
              </span>
            </h1>

            <p className="mt-5 max-w-md text-sm leading-6 text-white/70">
              แดชบอร์ดสำหรับนักเรียนและอาจารย์เพื่อจัดการ ตรวจสอบ แก้ไข บันทึกข้อมูลบัตรนักเรียน โรงเรียนพรานกระต่ายพิทยาคม
            </p>
          </motion.section>

          <motion.section
            animate={{ opacity: 1, scale: 1, y: 0 }}
          className={"flex flex-col justify-center lg:justify-end"}
            initial={{ opacity: 0, scale: 0.98, y: 18 }}
            transition={{ delay: 0.05, duration: 0.55 }}
          >
            <div className={'flex justify-center mb-2'}>
              <Image
                  alt="cog"
                  className="object-cover border "
                  height={150}
                  src="/cog-removebg-preview.png"
                  width={150}
              />
            </div>

            <div className={"relative min-w-104"}>
              <div className={'relative overflow-hidden rounded-3xl border border-white/10 bg-black/35 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.60)] backdrop-blur'}>
                <div className={`${isSuccess ? "hidden" : "absolute"}  left-0 top-0 h-0.5 w-full bg-linear-to-r from-transparent via-red-500/80 to-transparent`} />
                <motion.div
                    animate={{height:isSuccess ? 50 : "auto"}}
                    transition={{
                      duration: 1.5,
                      ease: [0.16, 1, 0.3, 1] // The "Expo" curve for premium apps
                    }}
                    className={`${isSuccess ? "" : ""} relative flex justify-center items-center`}
                >
                  <motion.div
                      animate={{opacity:isSuccess ? 1 : 0}}
                      className={"text-3xl absolute font-bold"}
                  >
                    PP-ROBOTICS
                  </motion.div>
                  <div className={`${isSuccess ? "opacity-0" : ""} w-full h-full`}>
                    <div className={` flex items-center justify-between gap-4`}>
                      <div className="flex items-center gap-3 select-none">
                        <div className="h-24 w-24 overflow-hidden rounded-2xl">
                          <Image
                              alt="School logo"
                              className="h-full w-full rounded-xl object-cover"
                              height={96}
                              src="/images-removebg-preview (1) (1).png"
                              width={96}
                          />
                        </div>

                        <div>
                          <div className="text-m font-semibold text-white">Prankrataipittayakom</div>
                          <div className="text-xs text-white/60">Students Dashboard</div>
                        </div>
                      </div>
                    </div>

                    <form className="mt-6 space-y-4">
                      <Field label="Username">
                        <input
                            autoComplete="username"
                            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-red-500/70 focus:ring-2 focus:ring-red-500/20"
                            disabled={isBusy}
                            onChange={(event) => setUsername(event.target.value)}
                            placeholder="username"
                            required
                            type="text"
                            value={username}
                        />
                      </Field>

                      <Field label="Password">
                        <div className="relative">
                          <input
                              autoComplete="current-password"
                              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 pr-12 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-red-500/70 focus:ring-2 focus:ring-red-500/20"
                              disabled={isBusy}
                              onChange={(event) => setPassword(event.target.value)}
                              placeholder="password"
                              required
                              type={showPassword ? "text" : "password"}
                              value={password}
                          />
                          <button
                              aria-label={showPassword ? "Hide password" : "Show password"}
                              className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-3 py-2 text-xs font-semibold text-white/80 "
                              disabled={isBusy}
                              onClick={() => setShowPassword((current) => !current)}
                              type="button"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </Field>

                      <label className="flex cursor-pointer items-center gap-2 text-sm text-white/80 select-none">
                        <input
                            checked={rememberMe}
                            className="h-4 w-4 rounded border-white/20 accent-red-500 cursor-pointer"
                            disabled={isBusy}
                            onChange={(event) => setRememberMe(event.target.checked)}
                            type="checkbox"
                        />
                        Remember me
                      </label>

                      {errorMessage ? (
                          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                            {errorMessage}
                          </div>
                      ) : null}

                      <motion.button
                          aria-busy={isBusy}
                          className="select-none cursor-pointer group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(239,68,68,0.25)] "
                          disabled={isBusy}
                          type="submit"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                      >
                        <span className="pointer-events-none absolute inset-0 rounded-2xl " />
                        {isBusy ? "Signing in..." : "Sign in"}
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </motion.button>
                    </form>
                  </div>

                </motion.div>

              </div>
            </div>

            <div className={'flex justify-center mt-2'}>
              <Image
                  alt="cog"
                  className="object-cover border "
                  height={150}
                  src="/re-cog-removebg-preview.png"
                  width={150}
              />
            </div>
          </motion.section>
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-sm font-semibold text-white/90">{label}</div>
      {children}
    </div>
  );
}