import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://madfresh.app"),
  title: "Mad Fresh Kitchen | Meal Prep · Corporate Catering · Food Service Programs",
  description:
    "Fueling Arizona since 2018. Weekly meal prep delivery, corporate catering, and recurring food service programs for schools, athletes, and businesses. Organic. No seed oils. Award-winning.",
  keywords: [
    "meal prep Arizona", "corporate catering Phoenix", "healthy meal delivery Tempe",
    "food service programs", "athlete meal plans", "school lunch programs",
    "office catering", "organic meal prep", "Mad Fresh Kitchen",
  ],
  manifest: "/manifest.json",
  icons: {
    icon: "/images/brand/mad-fresh-logo.png",
    apple: "/images/brand/mad-fresh-logo.png",
    shortcut: "/images/brand/mad-fresh-logo.png",
  },
  appleWebApp: {
    capable: true,
    title: "Mad Fresh Kitchen",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "Mad Fresh Kitchen | Meal Prep · Catering · Food Service",
    description:
      "Fueling Arizona since 2018. From individual meal plans to daily lunch programs serving schools, athletes, and corporate teams across Arizona.",
    url: "https://madfresh.app",
    siteName: "Mad Fresh Kitchen",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Mad Fresh Kitchen — Meal Prep · Corporate Catering · Food Service Programs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mad Fresh Kitchen | Meal Prep · Catering · Food Service",
    description:
      "Fueling Arizona since 2018. Organic, no seed oils. Trusted by PayPal, GoDaddy, Arizona Rattlers & more.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#faf8f3",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js');
            });
          }
        `}} />
      </body>
    </html>
  );
}
