import { createClient } from "@/lib/supabase/server";
import ContactsTable from "@/components/admin/ContactsTable";
import { Contact, ContactSource } from "@/types/database";
import { Users, UserCheck, Mail } from "lucide-react";

// Stats Card Component
function StatsCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-4 bg-white border border-gray-200 shadow-sm rounded-lg p-4">
      <div className="p-3 rounded-lg bg-[#E8F5E3]">
        <Icon size={20} className="text-[#3d6b2a]" />
      </div>
      <div>
        <p className="text-[#9a9080] text-sm">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default async function ContactsPage() {
  const supabase = await createClient();
  const STORE_ID = "b0000000-0000-0000-0000-000000000001";

  // Fetch all contacts
  const { data: contacts, error: contactsError } = await supabase
    .from("contacts")
    .select("*")
    .eq("store_id", STORE_ID)
    .order("created_at", { ascending: false });

  if (contactsError) {
    console.error("Error fetching contacts:", contactsError);
  }

  // Calculate stats
  const totalContacts = contacts?.length || 0;
  const waitlistMembers = contacts?.filter((c) => c.is_waitlist_member).length || 0;
  const newsletterSubscribers = contacts?.filter((c) => c.is_newsletter_subscribed).length || 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1e2d18] mb-1">Contacts</h1>
          <p className="text-[#7a7060]">{totalContacts} total contacts</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          icon={Users}
          label="Total Contacts"
          value={totalContacts}
        />
        <StatsCard
          icon={UserCheck}
          label="Waitlist Members"
          value={waitlistMembers}
        />
        <StatsCard
          icon={Mail}
          label="Newsletter Subscribers"
          value={newsletterSubscribers}
        />
      </div>

      {/* Contacts Table */}
      <ContactsTable contacts={contacts || []} />
    </div>
  );
}
