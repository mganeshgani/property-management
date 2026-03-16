"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Building2,
  Calendar,
  Wrench,
  DollarSign,
  TrendingUp,
  Activity,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, analyticsRes] = await Promise.all([
          api.get("/admin/dashboard"),
          api.get("/admin/analytics"),
        ]);
        setDashboardData(dashRes.data.stats);
        setAnalytics(analyticsRes.data.analytics);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = dashboardData
    ? [
        { title: "Total Users", value: dashboardData.totalUsers || 0, icon: Users, color: "bg-blue-100 text-blue-600" },
        { title: "Total Properties", value: dashboardData.totalProperties || 0, icon: Building2, color: "bg-green-100 text-green-600" },
        { title: "Total Bookings", value: dashboardData.totalBookings || 0, icon: Calendar, color: "bg-yellow-100 text-yellow-600" },
        { title: "Maintenance Requests", value: dashboardData.maintenanceStats?.reduce((sum: number, s: any) => sum + s.count, 0) || 0, icon: Wrench, color: "bg-orange-100 text-orange-600" },
        { title: "Revenue", value: formatPrice(dashboardData.monthlyRevenue?.reduce((sum: number, r: any) => sum + r.total, 0) || 0), icon: DollarSign, color: "bg-purple-100 text-purple-600" },
        { title: "Pending Approvals", value: dashboardData.propertiesByStatus?.find((p: any) => p._id === "pending")?.count || 0, icon: Activity, color: "bg-red-100 text-red-600" },
      ]
    : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">System overview and analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((stat, index) => (
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Bookings by Month */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Bookings by Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.bookingsByMonth?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.bookingsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Properties by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Properties by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.propertyTypeDistribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.propertyTypeDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="count"
                    nameKey="_id"
                    label={({ _id, count }: any) => `${_id}: ${count}`}
                  >
                    {analytics.propertyTypeDistribution.map((_: any, index: number) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.revenueTrend?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatPrice(value)} />
                  <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Users by Role */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users by Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData?.usersByRole?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.usersByRole}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="count"
                    nameKey="_id"
                    label={({ _id, count }: any) => `${_id}: ${count}`}
                  >
                    {dashboardData.usersByRole.map((_: any, index: number) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/admin/users" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="font-semibold">Manage Users</p>
                <p className="text-sm text-gray-500">View and manage all users</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/admin/properties" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <Building2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-semibold">Manage Properties</p>
                <p className="text-sm text-gray-500">Approve and manage listings</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/admin/bookings" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <Calendar className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="font-semibold">All Bookings</p>
                <p className="text-sm text-gray-500">View all booking records</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
