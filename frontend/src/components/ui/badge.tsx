import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "secondary" | "outline";
  className?: string;
}

const variantStyles = {
  default: "bg-gray-100 text-gray-800",
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  danger: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
  secondary: "bg-purple-100 text-purple-800",
  outline: "bg-transparent border border-gray-300 text-gray-700",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// Status badge helper
const statusVariants: Record<string, BadgeProps["variant"]> = {
  pending: "warning",
  approved: "success",
  available: "success",
  booked: "info",
  sold: "secondary",
  rented: "info",
  rejected: "danger",
  cancelled: "danger",
  completed: "success",
  open: "warning",
  assigned: "info",
  in_progress: "info",
  closed: "default",
  unpaid: "danger",
  partial: "warning",
  paid: "success",
  low: "default",
  medium: "warning",
  high: "danger",
  urgent: "danger",
};

export function StatusBadge({ status }: { status: string }) {
  const variant = statusVariants[status] || "default";
  const label = status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  return <Badge variant={variant}>{label}</Badge>;
}
