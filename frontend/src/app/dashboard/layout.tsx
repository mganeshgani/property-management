"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import Navbar from "@/components/shared/Navbar";
import Sidebar, { MobileSidebar } from "@/components/shared/Sidebar";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, fetchUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user && isLoading) {
      fetchUser().catch(() => {
        router.push("/auth/login");
      });
    }
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, fetchUser, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8 min-h-[calc(100vh-64px)]">
          {children}
        </main>
      </div>
      <MobileSidebar />
    </div>
  );
}
