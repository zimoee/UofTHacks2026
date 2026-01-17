import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Behavioral Interview Coach",
  description: "Record a behavioral interview answer and get strengths/weaknesses feedback.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <div className="mx-auto max-w-5xl px-5 py-10">{children}</div>
        </div>
      </body>
    </html>
  );
}

