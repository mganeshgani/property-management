"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Home, Wrench, Star, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import Link from "next/link";

interface DashboardStats {
  totalBookings: number;
  activeBookings: number;
  maintenanceRequests: number;
  reviewsGiven: number;
}

export default function CustomerDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    activeBookings: 0,
    maintenanceRequests: 0,
    reviewsGiven: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingsRes, maintenanceRes] = await Promise.all([
          api.get("/bookings/my-bookings?limit=5"),
          api.get("/maintenance/my-requests?limit=5"),
        ]);
        const bookings = bookingsRes.data.bookings || [];
        const maintenance = maintenanceRes.data.requests || [];
        setRecentBookings(bookings.slice(0, 5));
        setStats({
          totalBookings: bookingsRes.data.total || bookings.length,
          activeBookings: bookings.filter((b: any) => b.status === "approved").length,
          maintenanceRequests: maintenanceRes.data.total || maintenance.length,
          reviewsGiven: 0,
        });
      } catch {
        // silently fail
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { title: "Total Bookings", value: stats.totalBookings, icon: Calendar, color: "blue", href: "/dashboard/bookings" },
    { title: "Active Bookings", value: stats.activeBookings, icon: CheckCircle, color: "green", href: "/dashboard/bookings" },
    { title: "Maintenance Requests", value: stats.maintenanceRequests, icon: Wrench, color: "orange", href: "/dashboard/maintenance" },
    { title: "Reviews Given", value: stats.reviewsGiven, icon: Star, color: "purple", href: "#" },
  ];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    orange: "bg-orange-100 text-orange-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-500 mt-1">Here&apos;s your dashboard overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{stat.title}</p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${colorMap[stat.color]}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Bookings</CardTitle>
          <Link href="/dashboard/bookings" className="text-sm text-blue-600 hover:text-blue-800">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {recentBookings.length > 0 ? (
            <div className="space-y-4">
              {recentBookings.map((booking: any) => (
                <div key={booking._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Home className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {booking.property?.title || "Property"}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(booking.moveInDate).toLocaleDateString()} - {new Date(booking.moveOutDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    booking.status === "approved" ? "bg-green-100 text-green-700" :
                    booking.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                    booking.status === "rejected" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No bookings yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
