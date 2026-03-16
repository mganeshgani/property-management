"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  LayoutDashboard, Building2, CalendarCheck, Wrench,
  Heart, User, PlusCircle, Users, BarChart3,
  ChevronLeft, ChevronRight, ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const roleMenus: Record<string, SidebarLink[]> = {
  customer: [
    { href: "/dashboard/customer", label: "Overview", icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/dashboard/bookings", label: "My Bookings", icon: <CalendarCheck className="h-5 w-5" /> },
    { href: "/dashboard/maintenance", label: "Maintenance", icon: <Wrench className="h-5 w-5" /> },
    { href: "/dashboard/notifications", label: "Notifications", icon: <ClipboardList className="h-5 w-5" /> },
    { href: "/dashboard/profile", label: "Profile", icon: <User className="h-5 w-5" /> },
  ],
  owner: [
    { href: "/dashboard/owner", label: "Overview", icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/dashboard/owner/properties", label: "My Properties", icon: <Building2 className="h-5 w-5" /> },
    { href: "/dashboard/owner/properties/add", label: "Add Property", icon: <PlusCircle className="h-5 w-5" /> },
    { href: "/dashboard/bookings", label: "Bookings", icon: <CalendarCheck className="h-5 w-5" /> },
    { href: "/dashboard/maintenance", label: "Maintenance", icon: <Wrench className="h-5 w-5" /> },
    { href: "/dashboard/profile", label: "Profile", icon: <User className="h-5 w-5" /> },
  ],
  worker: [
    { href: "/dashboard/worker", label: "Overview", icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/dashboard/maintenance", label: "My Tasks", icon: <ClipboardList className="h-5 w-5" /> },
    { href: "/dashboard/notifications", label: "Notifications", icon: <CalendarCheck className="h-5 w-5" /> },
    { href: "/dashboard/profile", label: "Profile", icon: <User className="h-5 w-5" /> },
  ],
  admin: [
    { href: "/dashboard/admin", label: "Overview", icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/dashboard/admin/users", label: "Users", icon: <Users className="h-5 w-5" /> },
    { href: "/dashboard/admin/properties", label: "Properties", icon: <Building2 className="h-5 w-5" /> },
    { href: "/dashboard/admin/bookings", label: "Bookings", icon: <CalendarCheck className="h-5 w-5" /> },
    { href: "/dashboard/admin/maintenance", label: "Maintenance", icon: <Wrench className="h-5 w-5" /> },
    { href: "/dashboard/profile", label: "Profile", icon: <User className="h-5 w-5" /> },
  ],
};

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuthStore();
  const pathname = usePathname();

  if (!user) return null;

  const menus = roleMenus[user.role] || roleMenus.customer;

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 min-h-[calc(100vh-64px)]",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex-1 py-4">
        <div className="px-3 mb-4">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>
        <nav className="space-y-1 px-3">
          {menus.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
                title={collapsed ? link.label : undefined}
              >
                {link.icon}
                {!collapsed && <span>{link.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

// Mobile sidebar/bottom nav
export function MobileSidebar() {
  const { user } = useAuthStore();
  const pathname = usePathname();

  if (!user) return null;

  const menus = (roleMenus[user.role] || roleMenus.customer).slice(0, 5);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 px-2 py-1 safe-area-bottom">
      <div className="flex justify-around">
        {menus.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-xs transition-colors min-w-0",
                isActive ? "text-blue-600" : "text-gray-500"
              )}
            >
              {link.icon}
              <span className="truncate max-w-[60px]">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
