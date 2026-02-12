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

import {
  generateMetadata as generateSEOMetadata,
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateKeywords,
  SITE_URL,
} from "@/lib/utils/seo";
import StructuredData from "@/components/StructuredData";
const rootMetadata = generateSEOMetadata({
  title:
    "StockMarket Bullion - Latest Stocks, Gold, Silver & Sharia Compliant Stocks",
  description:
    "Get the latest stock market news, gold and silver prices, and Sharia-compliant stock analysis. Real-time market data, AI-generated insights, and comprehensive financial coverage for India and global markets.",
  keywords: generateKeywords({
    baseKeywords: [
      "stock market",
      "stocks",
      "gold price",
      "silver price",
      "sharia compliant stocks",
      "NSE",
      "BSE",
      "market news",
      "financial news",
      "investment",
      "trading",
      "precious metals",
      "bullion",
      "halal stocks",
      "islamic finance",
    ],
    location: "India",
  }),
  url: "/",
  type: "website",
  geo: {
    region: "IN",
    country: "India",
    latitude: "28.6139",
    longitude: "77.2090",
  },
});

export const metadata = {
  ...rootMetadata,
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
    shortcut: "/icon.png",
  },
  manifest: "/manifest.json",
};

// Generate organization and website schemas
const organizationSchema = generateOrganizationSchema();
const websiteSchema = generateWebSiteSchema({
  searchAction: `${SITE_URL}/search?q={search_term_string}`,
});

export default function RootLayout({ children }) {
  return (
    <html lang="en-IN" suppressHydrationWarning className="scroll-smooth">
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-RX9K69665P"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-RX9K69665P');
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <StructuredData data={organizationSchema} />
        <StructuredData data={websiteSchema} />
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
          <Script
            id="adsense-init"
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
          />
        )}
        <Navigation />
        <main className="min-h-screen bg-primary">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
