"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Calendar, DollarSign, Star, Users, Wrench, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

export default function OwnerDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeProperties: 0,
    totalBookings: 0,
    pendingBookings: 0,
    totalRevenue: 0,
    maintenanceRequests: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [propertiesRes, bookingsRes, maintenanceRes] = await Promise.all([
          api.get("/properties/owner/my-listings"),
          api.get("/bookings/owner-requests?limit=5"),
          api.get("/maintenance/owner-requests?limit=5"),
        ]);
        const properties = propertiesRes.data.properties || [];
        const bookings = bookingsRes.data.bookings || [];
        const maintenance = maintenanceRes.data.requests || [];

        setRecentBookings(bookings.slice(0, 5));
        setStats({
          totalProperties: properties.length,
          activeProperties: properties.filter((p: any) => p.status === "available").length,
          totalBookings: bookings.length,
          pendingBookings: bookings.filter((b: any) => b.status === "pending").length,
          totalRevenue: bookings.filter((b: any) => b.status === "approved" || b.status === "completed")
            .reduce((sum: number, b: any) => sum + (b.totalAmount || 0), 0),
          maintenanceRequests: maintenance.length,
        });
      } catch {
        // silently fail
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { title: "Total Properties", value: stats.totalProperties, icon: Building2, color: "bg-blue-100 text-blue-600" },
    { title: "Active Listings", value: stats.activeProperties, icon: TrendingUp, color: "bg-green-100 text-green-600" },
    { title: "Pending Bookings", value: stats.pendingBookings, icon: Calendar, color: "bg-yellow-100 text-yellow-600" },
    { title: "Total Revenue", value: formatPrice(stats.totalRevenue), icon: DollarSign, color: "bg-purple-100 text-purple-600" },
    { title: "Total Bookings", value: stats.totalBookings, icon: Users, color: "bg-indigo-100 text-indigo-600" },
    { title: "Maintenance", value: stats.maintenanceRequests, icon: Wrench, color: "bg-orange-100 text-orange-600" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Owner Dashboard
        </h1>
        <p className="text-gray-500 mt-1">Manage your properties and bookings</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/owner/properties/add" className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <Building2 className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">Add New Property</span>
            </Link>
            <Link href="/dashboard/bookings" className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <Calendar className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">View Booking Requests</span>
            </Link>
            <Link href="/dashboard/maintenance" className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
              <Wrench className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium">Maintenance Requests</span>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Booking Requests</CardTitle>
            <Link href="/dashboard/bookings" className="text-sm text-blue-600">View all</Link>
          </CardHeader>
          <CardContent>
            {recentBookings.length > 0 ? (
              <div className="space-y-3">
                {recentBookings.map((booking: any) => (
                  <div key={booking._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{booking.property?.title || "Property"}</p>
                      <p className="text-xs text-gray-500">
                        {(booking.tenant as any)?.firstName} {(booking.tenant as any)?.lastName}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      booking.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                      booking.status === "approved" ? "bg-green-100 text-green-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4 text-sm">No booking requests</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
