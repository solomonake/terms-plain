import type { Metadata } from "next";
import "./globals.css";
import SectionHeader from "./section-header";
import AuthNav from "@/components/AuthNav";
import { spaceGrotesk } from "./fonts";

export const metadata: Metadata = {
  title: "Termsplain",
  description:
    "Understand your lease before it costs you and leave early if you need to.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={spaceGrotesk.variable}>
        <div className="app-shell">
          <header className="site-header">
            <nav className="nav">
              <div className="logo">Termsplain</div>
              <AuthNav />
            </nav>
            <SectionHeader />
          </header>
          <main className="page">{children}</main>
        </div>
      </body>
    </html>
  );
}
