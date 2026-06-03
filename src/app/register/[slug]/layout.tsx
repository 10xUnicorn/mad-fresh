import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "RSVP — Mad Fresh App Launch Party | May 28, 2026",
  description:
    "Thursday, May 28, 2026 · 7–9 PM · Tempe, AZ. Free chef-crafted bowls, early app access, and good vibes. 100 spots only — RSVP free.",
  openGraph: {
    title: "RSVP — Mad Fresh App Launch Party | May 28, 2026",
    description:
      "Thursday, May 28, 2026 · 7–9 PM · Tempe, AZ. Free chef-crafted bowls, early app access, and good vibes. 100 spots only — RSVP free.",
    type: "website",
    siteName: "Mad Fresh Kitchen",
    locale: "en_US",
    images: [
      {
        url: "https://assets.cdn.filesafe.space/XTeGzlDIejNlj5OyxvqU/media/69cf136abbe1310051004a5d.png",
        width: 1200,
        height: 630,
        alt: "Mad Fresh Kitchen App Launch Party — May 28, 2026",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RSVP — Mad Fresh App Launch Party | May 28, 2026",
    description:
      "Thursday, May 28, 2026 · 7–9 PM · Tempe, AZ. Free chef-crafted bowls, early app access, and good vibes. 100 spots only — RSVP free.",
    images: ["https://assets.cdn.filesafe.space/XTeGzlDIejNlj5OyxvqU/media/69cf136abbe1310051004a5d.png"],
  },
};

export default function RegisterEventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
