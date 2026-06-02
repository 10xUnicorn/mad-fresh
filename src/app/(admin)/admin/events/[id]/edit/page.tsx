import { createClient } from "@/lib/supabase/server";
import EventEditor from "@/components/admin/EventEditor";
import { Event, EventRsvp } from "@/types/database";

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

interface EditEventPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("store_id", STORE_ID)
    .single();

  if (eventError || !event) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">Event not found</p>
      </div>
    );
  }

  const { data: rsvps } = await supabase
    .from("event_rsvps")
    .select("*")
    .eq("event_id", id)
    .order("created_at", { ascending: false });

  return (
    <EventEditor
      initialEvent={event as Event}
      rsvps={(rsvps as EventRsvp[]) || []}
    />
  );
}
