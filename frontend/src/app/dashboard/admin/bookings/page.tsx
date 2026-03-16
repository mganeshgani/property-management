"use client";

import { useEffect, useState, useCallback } from "react";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import DataTable from "@/components/shared/DataTable";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { formatPrice, formatDate } from "@/lib/utils";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (statusFilter) params.set("status", statusFilter);
      const { data } = await api.get(`/admin/bookings?${params.toString()}`);
      setBookings(data.bookings || []);
      setTotalPages(data.pages || 1);
    } catch {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const columns = [
    {
      key: "property",
      label: "Property",
      render: (b: any) => <span className="text-sm font-medium">{b.property?.title || "N/A"}</span>,
    },
    {
      key: "customer",
      label: "Customer",
      render: (b: any) => (
        <span className="text-sm">{b.tenant?.firstName} {b.tenant?.lastName}</span>
      ),
    },
    {
      key: "dates",
      label: "Dates",
      render: (b: any) => (
        <span className="text-xs text-gray-500">
          {formatDate(b.moveInDate)} - {formatDate(b.moveOutDate)}
        </span>
      ),
    },
    {
      key: "totalAmount",
      label: "Amount",
      render: (b: any) => <span className="text-sm font-medium">{formatPrice(b.totalAmount || 0)}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (b: any) => (
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          b.status === "approved" ? "bg-green-100 text-green-700" :
          b.status === "pending" ? "bg-yellow-100 text-yellow-700" :
          b.status === "rejected" ? "bg-red-100 text-red-700" :
          b.status === "completed" ? "bg-blue-100 text-blue-700" :
          "bg-gray-100 text-gray-700"
        }`}>
          {b.status}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Booked On",
      render: (b: any) => <span className="text-xs text-gray-500">{formatDate(b.createdAt)}</span>,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">All Bookings</h1>

      <Card className="mb-6">
        <CardContent className="p-4">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={bookings}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyMessage="No bookings found"
      />
    </div>
  );
}
