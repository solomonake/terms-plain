import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import AuthNav from "@/components/AuthNav";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Termsplain",
  description:
    "Understand your lease before it costs you — and leave early if you need to.",
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
            <div className="header-text">
              <h1>Termsplain</h1>
              <p className="subline">
                Understand your lease before it costs you — and leave early if
                you need to.
              </p>
              <p className="disclaimer">
                This is for information, not legal advice
              </p>
            </div>
          </header>
          <main className="page">{children}</main>
        </div>
      </body>
    </html>
  );
}
