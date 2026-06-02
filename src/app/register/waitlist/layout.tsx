import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join the Waitlist — Mad Fresh Kitchen | Meal Prep Delivery, Tempe AZ",
  description:
    "Be first in line for Mad Fresh Kitchen — chef-crafted protein bowls delivered weekly in the East Valley. Founding member pricing, 5/10/15 meals per week, locked in for life.",
  openGraph: {
    title: "Mad Fresh Kitchen — Waitlist for Founding Members",
    description:
      "Weekly meal prep delivery launching May 2026. Join the waitlist for founding member pricing that never goes up.",
    type: "website",
    siteName: "Mad Fresh Kitchen",
    locale: "en_US",
    images: [
      {
        url: "https://assets.cdn.filesafe.space/XTeGzlDIejNlj5OyxvqU/media/69cf136abbe1310051004a5d.png",
        width: 1200,
        height: 630,
        alt: "Mad Fresh Kitchen — Weekly Meal Prep, Delivered Fresh",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mad Fresh Kitchen — Join the Waitlist",
    description:
      "Chef-crafted protein bowls, delivered weekly. Founding member pricing locked in for life. Tempe, AZ.",
    images: ["https://assets.cdn.filesafe.space/XTeGzlDIejNlj5OyxvqU/media/69cf136abbe1310051004a5d.png"],
  },
};

export default function RegisterWaitlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
