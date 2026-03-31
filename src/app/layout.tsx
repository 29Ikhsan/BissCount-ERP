import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Bizzcount ERP",
  description: "Enterprise Cloud Accounting & ERP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <Providers>
          <div className="app-container">
            <Sidebar />
            <div className="app-main">
              <Topbar />
              <main className="app-content">{children}</main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
