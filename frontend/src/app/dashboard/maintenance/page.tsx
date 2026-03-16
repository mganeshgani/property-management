"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Wrench, Clock, Loader2, Plus, AlertTriangle, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";
import EmptyState from "@/components/shared/EmptyState";
import Pagination from "@/components/shared/Pagination";

export default function MaintenancePage() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);

  // Create form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    property: "",
    category: "plumbing",
    priority: "medium",
  });

  // Assign worker state
  const [showAssign, setShowAssign] = useState<string | null>(null);
  const [workers, setWorkers] = useState<any[]>([]);
  const [selectedWorker, setSelectedWorker] = useState("");

  const isCustomer = user?.role === "customer";
  const isOwner = user?.role === "owner";

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = "/maintenance/my-requests";
      if (isOwner) endpoint = "/maintenance/owner-requests";

      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (statusFilter) params.set("status", statusFilter);
      const { data } = await api.get(`${endpoint}?${params.toString()}`);
      setRequests(data.requests || []);
      setTotalPages(data.pages || 1);
    } catch {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, isOwner]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleCreate = async () => {
    if (!formData.title || !formData.property) {
      toast.error("Please fill required fields");
      return;
    }
    setCreateLoading(true);
    try {
      await api.post("/maintenance", { ...formData, propertyId: formData.property });
      toast.success("Maintenance request submitted!");
      setShowCreate(false);
      setFormData({ title: "", description: "", property: "", category: "plumbing", priority: "medium" });
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create request");
    } finally {
      setCreateLoading(false);
    }
  };

  const openCreateDialog = async () => {
    try {
      const { data } = await api.get("/bookings/my-bookings?status=approved");
      const bookings = data.bookings || [];
      const uniqueProps = bookings.map((b: any) => b.property).filter(Boolean);
      setProperties(uniqueProps);
    } catch {
      // silently fail
    }
    setShowCreate(true);
  };

  const openAssignDialog = async (requestId: string) => {
    try {
      const { data } = await api.get("/maintenance/workers");
      setWorkers(data.workers || []);
    } catch {
      // silently fail
    }
    setShowAssign(requestId);
  };

  const handleAssign = async () => {
    if (!selectedWorker || !showAssign) return;
    try {
      await api.patch(`/maintenance/${showAssign}/assign`, { workerId: selectedWorker });
      toast.success("Worker assigned!");
      setShowAssign(null);
      setSelectedWorker("");
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to assign worker");
    }
  };

  const handleClose = async (id: string) => {
    try {
      await api.patch(`/maintenance/${id}/close`);
      toast.success("Request closed!");
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to close");
    }
  };

  const priorityColors: Record<string, string> = {
    low: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-orange-100 text-orange-700",
    urgent: "bg-red-100 text-red-700",
  };

  const statusColors: Record<string, string> = {
    open: "bg-yellow-100 text-yellow-700",
    assigned: "bg-purple-100 text-purple-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    closed: "bg-gray-100 text-gray-700",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isOwner ? "Maintenance Requests" : "My Maintenance Requests"}
        </h1>
        <div className="flex items-center gap-3">
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
          {isCustomer && (
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          title="No maintenance requests"
          description={isCustomer ? "Submit a request when something needs fixing." : "No maintenance requests for your properties."}
        />
      ) : (
        <>
          <div className="space-y-4">
            {requests.map((req, index) => (
              <motion.div
                key={req._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-orange-100 rounded-xl shrink-0">
                          <Wrench className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{req.title}</h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityColors[req.priority]}`}>
                              {req.priority}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[req.status]}`}>
                              {req.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{req.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span>Property: {req.property?.title || "N/A"}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(req.createdAt)}
                            </span>
                            {req.assignedTo && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {req.assignedTo.firstName} {req.assignedTo.lastName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isOwner && (
                        <div className="flex gap-2 shrink-0">
                          {req.status === "open" && (
                            <Button size="sm" onClick={() => openAssignDialog(req._id)}>
                              Assign Worker
                            </Button>
                          )}
                          {req.status === "completed" && (
                            <Button size="sm" variant="outline" onClick={() => handleClose(req._id)}>
                              Close
                            </Button>
                          )}
                        </div>
                      )}
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

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Maintenance Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Property</Label>
              <select
                value={formData.property}
                onChange={(e) => setFormData({ ...formData, property: e.target.value })}
                className="w-full mt-1 border rounded-md px-3 py-2 text-sm"
              >
                <option value="">Select a property</option>
                {properties.map((p: any) => (
                  <option key={p._id} value={p._id}>{p.title}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief description of the issue"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full mt-1 border rounded-md px-3 py-2 text-sm"
                >
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                  <option value="carpentry">Carpentry</option>
                  <option value="painting">Painting</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label>Priority</Label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full mt-1 border rounded-md px-3 py-2 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createLoading}>
              {createLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Worker Dialog */}
      <Dialog open={!!showAssign} onOpenChange={() => setShowAssign(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Worker</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Select Worker</Label>
            <select
              value={selectedWorker}
              onChange={(e) => setSelectedWorker(e.target.value)}
              className="w-full mt-1 border rounded-md px-3 py-2 text-sm"
            >
              <option value="">Select a worker</option>
              {workers.map((w: any) => (
                <option key={w._id} value={w._id}>{w.firstName} {w.lastName}</option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssign(null)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={!selectedWorker}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
