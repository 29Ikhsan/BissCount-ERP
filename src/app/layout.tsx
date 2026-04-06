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
import { ToastProvider } from "@/context/ToastContext";
import Breadcrumb from "@/components/layout/Breadcrumb";

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
            <ToastProvider>
              <div className="app-container">
                <Sidebar />
                <div className="app-main">
                  <Topbar />
                  <Breadcrumb />
                  <main className="app-content">{children}</main>
                  <TaxChatWidget />
                </div>
              </div>
            </ToastProvider>
          </LanguageProvider>
        </Providers>
      </body>
    </html>
  );
}
