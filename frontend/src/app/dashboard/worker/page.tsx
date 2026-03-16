"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wrench, Clock, CheckCircle, AlertTriangle, PlayCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";

export default function WorkerDashboard() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const { data } = await api.get("/maintenance/worker-tasks");
      setTasks(data.tasks || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStart = async (id: string) => {
    try {
      await api.patch(`/maintenance/${id}/start`);
      toast.success("Task started!");
      fetchTasks();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to start task");
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await api.patch(`/maintenance/${id}/complete`);
      toast.success("Task completed!");
      fetchTasks();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to complete task");
    }
  };

  const assigned = tasks.filter((t) => t.status === "assigned");
  const inProgress = tasks.filter((t) => t.status === "in_progress");
  const completed = tasks.filter((t) => t.status === "completed");

  const statCards = [
    { title: "Assigned Tasks", value: assigned.length, icon: AlertTriangle, color: "bg-yellow-100 text-yellow-600" },
    { title: "In Progress", value: inProgress.length, icon: PlayCircle, color: "bg-blue-100 text-blue-600" },
    { title: "Completed", value: completed.length, icon: CheckCircle, color: "bg-green-100 text-green-600" },
    { title: "Total Tasks", value: tasks.length, icon: Wrench, color: "bg-purple-100 text-purple-600" },
  ];

  const priorityColor: Record<string, string> = {
    low: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-orange-100 text-orange-700",
    urgent: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Worker Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage your maintenance tasks</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-2.5 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Active Tasks */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Active Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {[...assigned, ...inProgress].length > 0 ? (
            <div className="space-y-4">
              {[...assigned, ...inProgress].map((task) => (
                <div key={task._id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm">{task.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityColor[task.priority] || "bg-gray-100 text-gray-700"}`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">{task.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(task.createdAt)}
                      </span>
                      <span>Property: {task.property?.title || "N/A"}</span>
                    </div>
                  </div>
                  <div className="ml-4 shrink-0">
                    {task.status === "assigned" && (
                      <Button size="sm" onClick={() => handleStart(task._id)}>
                        <PlayCircle className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    )}
                    {task.status === "in_progress" && (
                      <Button size="sm" variant="success" onClick={() => handleComplete(task._id)}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8 text-sm">No active tasks</p>
          )}
        </CardContent>
      </Card>

      {/* Completed Tasks */}
      {completed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completed.slice(0, 5).map((task) => (
                <div key={task._id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-gray-500">Completed {formatDate(task.completedAt || task.updatedAt)}</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
