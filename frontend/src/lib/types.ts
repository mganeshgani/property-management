export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: { url: string; publicId: string };
  role: "customer" | "owner" | "worker" | "admin";
  isEmailVerified: boolean;
  isActive: boolean;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PropertyImage {
  url: string;
  publicId: string;
}

export interface Property {
  _id: string;
  title: string;
  slug: string;
  description: string;
  propertyType: "house" | "flat" | "villa" | "plot" | "commercial";
  listingType: "sale" | "rent" | "lease";
  price: number;
  priceUnit: "total" | "per_month" | "per_year";
  area: number;
  bedrooms: number;
  bathrooms: number;
  floors: number;
  furnishing: "furnished" | "semi" | "unfurnished";
  amenities: string[];
  location: {
    address: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
  images: PropertyImage[];
  owner: User | string;
  status: "pending" | "approved" | "available" | "booked" | "sold" | "rented" | "rejected";
  isActive: boolean;
  views: number;
  isFeatured: boolean;
  rejectionReason?: string;
  bookingCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  _id: string;
  property: Property | string;
  tenant: User | string;
  owner: User | string;
  bookingType: "buy" | "rent" | "visit";
  visitDate?: string;
  moveInDate?: string;
  moveOutDate?: string;
  duration?: number;
  totalAmount: number;
  depositAmount: number;
  status: "pending" | "approved" | "rejected" | "cancelled" | "completed";
  paymentStatus: "unpaid" | "partial" | "paid";
  notes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceRequest {
  _id: string;
  property: Property | string;
  raisedBy: User | string;
  assignedTo?: User | string;
  owner: User | string;
  title: string;
  description: string;
  category: "plumbing" | "electrical" | "carpentry" | "painting" | "cleaning" | "other";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "assigned" | "in_progress" | "completed" | "closed";
  images: PropertyImage[];
  workerNotes?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  property: string;
  reviewer: User | string;
  booking: string;
  rating: number;
  comment: string;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  user: string;
  type: "booking" | "maintenance" | "property" | "system" | "payment";
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  total: number;
  page: number;
  pages: number;
  [key: string]: T[] | boolean | number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  [key: string]: T | boolean | string | undefined;
}
