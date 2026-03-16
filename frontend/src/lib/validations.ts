import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please provide a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Please provide a valid email"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(/\d/, "Password must contain a number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  phone: z.string().optional(),
  role: z.enum(["customer", "owner", "worker"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please provide a valid email"),
});

export const otpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(/\d/, "Password must contain a number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  resetToken: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(6, "New password must be at least 6 characters")
    .regex(/\d/, "New password must contain a number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const propertySchema = z.object({
  title: z.string().min(1, "Title is required").max(150),
  description: z.string().min(1, "Description is required").max(2000),
  propertyType: z.enum(["house", "flat", "villa", "plot", "commercial"]),
  listingType: z.enum(["sale", "rent", "lease"]),
  price: z.number().min(0, "Price cannot be negative"),
  priceUnit: z.enum(["total", "per_month", "per_year"]),
  area: z.number().min(1, "Area must be at least 1"),
  bedrooms: z.number().min(0),
  bathrooms: z.number().min(0),
  floors: z.number().min(1),
  furnishing: z.enum(["furnished", "semi", "unfurnished"]),
  amenities: z.array(z.string()).optional(),
  location: z.object({
    address: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    pincode: z.string().min(1, "Pincode is required"),
    country: z.string().optional(),
  }),
});

export const bookingSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  bookingType: z.enum(["buy", "rent", "visit"]),
  visitDate: z.string().optional(),
  moveInDate: z.string().optional(),
  moveOutDate: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const reviewSchema = z.object({
  propertyId: z.string().min(1),
  bookingId: z.string().min(1),
  rating: z.number().min(1).max(5),
  comment: z.string().min(1, "Comment is required").max(500),
});

export const maintenanceSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  title: z.string().min(1, "Title is required").max(150),
  description: z.string().min(1, "Description is required").max(1000),
  category: z.enum(["plumbing", "electrical", "carpentry", "painting", "cleaning", "other"]),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

export const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  phone: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type OtpInput = z.infer<typeof otpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type PropertyInput = z.infer<typeof propertySchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type MaintenanceInput = z.infer<typeof maintenanceSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
