import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Navbar from "../component/Navbar";
import { IBM_Plex_Sans_Thai, IBM_Plex_Sans } from "next/font/google";

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

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();
  const fontClass = locale === 'th' ? ibmPlexThai.className : ibmPlexSans.className;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className={`flex min-h-screen min-w-screen flex-col ${fontClass}`}>
        <Navbar />
        {children}
      </div>
      
    </NextIntlClientProvider>
  );
}