// Status Badge Component
export function StatusBadge({ status }: { status: string }) {
  const statusColors: Record<string, { bg: string; text: string }> = {
    pending: { bg: "bg-yellow-100", text: "text-yellow-700" },
    confirmed: { bg: "bg-blue-100", text: "text-blue-700" },
    preparing: { bg: "bg-orange-100", text: "text-orange-700" },
    ready: { bg: "bg-green-100", text: "text-green-700" },
    out_for_delivery: { bg: "bg-cyan-100", text: "text-cyan-700" },
    delivered: { bg: "bg-green-100", text: "text-green-700" },
    completed: { bg: "bg-green-100", text: "text-green-700" },
    cancelled: { bg: "bg-red-100", text: "text-red-700" },
    refunded: { bg: "bg-red-100", text: "text-red-700" },
  };

  const color = statusColors[status] || statusColors.pending;

  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${color.bg} ${color.text}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

// Payment Status Badge
export function PaymentStatusBadge({ status }: { status: string }) {
  const statusColors: Record<string, { bg: string; text: string }> = {
    paid: { bg: "bg-green-100", text: "text-green-700" },
    pending: { bg: "bg-yellow-100", text: "text-yellow-700" },
    failed: { bg: "bg-red-100", text: "text-red-700" },
    refunded: { bg: "bg-red-100", text: "text-red-700" },
    partially_refunded: { bg: "bg-orange-100", text: "text-orange-700" },
  };

  const color = statusColors[status] || statusColors.pending;

  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${color.bg} ${color.text}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

// Order Type Badge
export function OrderTypeBadge({ type }: { type: string }) {
  const typeColors: Record<string, { bg: string; text: string }> = {
    individual: { bg: "bg-purple-100", text: "text-purple-700" },
    catering: { bg: "bg-pink-100", text: "text-pink-700" },
    subscription: { bg: "bg-blue-100", text: "text-blue-700" },
    event: { bg: "bg-indigo-100", text: "text-indigo-700" },
  };

  const color = typeColors[type] || typeColors.individual;

  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${color.bg} ${color.text}`}
    >
      {type}
    </span>
  );
}
