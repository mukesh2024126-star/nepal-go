import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import ToastProvider from "@/components/ToastProvider";
import ChatAssistant from "@/components/ChatAssistant";

export const metadata: Metadata = {
  title: "NepalGo — Discover Nepal",
  description: "AI-powered Nepal tourism platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#F0EBF8]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
        <AuthProvider>
          <ToastProvider>
            {children}
            <ChatAssistant />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
