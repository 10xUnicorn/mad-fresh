import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import DOMPurify from 'isomorphic-dompurify';

interface Params {
  id: string;
}

export default async function ProposalPage({ params }: { params: Params }) {
  const supabase = await createClient();

  // Fetch the proposal
  const { data: proposal, error } = await supabase
    .from('catering_proposals')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !proposal) {
    notFound();
  }

  // Update status to 'viewed' if it's currently 'sent'
  if (proposal.status === 'sent') {
    await supabase
      .from('catering_proposals')
      .update({ status: 'viewed' })
      .eq('id', proposal.id)
      .select()
      .single();
  }

  return (
    <div className="min-h-screen bg-black">
      <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(proposal.proposal_html) }} />
    </div>
  );
}
