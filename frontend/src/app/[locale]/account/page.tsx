"use client"

import { FormEvent, useEffect, useState } from "react"
import axios from "axios"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { AlertCircle, Check, LogOut, ShieldCheck } from "lucide-react"

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3100").replace(/\/+$/, "")

type SessionUser = { id: number; username: string; role: string }

const roleStyles: Record<string, string> = {
  ADMIN: "bg-accent-soft text-accent-foreground",
  TEACHER: "bg-info-soft text-info",
  USER: "bg-surface-chip text-text-secondary",
}

export default function AccountPage() {
  const locale = useLocale()
  const router = useRouter()
  const t = useTranslations("account")
  const [user, setUser] = useState<SessionUser | null>(null)
  const [username, setUsername] = useState("")
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    let active = true
    axios.get<{ user: SessionUser }>(`${API_BASE_URL}/auth/session`, { withCredentials: true })
      .then(({ data }) => {
        if (!active) return
        setUser(data.user)
        setUsername(data.user.username)
      })
      .catch(() => {
        if (active) router.replace(`/${locale}/login`)
      })
      .finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [locale, router])

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus(null)
    setIsSaving(true)
    try {
      const { data } = await axios.patch<SessionUser>(`${API_BASE_URL}/auth/profile`, { username }, { withCredentials: true })
      setUser(data)
      setUsername(data.username)
      setStatus({ type: "success", message: t("profileUpdated") })
    } catch (error) {
      const message = axios.isAxiosError(error) && error.response?.data?.message
        ? error.response.data.message
        : t("saveError")
      setStatus({ type: "error", message })
    } finally {
      setIsSaving(false)
    }
  }

  const logout = async () => {
    setIsLoggingOut(true)
    try { await axios.post(`${API_BASE_URL}/auth/logout`, {}, { withCredentials: true }) }
    finally { router.replace(`/${locale}/login`) }
  }

  if (isLoading || !user) return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 pb-14 pt-24 sm:px-6 lg:px-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle,rgba(112,139,122,0.16)_1px,transparent_1px)] bg-size-[24px_24px]" />
      <div className="relative mx-auto max-w-4xl space-y-5">
        <div className="skeleton h-10 w-64 rounded-md" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="skeleton h-72 rounded-lg" />
          <div className="skeleton h-72 rounded-lg" />
        </div>
      </div>
    </main>
  )

  const roleLabel = t(`roles.${user.role}`, { fallback: user.role })
  const initial = (user.username || "?").charAt(0).toUpperCase()

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 pb-14 pt-24 text-text-primary sm:px-6 lg:px-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle,rgba(112,139,122,0.16)_1px,transparent_1px)] bg-size-[24px_24px]" />
      <div className="relative mx-auto max-w-4xl">
        <header className="mb-6 flex items-center gap-3 border-b border-border pb-4">
          <span className="h-8 w-1 shrink-0 rounded-full bg-danger-accent" />
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-text-primary sm:text-xl">{t("title")}</h1>
            <p className="truncate text-xs text-text-muted sm:text-sm">{t("description")}</p>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-[0_14px_36px_rgba(52,76,61,0.06)]">
            <div className="flex items-center gap-4 border-b border-border-soft bg-surface-subtle p-5 sm:p-6">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent text-xl font-bold text-white">{initial}</span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-lg font-bold text-text-primary">{user.username}</h2>
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${roleStyles[user.role] ?? roleStyles.USER}`}>{roleLabel}</span>
                </div>
                <p className="mt-0.5 text-sm text-text-muted">{t("signedIn")}</p>
              </div>
            </div>

            <form onSubmit={saveProfile} className="p-5 sm:p-6">
              <label className="block text-xs font-bold uppercase tracking-wide text-text-muted" htmlFor="username">
                {t("name")}
                <input
                  id="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  minLength={3}
                  maxLength={30}
                  required
                  className="mt-2 w-full rounded-lg border border-border bg-surface-input px-3 py-2.5 text-sm font-normal normal-case text-text-primary outline-none transition focus:border-accent"
                />
              </label>

              <div className="mt-6 flex flex-col-reverse items-stretch gap-3 border-t border-border-soft pt-5 sm:flex-row sm:items-center sm:justify-between">
                {status ? (
                  <p role="status" className={`flex items-center gap-2 text-sm font-semibold ${status.type === "success" ? "text-accent-foreground" : "text-danger-foreground"}`}>
                    {status.type === "success" ? <Check className="size-4" /> : <AlertCircle className="size-4" />}
                    {status.message}
                  </p>
                ) : (
                  <span className="hidden sm:block" />
                )}
                <button
                  type="submit"
                  disabled={isSaving || username.trim() === user.username}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Check className="size-4" />
                  {isSaving ? t("saving") : t("save")}
                </button>
              </div>
            </form>
          </section>

          <aside className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-[0_14px_36px_rgba(52,76,61,0.06)]">
            <div className="border-b border-border-soft p-5 sm:p-6">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-text-muted">
                <ShieldCheck className="size-4 text-accent-foreground" />
                {t("role")}
              </div>
              <p className="mt-3 text-lg font-bold text-text-primary">{roleLabel}</p>
            </div>
            <div className="flex flex-1 flex-col justify-between gap-5 p-5 sm:p-6">
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-text-muted">{t("accountId")}</dt>
                  <dd className="font-semibold tabular-nums text-text-primary">#{user.id}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-text-muted">{t("name")}</dt>
                  <dd className="truncate font-semibold text-text-primary">{user.username}</dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={() => void logout()}
                disabled={isLoggingOut}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-danger-border bg-danger-bg px-4 py-2.5 text-sm font-bold text-danger-foreground transition hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogOut className="size-4" />
                {isLoggingOut ? t("loggingOut") : t("logout")}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}