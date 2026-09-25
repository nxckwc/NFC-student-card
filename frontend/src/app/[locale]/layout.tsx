import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Noto_Serif_Thai, IBM_Plex_Sans } from "next/font/google";
import Navbar from "./NavBar/Navbar";
import AuthGuard from "./AuthGuard";

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-ibm-plex-sans'
});

const notoSerifThai = Noto_Serif_Thai({
  weight: ['400', '700'],
  subsets: ['thai', 'latin'],
  display: 'swap',
  variable: '--font-noto-serif-thai'
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
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AuthGuard locale={locale}>
        <div className={`flex min-h-screen w-full flex-col ${ibmPlexSans.className} ${locale === 'th' ? notoSerifThai.variable : ''}`}>
          <Navbar />
          <div className={`pb-16 md:pb-0 ${locale === 'th' ? 'thai-content' : ''}`}>{children}</div>
        </div>
      </AuthGuard>
      
    </NextIntlClientProvider>
  );
}