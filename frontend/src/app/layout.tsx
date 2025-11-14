import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ClientOnly } from "@/app/layout/ClientOnly";
import { Footer } from "@/app/layout/Footer";
import Particles from "@/components/react-bits/Particle";

export const metadata: Metadata = {
  title: "SMD exam portal",
  description:
    "An advanced online examination platform with AI-powered proctoring.",
  icons: {
    icon: "/fav.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head />
      <body className="font-body antialiased h-full" suppressHydrationWarning>
        <div className="flex flex-col min-h-screen">
          {children}
          <Footer />
        </div>

        <ClientOnly>
          <Toaster />
        </ClientOnly>
      </body>
    </html>
  );
}
