"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2, Search, UserX, UserCheck, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DataTable from "@/components/shared/DataTable";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      const { data } = await api.get(`/admin/users?${params.toString()}`);
      setUsers(data.users || []);
      setTotalPages(data.pages || 1);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleUserActive = async (userId: string) => {
    try {
      await api.patch(`/admin/users/${userId}/toggle-active`);
      toast.success("User status updated");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed");
    }
  };

  const changeRole = async (userId: string, role: string) => {
    try {
      await api.patch(`/admin/users/${userId}/change-role`, { role });
      toast.success("Role updated");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed");
    }
  };

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (user: any) => (
        <div>
          <p className="font-medium">{user.firstName} {user.lastName}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (user: any) => (
        <select
          value={user.role}
          onChange={(e) => changeRole(user._id, e.target.value)}
          className="text-xs border rounded px-2 py-1 capitalize"
        >
          <option value="customer">Customer</option>
          <option value="owner">Owner</option>
          <option value="worker">Worker</option>
          <option value="admin">Admin</option>
        </select>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      render: (user: any) => <span className="text-sm">{user.phone || "-"}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (user: any) => (
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}>
          {user.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Joined",
      render: (user: any) => <span className="text-xs text-gray-500">{formatDate(user.createdAt)}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      render: (user: any) => (
        <Button
          size="sm"
          variant={user.isActive ? "destructive" : "success"}
          onClick={() => toggleUserActive(user._id)}
        >
          {user.isActive ? <UserX className="h-3 w-3 mr-1" /> : <UserCheck className="h-3 w-3 mr-1" />}
          {user.isActive ? "Deactivate" : "Activate"}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="border rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Roles</option>
              <option value="customer">Customer</option>
              <option value="owner">Owner</option>
              <option value="worker">Worker</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyMessage="No users found"
      />
    </div>
  );
}
