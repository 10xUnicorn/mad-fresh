import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const TEMPLATE_COLORS: Record<string, { accent: string; bg: string; text: string; cardBg: string }> = {
  mad_fresh: { accent: "#75F663", bg: "#0a0a0a", text: "#ffffff", cardBg: "#1a1a1a" },
  fire_smoke: { accent: "#FF6B35", bg: "#1a0a05", text: "#ffffff", cardBg: "#2a1a10" },
  clean_classic: { accent: "#4A90D9", bg: "#fafafa", text: "#1a1a1a", cardBg: "#ffffff" },
};

function formatDate(dateString: string) {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(timeString: string) {
  const [hours, minutes] = timeString.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const colors = TEMPLATE_COLORS[event.template_style] || TEMPLATE_COLORS.mad_fresh;
  const eventUrl = `${request.nextUrl.origin}/events/${event.slug}`;
  const donateUrl = event.donation_page_enabled ? `${request.nextUrl.origin}/events/${event.slug}/donate` : null;

  // Generate QR code URL using a public QR API
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(eventUrl)}&bgcolor=${colors.bg.replace("#", "")}&color=${colors.accent.replace("#", "")}`;
  const donateQrUrl = donateUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(donateUrl)}&bgcolor=${colors.bg.replace("#", "")}&color=${colors.accent.replace("#", "")}`
    : null;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${event.name} — Event Flyer</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page {
      size: letter;
      margin: 0;
    }

    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: ${colors.bg};
      color: ${colors.text};
      max-width: 8.5in;
      min-height: 11in;
      margin: 0 auto;
      position: relative;
      overflow-x: hidden;
    }

    .flyer {
      width: 100%;
      min-height: 11in;
      padding: 0.6in;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(120px);
      opacity: 0.15;
      pointer-events: none;
    }

    .glow-1 {
      top: -100px;
      right: -100px;
      width: 400px;
      height: 400px;
      background: ${colors.accent};
    }

    .glow-2 {
      bottom: -80px;
      left: -80px;
      width: 350px;
      height: 350px;
      background: ${colors.accent};
    }

    .header {
      text-align: center;
      margin-bottom: 0.4in;
      position: relative;
      z-index: 1;
    }

    .badge {
      display: inline-block;
      background: ${colors.accent}22;
      border: 1px solid ${colors.accent}44;
      color: ${colors.accent};
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      padding: 6px 18px;
      border-radius: 100px;
      margin-bottom: 16px;
    }

    .event-name {
      font-size: 42px;
      font-weight: 900;
      letter-spacing: -1px;
      line-height: 1.1;
      margin-bottom: 12px;
    }

    .event-desc {
      font-size: 15px;
      opacity: 0.7;
      max-width: 500px;
      margin: 0 auto;
      line-height: 1.5;
    }

    ${event.host_organization ? `.host {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-top: 12px;
      font-size: 13px;
      opacity: 0.6;
    }
    .host img {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      object-fit: cover;
    }` : ""}

    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 0.35in;
      position: relative;
      z-index: 1;
    }

    .detail-card {
      background: ${colors.cardBg};
      border: 1px solid ${colors.accent}33;
      border-radius: 16px;
      padding: 20px;
    }

    .detail-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      opacity: 0.5;
      margin-bottom: 6px;
    }

    .detail-value {
      font-size: 16px;
      font-weight: 700;
    }

    .detail-sub {
      font-size: 13px;
      opacity: 0.6;
      margin-top: 2px;
    }

    .qr-section {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4in;
      background: ${colors.cardBg};
      border: 2px solid ${colors.accent}44;
      border-radius: 24px;
      padding: 0.35in;
      margin-bottom: 0.3in;
      position: relative;
      z-index: 1;
    }

    .qr-code {
      flex-shrink: 0;
    }

    .qr-code img {
      width: 180px;
      height: 180px;
      border-radius: 12px;
    }

    .qr-text {
      flex: 1;
    }

    .qr-title {
      font-size: 22px;
      font-weight: 900;
      margin-bottom: 8px;
    }

    .qr-subtitle {
      font-size: 14px;
      opacity: 0.6;
      line-height: 1.5;
    }

    .qr-url {
      display: inline-block;
      margin-top: 10px;
      font-size: 12px;
      font-weight: 600;
      color: ${colors.accent};
      word-break: break-all;
    }

    ${donateUrl ? `.donate-section {
      display: flex;
      align-items: center;
      gap: 20px;
      background: ${colors.accent}11;
      border: 1px solid ${colors.accent}33;
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 0.3in;
      position: relative;
      z-index: 1;
    }
    .donate-qr img {
      width: 100px;
      height: 100px;
      border-radius: 8px;
    }
    .donate-text {
      flex: 1;
    }
    .donate-title {
      font-size: 16px;
      font-weight: 800;
      margin-bottom: 4px;
    }
    .donate-sub {
      font-size: 12px;
      opacity: 0.6;
    }` : ""}

    .footer {
      text-align: center;
      padding-top: 16px;
      margin-top: auto;
      position: relative;
      z-index: 1;
    }

    .footer-brand {
      font-size: 18px;
      font-weight: 900;
      letter-spacing: -0.5px;
    }

    .footer-sub {
      font-size: 11px;
      opacity: 0.4;
      margin-top: 4px;
    }

    @media screen and (max-width: 600px) {
      body { width: 100%; min-height: auto; }
      .flyer { padding: 24px 16px; min-height: auto; }
      .event-name { font-size: 28px; }
      .event-desc { font-size: 13px; }
      .details-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
      .detail-card { padding: 14px; }
      .detail-value { font-size: 14px; }
      .detail-label { font-size: 9px; }
      .detail-sub { font-size: 11px; }
      .qr-section { flex-direction: column; gap: 16px; padding: 20px; text-align: center; }
      .qr-code img { width: 160px; height: 160px; }
      .qr-title { font-size: 18px; }
      .qr-subtitle { font-size: 13px; }
      .qr-url { font-size: 11px; }
      .donate-section { flex-direction: column; text-align: center; }
      .badge { font-size: 10px; padding: 5px 14px; letter-spacing: 1.5px; }
      .glow { display: none; }
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; width: 8.5in; }
    }
  </style>
</head>
<body>
  <div class="flyer">
    <div class="glow glow-1"></div>
    <div class="glow glow-2"></div>

    <div class="header">
      <div class="badge">${event.is_free ? "Free Event" : `$${event.ticket_price || 0}`}${event.max_capacity ? ` · Limited to ${event.max_capacity} Guests` : ""}</div>
      <h1 class="event-name">${event.name}</h1>
      ${event.description ? `<p class="event-desc">${event.description}</p>` : ""}
      ${event.host_organization ? `
      <div class="host">
        ${event.host_logo_url ? `<img src="${event.host_logo_url}" alt="" />` : ""}
        <span>Hosted by ${event.host_organization}</span>
      </div>` : ""}
    </div>

    <div class="details-grid">
      <div class="detail-card">
        <div class="detail-label">Date</div>
        <div class="detail-value">${formatDate(event.event_date)}</div>
        ${event.is_multi_day && event.end_date ? `<div class="detail-sub">through ${formatDate(event.end_date)}</div>` : ""}
      </div>
      <div class="detail-card">
        <div class="detail-label">Time</div>
        <div class="detail-value">${formatTime(event.start_time)} – ${formatTime(event.end_time)}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Venue</div>
        <div class="detail-value">${event.venue_name}</div>
        <div class="detail-sub">${event.venue_address}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Registration</div>
        <div class="detail-value">Scan QR Below</div>
        <div class="detail-sub">or visit the link</div>
      </div>
    </div>

    <div class="qr-section">
      <div class="qr-code">
        <img src="${qrUrl}" alt="QR Code" />
      </div>
      <div class="qr-text">
        <div class="qr-title">RSVP Now</div>
        <div class="qr-subtitle">Scan this QR code with your phone's camera to register for the event instantly.</div>
        <div class="qr-url">${eventUrl}</div>
      </div>
    </div>

    ${donateUrl ? `
    <div class="donate-section">
      <div class="donate-qr">
        <img src="${donateQrUrl}" alt="Donate QR" />
      </div>
      <div class="donate-text">
        <div class="donate-title">Support This Event</div>
        <div class="donate-sub">Scan to make a donation${event.donation_goal > 0 ? ` · Goal: $${event.donation_goal}` : ""}</div>
      </div>
    </div>` : ""}

    <div class="footer">
      <div class="footer-brand" style="color: ${colors.accent}">Mad Fresh Kitchen</div>
      <div class="footer-sub">Fresh, chef-crafted meals · 8 years feeding the Valley</div>
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
