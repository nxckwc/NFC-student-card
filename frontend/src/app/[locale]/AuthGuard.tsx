"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { usePathname, useRouter } from "next/navigation";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3100").replace(/\/+$/, "");

interface AuthGuardProps {
  locale: string;
  children: React.ReactNode;
}

interface SessionResponse {
  user: { role: string };
}

const AuthGuard = ({ locale, children }: AuthGuardProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);

  const PublicRoute = ["/", "/about", "/docs", "/contact"];

  useEffect(() => {
    let isActive = true;

    const isLoginRoute = pathname === `/${locale}/login`;

    const isPublicRoute = PublicRoute.includes(
        pathname.replace(new RegExp(`^/${locale}`), "") || "/"
    );

    const verifySession = async () => {
      try {
        const { data } = await axios.get<SessionResponse>(`${API_BASE_URL}/auth/session`, {
          withCredentials: true,
        });

        if (!isActive) return;

        if (isLoginRoute) {
          setIsAllowed(false);
          router.replace(`/${locale}/${data.user.role === "ADMIN" ? "admin" : "dashboard"}`);
          return;
        }

        if (pathname.startsWith(`/${locale}/admin`) && data.user.role !== "ADMIN") {
          setIsAllowed(false);
          router.replace(`/${locale}/dashboard`);
          return;
        }

        setIsAllowed(true);
      } catch {
        if (!isActive) return;

        if (isLoginRoute || isPublicRoute) {
          setIsAllowed(true);
          return;
        }

        setIsAllowed(false);
        router.replace(`/${locale}/login`);
      }
    };

    void verifySession();

    return () => {
      isActive = false;
    };
  }, [locale, pathname, router]);

  if (!isAllowed) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;
