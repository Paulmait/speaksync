import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ScriptProvider } from "@/contexts/ScriptContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SpeakSync - Professional Teleprompter",
  description: "Create, edit, and present your scripts with our powerful web editor and mobile teleprompter.",
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  themeColor: '#4F7FFF',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <SubscriptionProvider>
            <ScriptProvider>
              {children}
              <Toaster position="top-right" />
            </ScriptProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
