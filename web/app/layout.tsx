import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hyrd — A premium career platform",
  description: "Optimize a résumé, track every application, rehearse with AI, arrive prepared.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistSans.variable} style={{ height: "100%" }}>
      <body style={{ height: "100%" }}>
        {children}
        <Toaster
          position="bottom-center"
          duration={4000}
          toastOptions={{
            style: {
              background: "var(--ink)",
              color: "var(--bg)",
              border: "1px solid var(--ink)",
              borderRadius: "var(--r-3)",
              fontSize: "13px",
              padding: "12px 18px",
            },
          }}
        />
      </body>
    </html>
  );
}
