"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      switch (user.role) {
        case "admin":
          router.replace("/dashboard/admin");
          break;
        case "owner":
          router.replace("/dashboard/owner");
          break;
        case "worker":
          router.replace("/dashboard/worker");
          break;
        default:
          router.replace("/dashboard/customer");
      }
    }
  }, [user, router]);

  return null;
}
