"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { usePathname, useRouter } from "next/navigation";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://194.164.160.123/api").replace(/\/+$/, "");

interface AuthGuardProps {
  locale: string;
  children: React.ReactNode;
}

const AuthGuard = ({ locale, children }: AuthGuardProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    let isActive = true;

    const isLoginRoute = pathname === `/${locale}/login`;

    const verifySession = async () => {
      try {
        await axios.get(`${API_BASE_URL}/auth/session`, {
          withCredentials: true,
        });

        if (!isActive) return;

        if (isLoginRoute) {
          setIsAllowed(false);
          router.replace(`/${locale}`);
          return;
        }

        setIsAllowed(true);
      } catch {
        if (!isActive) return;

        if (isLoginRoute) {
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
