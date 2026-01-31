import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL('https://stockmarketbullion.com'),
  title: "StockMarket Bullion - Latest Stocks, Gold, Silver & Sharia Compliant Stocks",
  description: "Get the latest stock market news, gold and silver prices, and Sharia-compliant stock analysis. Real-time market data, AI-generated insights, and comprehensive financial coverage for India and global markets.",
  keywords: "stock market, stocks, gold price, silver price, sharia compliant stocks, NSE, BSE, market news, financial news",
  authors: [{ name: "StockMarket Bullion" }],
  creator: "StockMarket Bullion",
  publisher: "StockMarket Bullion",
  openGraph: {
    title: "StockMarket Bullion - Stock Market & Precious Metals News",
    description: "Latest stocks, metals, and Sharia-compliant stock news",
    url: "https://stockmarketbullion.com",
    siteName: "StockMarket Bullion",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "StockMarket Bullion",
    description: "Latest stock market and precious metals news",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-IN" suppressHydrationWarning className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
          <Script
            id="adsense-init"
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
          />
        )}
        <Navigation />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
