import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PropertyManager - Find Your Perfect Property",
  description:
    "Your trusted platform for finding and managing properties. Buy, rent, or lease with confidence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <QueryProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#363636",
                color: "#fff",
                fontSize: "14px",
              },
              success: {
                style: { background: "#22c55e" },
              },
              error: {
                style: { background: "#ef4444" },
              },
            }}
          />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
