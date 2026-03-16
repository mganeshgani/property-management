"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Home, Loader2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { formatPrice, formatDate } from "@/lib/utils";
import EmptyState from "@/components/shared/EmptyState";
import Pagination from "@/components/shared/Pagination";

export default function BookingsPage() {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const isOwner = user?.role === "owner";

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = isOwner ? "/bookings/owner-requests" : "/bookings/my-bookings";
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (statusFilter) params.set("status", statusFilter);
      const { data } = await api.get(`${endpoint}?${params.toString()}`);
      setBookings(data.bookings || []);
      setTotalPages(data.pages || 1);
    } catch {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, isOwner]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleAction = async (bookingId: string, action: string) => {
    try {
      await api.patch(`/bookings/${bookingId}/${action}`);
      toast.success(`Booking ${action}d successfully!`);
      fetchBookings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${action} booking`);
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    completed: "bg-blue-100 text-blue-700",
    cancelled: "bg-gray-100 text-gray-700",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isOwner ? "Booking Requests" : "My Bookings"}
        </h1>
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
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          title="No bookings found"
          description={isOwner ? "No booking requests for your properties yet." : "You haven't made any bookings yet."}
        />
      ) : (
        <>
          <div className="space-y-4">
            {bookings.map((booking, index) => (
              <motion.div
                key={booking._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl shrink-0">
                          <Home className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{booking.property?.title || "Property"}</h3>
                          {isOwner && (
                            <p className="text-sm text-gray-500">
                              By: {booking.tenant?.firstName} {booking.tenant?.lastName}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(booking.moveInDate)} - {formatDate(booking.moveOutDate)}
                            </span>
                            {booking.totalAmount > 0 && (
                              <span className="font-medium text-gray-900">
                                {formatPrice(booking.totalAmount)}
                              </span>
                            )}
                          </div>
                          {booking.notes && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                              &quot;{booking.notes}&quot;
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColors[booking.status] || "bg-gray-100 text-gray-700"}`}>
                          {booking.status}
                        </span>

                        {isOwner && booking.status === "pending" && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="success" onClick={() => handleAction(booking._id, "approve")}>
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleAction(booking._id, "reject")}>
                              Reject
                            </Button>
                          </div>
                        )}
                        {isOwner && booking.status === "approved" && (
                          <Button size="sm" onClick={() => handleAction(booking._id, "complete")}>
                            Complete
                          </Button>
                        )}
                        {!isOwner && booking.status === "pending" && (
                          <Button size="sm" variant="outline" onClick={() => handleAction(booking._id, "cancel")}>
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
