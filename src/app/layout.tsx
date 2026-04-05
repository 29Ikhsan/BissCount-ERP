import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import Providers from "@/components/Providers";
import TaxChatWidget from "@/components/TaxBot/TaxChatWidget";

export const metadata: Metadata = {
  title: "AKSIA ERP",
  description: "Next Generation Financial Integrity System",
};

import { LanguageProvider } from "@/context/LanguageContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body suppressHydrationWarning>
        <Providers>
          <LanguageProvider>
            <div className="app-container">
              <Sidebar />
              <div className="app-main">
                <Topbar />
                <main className="app-content">{children}</main>
                <TaxChatWidget />
              </div>
            </div>
          </LanguageProvider>
        </Providers>
      </body>
    </html>
  );
}
