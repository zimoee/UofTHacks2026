import type { Metadata } from "next";
import Link from "next/link";
import { Courier_Prime, DM_Sans } from "next/font/google";

import { StickerLayer } from "@/components/decorative/StickerLayer";
import { HomeMascots } from "@/components/layout/HomeMascots";

import "./globals.css";

const fontTypewriter = Courier_Prime({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-typewriter",
});

const fontSans = DM_Sans({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Interview Journal",
  description: "Record a mock behavioral interview and get feedback.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-character="professional">
      <body className={`${fontTypewriter.variable} ${fontSans.variable}`}>
        <div className="relative min-h-screen paper-bg">
          <StickerLayer />
          <header className="z-20 border-b border-light-gray/80 bg-cream/80 backdrop-blur">
            <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
              <Link href="/" className="group inline-flex items-center gap-2">
                <span className="font-typewriter text-3xl leading-none text-ink transition group-hover:-rotate-1">
                  Interview Journal
                </span>
                <HomeMascots />
              </Link>

              {/* <nav className="flex items-center gap-2">
                <Link href="/interview/new">
                  <span className="rounded-full border border-light-gray bg-off-white px-3 py-1 font-sans text-xs font-medium text-ink shadow-sm transition hover:-translate-y-0.5 hover:shadow-paper">
                    New session
                  </span>
                </Link>
              </nav> */}
            </div>
          </header>

          <main className="relative z-10 mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
