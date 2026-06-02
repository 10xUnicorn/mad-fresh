"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import GlobalSearch from "./GlobalSearch";
import {
  LayoutDashboard,
  ShoppingBag,
  RefreshCw,
  UtensilsCrossed,
  ChefHat,
  Apple,
  Users,
  Calendar,
  CalendarDays,
  BarChart3,
  DollarSign,
  Megaphone,
  Package,
  Settings,
  Shield,
  FileText,
  Menu,
  X,
  Bell,
  LogOut,
  Truck,
  Percent,
  Image,
  Search,
  ListTodo,
  UserCheck,
  Eye,
  ArrowLeft,
  Loader,
} from "lucide-react";

interface AdminShellProps {
  user: {
    id: string;
    email: string;
    first_name: string;
  };
  role: string;
  children: React.ReactNode;
}

const navGroups = [
  {
    label: "OVERVIEW",
    items: [
      {
        name: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      {
        name: "Orders",
        href: "/admin/orders",
        icon: ShoppingBag,
      },
      {
        name: "Subscriptions",
        href: "/admin/subscriptions",
        icon: RefreshCw,
      },
      {
        name: "Catering",
        href: "/admin/catering",
        icon: UtensilsCrossed,
      },
      {
        name: "Proposals",
        href: "/admin/catering/proposals",
        icon: FileText,
      },
      {
        name: "SOPs",
        href: "/admin/sops", // admin/manager see management; staff/driver see /admin/sops/view
        icon: FileText,
        staffHref: "/admin/sops/view",
      },
      {
        name: "Tasks",
        href: "/admin/tasks",
        icon: ListTodo,
      },
      {
        name: "Kitchen Queue",
        href: "/admin/kitchen",
        icon: ChefHat,
      },
      {
        name: "Drivers",
        href: "/admin/drivers",
        icon: UserCheck,
      },
      {
        name: "Vendors",
        href: "/admin/vendors",
        icon: Truck,
      },
      {
        name: "Calendar",
        href: "/admin/calendar",
        icon: CalendarDays,
      },
    ],
  },
  {
    label: "MENU",
    items: [
      {
        name: "Recipes",
        href: "/admin/menu",
        icon: ChefHat,
      },
      {
        name: "Ingredients",
        href: "/admin/menu/ingredients",
        icon: Apple,
      },
      {
        name: "Media Library",
        href: "/admin/media",
        icon: Image,
      },
    ],
  },
  {
    label: "CUSTOMERS",
    items: [
      {
        name: "Contacts",
        href: "/admin/contacts",
        icon: Users,
      },
      {
        name: "Events & RSVPs",
        href: "/admin/events",
        icon: Calendar,
      },
    ],
  },
  {
    label: "BUSINESS",
    items: [
      {
        name: "Analytics",
        href: "/admin/analytics",
        icon: BarChart3,
      },
      {
        name: "Financials",
        href: "/admin/financials",
        icon: DollarSign,
      },
      {
        name: "Promo Codes",
        href: "/admin/promos",
        icon: Percent,
      },
      {
        name: "Marketing",
        href: "/admin/marketing",
        icon: Megaphone,
      },
      {
        name: "Inventory",
        href: "/admin/inventory",
        icon: Package,
      },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      {
        name: "Notifications",
        href: "/admin/notifications",
        icon: Bell,
      },
      {
        name: "Settings",
        href: "/admin/settings",
        icon: Settings,
      },
      {
        name: "Team",
        href: "/admin/team",
        icon: Shield,
      },
    ],
  },
];

interface CustomerSearchResult {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export default function AdminShell({
  user,
  role,
  children,
}: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<CustomerSearchResult[]>([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Search customers for impersonation
  const searchCustomers = async (query: string) => {
    if (query.length < 2) {
      setCustomerResults([]);
      return;
    }
    setCustomerSearchLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("user_profiles")
        .select("id, first_name, last_name, email")
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(8);
      setCustomerResults((data as CustomerSearchResult[]) || []);
    } catch {
      setCustomerResults([]);
    } finally {
      setCustomerSearchLoading(false);
    }
  };

  const handleViewAsCustomer = (customerId: string) => {
    setShowCustomerSearch(false);
    setCustomerQuery("");
    setCustomerResults([]);
    router.push(`/dashboard?impersonate=${customerId}`);
  };

  // Get page title from pathname
  const getPageTitle = () => {
    const pathSegments = pathname.split("/").filter(Boolean);
    if (pathSegments.length <= 1) return "Dashboard";

    const lastSegment = pathSegments[pathSegments.length - 1];
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, " ");
  };

  // Paths that should only match exactly (not as a prefix for child routes)
  const exactMatchPaths = ["/admin/catering"];

  const isActive = (href: string) => {
    if (href === "/admin" || exactMatchPaths.includes(href)) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Get user initials for avatar
  const getInitials = (firstName: string, email: string) => {
    if (firstName) {
      return firstName.slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(user.first_name, user.email);

  return (
    <div className="flex h-dvh bg-[#faf8f3]">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 w-72 bg-white border-r border-[#ddd8cc] flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 z-50`}
      >
        {/* Logo Section */}
        <div className="border-b border-[#ede9e2] p-6 flex-shrink-0">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-[#1e2d18]">MAD</span>
              <span className="text-xl font-black text-[#3d6b2a]">FRESH</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-block px-2.5 py-1 bg-[#e9f0e4] border border-[#3d6b2a]/20 rounded-full text-xs font-semibold text-[#3d6b2a]">
                Admin
              </div>
              <button
                onClick={() => setShowCustomerSearch(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#f2efe8] border border-[#ddd8cc] rounded-full text-xs font-medium text-[#7a7060] hover:text-[#1e2d18] hover:bg-[#f0ece3] transition"
              >
                <Eye size={12} />
                Customer View
              </button>
            </div>
          </div>
        </div>

        {/* Navigation — scrollable */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-8">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 text-xs font-semibold text-[#9a9080] uppercase tracking-wider mb-3">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isStaff = !["super_admin", "admin", "manager"].includes(role);
                  const href = (isStaff && (item as any).staffHref) ? (item as any).staffHref : item.href;
                  const active = isActive(href) || isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                        active
                          ? "bg-[#e9f0e4] border-l-[3px] border-[#3d6b2a] text-[#3d6b2a] font-bold"
                          : "text-[#7a7060] hover:text-[#1e2d18] hover:bg-[#f0ece3] border-l-[3px] border-transparent"
                      }`}
                    >
                      <Icon
                        size={20}
                        className={`flex-shrink-0 ${
                          active
                            ? "text-[#3d6b2a]"
                            : "text-[#9a9080] group-hover:text-[#7a7060]"
                        }`}
                      />
                      <span className="text-sm">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sign Out — pinned to bottom */}
        <div className="flex-shrink-0 border-t border-[#ede9e2] p-4 bg-[#f2efe8]">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#7a7060] hover:text-[#1e2d18] hover:bg-[#f0ece3] rounded-lg transition-all"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-md border-b border-[#ddd8cc] px-4 lg:px-8 py-4 flex items-center justify-between relative z-20">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-[#f0ece3] rounded-lg transition-colors text-[#1e2d18]"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="text-2xl font-bold text-[#1e2d18]">{getPageTitle()}</h1>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-[#f2efe8] hover:bg-[#f0ece3] border border-[#ddd8cc] rounded-xl transition-colors text-[#7a7060]"
            >
              <Search size={16} />
              <span className="text-sm hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-white border border-[#ddd8cc] rounded text-[#9a9080]">
                ⌘K
              </kbd>
            </button>
            <button className="p-2 hover:bg-[#f0ece3] rounded-lg transition-colors relative">
              <Bell size={20} className="text-[#7a7060]" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#3d6b2a] rounded-full" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-10 h-10 rounded-full bg-[#3d6b2a] flex items-center justify-center hover:ring-2 hover:ring-[#3d6b2a]/30 transition-all"
              >
                <span className="text-sm font-bold text-white">{initials}</span>
              </button>

              {showUserMenu && (
                <>
                  {/* Click-outside overlay */}
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-[#ddd8cc] rounded-xl shadow-[0_8px_32px_rgba(30,45,24,.12)] z-50 py-2">
                    <div className="px-4 py-2 border-b border-[#ede9e2]">
                      <p className="text-sm font-semibold text-[#1e2d18]">{user.first_name}</p>
                      <p className="text-xs text-[#9a9080] truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/admin/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-2 text-sm text-[#7a7060] hover:text-[#1e2d18] hover:bg-[#f0ece3] transition-colors"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-[#faf8f3] relative overscroll-contain -webkit-overflow-scrolling-touch">
          <div className="relative z-10 p-4 lg:p-8">{children}</div>
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Customer View Search Modal */}
      {showCustomerSearch && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => { setShowCustomerSearch(false); setCustomerQuery(""); setCustomerResults([]); }} />
          <div className="relative w-full max-w-md mx-4 bg-white border border-[#ddd8cc] rounded-2xl shadow-[0_8px_32px_rgba(30,45,24,.12)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#ede9e2]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-[#1e2d18] flex items-center gap-2">
                  <Eye size={16} className="text-[#3d6b2a]" />
                  View as Customer
                </h3>
                <button onClick={() => { setShowCustomerSearch(false); setCustomerQuery(""); setCustomerResults([]); }} className="p-1.5 hover:bg-[#f0ece3] rounded-lg transition">
                  <X size={16} className="text-[#9a9080]" />
                </button>
              </div>
              <input
                type="text"
                autoFocus
                placeholder="Search by name or email..."
                value={customerQuery}
                onChange={(e) => {
                  setCustomerQuery(e.target.value);
                  searchCustomers(e.target.value);
                }}
                className="w-full bg-white border border-[#ddd8cc] rounded-xl px-4 py-3 text-[#1e2d18] text-sm placeholder-[#9a9080] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20 focus:border-[#3d6b2a]"
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto">
              {/* My own customer view */}
              <button
                onClick={() => handleViewAsCustomer(user.id)}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#f0ece3] transition text-left border-b border-[#ede9e2]"
              >
                <div className="w-8 h-8 rounded-full bg-[#e9f0e4] flex items-center justify-center text-xs font-bold text-[#3d6b2a]">
                  {user.first_name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[#1e2d18] text-sm font-medium">My Customer View</p>
                  <p className="text-[#9a9080] text-xs truncate">{user.email}</p>
                </div>
              </button>

              {customerSearchLoading && (
                <div className="flex items-center justify-center py-6">
                  <Loader size={18} className="text-[#3d6b2a] animate-spin" />
                </div>
              )}

              {!customerSearchLoading && customerResults.length > 0 && (
                <div>
                  {customerResults.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleViewAsCustomer(c.id)}
                      className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#f0ece3] transition text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#f2efe8] flex items-center justify-center text-xs font-bold text-[#7a7060]">
                        {(c.first_name?.[0] || "").toUpperCase()}{(c.last_name?.[0] || "").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[#1e2d18] text-sm font-medium truncate">
                          {c.first_name} {c.last_name}
                        </p>
                        <p className="text-[#9a9080] text-xs truncate">{c.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!customerSearchLoading && customerQuery.length >= 2 && customerResults.length === 0 && (
                <div className="px-5 py-6 text-center">
                  <p className="text-[#9a9080] text-sm">No customers found</p>
                </div>
              )}

              {!customerSearchLoading && customerQuery.length < 2 && (
                <div className="px-5 py-6 text-center">
                  <p className="text-[#9a9080] text-xs">Type at least 2 characters to search</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
