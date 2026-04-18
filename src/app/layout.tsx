import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Toaster } from "react-hot-toast";
import Header from "@/components/layout/Header";
import MainShell from "@/components/layout/MainShell";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tabiji",
  description: "",
  icons: {
    icon: "/LOGO.ico",
    shortcut: "/LOGO.ico",
    apple: "/LOGO.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${manrope.variable} antialiased font-sans`}>
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap"
          rel="stylesheet"
        />
        <AuthProvider>
          <FavoritesProvider>
            <Header />
            <MainShell>{children}</MainShell>
            <Footer />
            <Toaster
              position="top-right"
              containerStyle={{ zIndex: 2200 }}
              toastOptions={{
                duration: 4000,
                style: {
                  background: "#363636",
                  color: "#fff",
                },
                success: {
                  style: {
                    background: "#10B981",
                  },
                },
                error: {
                  style: {
                    background: "#EF4444",
                  },
                },
              }}
            />
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
