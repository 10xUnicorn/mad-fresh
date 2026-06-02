import { NextResponse } from "next/server";

const ICS_CONTENT = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Mad Fresh Kitchen//Launch Party//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
DTSTART:20260529T020000Z
DTEND:20260529T040000Z
SUMMARY:Mad Fresh App Launch Party
DESCRIPTION:Free event! Be the first to access the Mad Fresh app\\, lock in founding member pricing that never goes up\\, and enjoy chef-crafted bowls. Limited to 100 guests.
LOCATION:455 S 48th St\\, Tempe\\, AZ 85281
URL:https://madfresh.app/events/app-launch-party-2026
ORGANIZER;CN=Mad Fresh Kitchen:mailto:hello@madfresh.app
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

export async function GET() {
  return new NextResponse(ICS_CONTENT, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="mad-fresh-launch-party.ics"',
    },
  });
}
