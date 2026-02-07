import type { Metadata } from "next";
import { Bagel_Fat_One, Inter } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Toaster } from "react-hot-toast";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";

const bagelFatOne = Bagel_Fat_One({
  variable: "--font-bagel-fat-one",
  subsets: ["latin"],
  weight: "400",
});

const inter = Inter({
  variable: "--font-inter",
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
      <body className={`${bagelFatOne.variable} ${inter.variable} antialiased`}>
        <AuthProvider>
          <FavoritesProvider>
            <Header />
            {children}
            <Footer />
            <Toaster
              position="top-right"
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
