import ProposalGenerator from '@/components/admin/ProposalGenerator';
import { createClient } from '@/lib/supabase/server';
import { FileText } from 'lucide-react';

export default async function ProposalsPage() {
  const supabase = await createClient();
  const STORE_ID = "b0000000-0000-0000-0000-000000000001";

  // Fetch catering orders (for linking)
  const { data: cateringOrders, error: ordersError } = await supabase
    .from('catering_orders')
    .select('id, order_number, event_name, event_date, contact_name, contact_email, contact_phone, venue_name, venue_address, estimated_guests, total_amount, status')
    .eq('store_id', STORE_ID)
    .order('event_date', { ascending: false });

  if (ordersError) {
    console.error('Error fetching catering orders:', ordersError);
  }

  // Fetch catering proposals
  const { data: cateringProposals, error: proposalsError } = await supabase
    .from('catering_proposals')
    .select('*')
    .eq('store_id', STORE_ID)
    .order('created_at', { ascending: false });

  if (proposalsError) {
    console.error('Error fetching catering proposals:', proposalsError);
  }

  const proposals = cateringProposals || [];
  const orders = cateringOrders || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1e2d18] mb-1 flex items-center gap-3">
            <FileText size={32} className="text-[#3d6b2a]" />
            Proposals
          </h1>
          <p className="text-[#7a7060]">
            {proposals.length} proposal{proposals.length !== 1 ? 's' : ''} &middot; Generate, manage, and send proposals
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Proposals", value: proposals.length },
          { label: "Drafts", value: proposals.filter(p => p.status === 'draft').length },
          { label: "Sent", value: proposals.filter(p => p.status === 'sent').length },
          { label: "Accepted", value: proposals.filter(p => p.status === 'accepted').length },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5">
            <p className="text-[#9a9080] text-sm mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      <ProposalGenerator
        cateringOrders={orders}
        existingProposals={proposals}
      />
    </div>
  );
}
