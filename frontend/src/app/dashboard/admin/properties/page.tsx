"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Check, X, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DataTable from "@/components/shared/DataTable";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { formatPrice, formatDate } from "@/lib/utils";
import axios from "axios";

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const { data } = await api.get(`/admin/properties?${params.toString()}`);
      setProperties(data.properties || []);
      setTotalPages(data.pages || 1);
    } catch {
      toast.error("Failed to load properties");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const handleAction = async (id: string, action: string) => {
    try {
      if (action === "reject") {
        const rejectionReason = window.prompt("Enter rejection reason:")?.trim();
        if (!rejectionReason) {
          toast.error("Rejection reason is required");
          return;
        }
        await api.patch(`/properties/${id}/reject`, { rejectionReason });
      } else {
        await api.patch(`/properties/${id}/${action}`);
      }
      toast.success(`Property ${action}d!`);
      fetchProperties();
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { message?: string } | undefined)?.message
        : undefined;
      toast.error(message || "Action failed");
    }
  };

  const toggleFeatured = async (id: string) => {
    try {
      await api.patch(`/properties/${id}/feature`);
      toast.success("Featured status updated");
      fetchProperties();
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { message?: string } | undefined)?.message
        : undefined;
      toast.error(message || "Failed");
    }
  };

  const columns = [
    {
      key: "title",
      label: "Property",
      render: (p: any) => (
        <div>
          <p className="font-medium text-sm">{p.title}</p>
          <p className="text-xs text-gray-500 capitalize">{p.propertyType} - {p.listingType}</p>
        </div>
      ),
    },
    {
      key: "price",
      label: "Price",
      render: (p: any) => <span className="font-medium text-sm">{formatPrice(p.price)}</span>,
    },
    {
      key: "owner",
      label: "Owner",
      render: (p: any) => (
        <span className="text-sm">{p.owner?.firstName} {p.owner?.lastName}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (p: any) => (
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          p.status === "approved" ? "bg-green-100 text-green-700" :
          p.status === "pending" ? "bg-yellow-100 text-yellow-700" :
          p.status === "rejected" ? "bg-red-100 text-red-700" :
          "bg-gray-100 text-gray-700"
        }`}>
          {p.status}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Listed",
      render: (p: any) => <span className="text-xs text-gray-500">{formatDate(p.createdAt)}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      render: (p: any) => (
        <div className="flex items-center gap-1">
          {p.status === "pending" && (
            <>
              <Button size="sm" variant="success" onClick={() => handleAction(p._id, "approve")}>
                <Check className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleAction(p._id, "reject")}>
                <X className="h-3 w-3" />
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant={p.isFeatured ? "default" : "outline"}
            onClick={() => toggleFeatured(p._id)}
          >
            <Star className={`h-3 w-3 ${p.isFeatured ? "fill-current" : ""}`} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Properties</h1>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search properties..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="border rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={properties}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyMessage="No properties found"
      />
    </div>
  );
}
