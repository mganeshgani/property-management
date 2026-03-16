"use client";

import { useEffect, useState, useCallback } from "react";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import DataTable from "@/components/shared/DataTable";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";

export default function AdminMaintenancePage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (statusFilter) params.set("status", statusFilter);
      const { data } = await api.get(`/admin/maintenance?${params.toString()}`);
      setRequests(data.requests || []);
      setTotalPages(data.pages || 1);
    } catch {
      toast.error("Failed to load maintenance requests");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const columns = [
    {
      key: "title",
      label: "Title",
      render: (r: any) => (
        <div>
          <p className="text-sm font-medium">{r.title}</p>
          <p className="text-xs text-gray-500 capitalize">{r.category}</p>
        </div>
      ),
    },
    {
      key: "property",
      label: "Property",
      render: (r: any) => <span className="text-sm">{r.property?.title || "N/A"}</span>,
    },
    {
      key: "priority",
      label: "Priority",
      render: (r: any) => (
        <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
          r.priority === "urgent" ? "bg-red-100 text-red-700" :
          r.priority === "high" ? "bg-orange-100 text-orange-700" :
          r.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
          "bg-green-100 text-green-700"
        }`}>
          {r.priority}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (r: any) => (
        <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
          r.status === "completed" ? "bg-green-100 text-green-700" :
          r.status === "in_progress" ? "bg-blue-100 text-blue-700" :
          r.status === "assigned" ? "bg-purple-100 text-purple-700" :
          r.status === "open" ? "bg-yellow-100 text-yellow-700" :
          "bg-gray-100 text-gray-700"
        }`}>
          {r.status}
        </span>
      ),
    },
    {
      key: "worker",
      label: "Worker",
      render: (r: any) => (
        <span className="text-sm">{r.assignedTo ? `${r.assignedTo.firstName} ${r.assignedTo.lastName}` : "Unassigned"}</span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (r: any) => <span className="text-xs text-gray-500">{formatDate(r.createdAt)}</span>,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">All Maintenance Requests</h1>

      <Card className="mb-6">
        <CardContent className="p-4">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="closed">Closed</option>
          </select>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={requests}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyMessage="No maintenance requests found"
      />
    </div>
  );
}
