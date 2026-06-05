import type { ReactNode } from "react";
import { BananaRain } from "@/components/banana-rain";
import { CursorGlow } from "@/components/cursor-glow";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { StructuredData } from "@/components/seo/structured-data";
import { SplashScreen } from "@/components/splash-screen";
import { createMetadata } from "@/lib/seo";
import "./globals.css";

export const metadata = createMetadata();

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html data-theme="dark" lang="en-GB">
      <body>
        <CursorGlow />
        <BananaRain />
        <SplashScreen />
        <StructuredData />
        <div className="site-shell">
          <Navbar />
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
