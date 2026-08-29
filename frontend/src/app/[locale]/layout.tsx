import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { IBM_Plex_Sans_Thai, IBM_Plex_Sans } from "next/font/google";
import Navbar from "./NavBar/Navbar";
import AuthGuard from "./AuthGuard";

const ibmPlexThai = IBM_Plex_Sans_Thai({
  weight: ['400', '700'],
  subsets: ['thai', 'latin'],
  display: 'swap'
});

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap'
});

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();
  const fontClass = locale === 'th' ? ibmPlexThai.className : ibmPlexSans.className;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AuthGuard locale={locale}>
        <div className={`flex min-h-screen w-full flex-col ${fontClass}`}>
          <Navbar />
          {children}
        </div>
      </AuthGuard>
      
    </NextIntlClientProvider>
  );
}