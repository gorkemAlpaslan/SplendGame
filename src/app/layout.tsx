import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { FirebaseConfig } from "@/lib/firebase";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: {
    default: "Splend Game — Bulmaca Oyunları",
    template: "%s | Splend Game",
  },
  description:
    "30+ ücretsiz bulmaca oyunu: Sudoku, 2048, Kelime Avı, XOX, Amiral Battı ve daha fazlası. Tek başına oyna veya arkadaşlarınla yarış, global skor tablosunda yerini al!",
};

export const viewport: Viewport = {
  themeColor: "#0b1220",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read from server-side env vars (no NEXT_PUBLIC_ — never exposed to the browser bundle)
  const firebaseConfig: FirebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
  };

  return (
    <html lang="tr" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-dvh flex flex-col font-sans">
        <AuthProvider firebaseConfig={firebaseConfig}>
          <Navbar />
          <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
