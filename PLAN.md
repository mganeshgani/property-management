# Property Management System — Build Plan

## Architecture Overview
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
- **Backend**: Node.js 20 + Express.js
- **Database**: MongoDB Atlas + Mongoose
- **Auth**: JWT (access + refresh tokens)
- **Storage**: Cloudinary (images)
- **Email**: Nodemailer + Handlebars templates

## Modules & Files

### Backend (`/backend`)

#### Config
- `db.js` — MongoDB connection
- `cloudinary.js` — Cloudinary config
- `email.js` — Nodemailer transporter

#### Models
- `User.js` — User schema (customer, owner, worker, admin)
- `Property.js` — Property listings with images, location, amenities
- `Booking.js` — Booking requests (buy, rent, visit)
- `MaintenanceRequest.js` — Maintenance tickets
- `Review.js` — Property reviews (1-5 stars)
- `Notification.js` — In-app notifications
- `Payment.js` — Payment records

#### Controllers
- `authController.js` — Register, login, logout, refresh, OTP, reset password
- `propertyController.js` — CRUD, search, filter, approve/reject
- `bookingController.js` — Create, approve, reject, cancel, complete
- `maintenanceController.js` — Create, assign, update status
- `reviewController.js` — Create, list, delete
- `notificationController.js` — List, mark read, delete
- `adminController.js` — Dashboard stats, user mgmt, analytics

#### Routes
- `authRoutes.js`
- `propertyRoutes.js`
- `bookingRoutes.js`
- `maintenanceRoutes.js`
- `reviewRoutes.js`
- `notificationRoutes.js`
- `adminRoutes.js`

#### Middleware
- `authMiddleware.js` — JWT verification + role checking
- `errorHandler.js` — Global error handling
- `upload.js` — Multer + Cloudinary upload

#### Utils
- `emailTemplates.js` — Handlebars HTML email templates
- `sendEmail.js` — Email sending utility
- `generateToken.js` — JWT token generation
- `ApiError.js` — Custom error class

### Frontend (`/frontend`)

#### Pages (App Router)
- `/` — Home page
- `/properties` — Listings with filters
- `/properties/[slug]` — Property details
- `/compare` — Compare properties
- `/auth/login` — Login
- `/auth/register` — Multi-step registration
- `/auth/forgot-password` — Forgot password
- `/auth/verify-otp` — OTP verification
- `/auth/reset-password` — Reset password
- `/dashboard/customer/*` — Customer dashboard pages
- `/dashboard/owner/*` — Owner dashboard pages
- `/dashboard/worker/*` — Worker dashboard pages
- `/dashboard/admin/*` — Admin dashboard pages

#### Shared Components
- Navbar, Sidebar, PropertyCard, BookingCard, MaintenanceCard
- DataTable, Modal, ImageUpload, StarRating, Skeleton
- StatusBadge, Pagination, FilterSidebar, NotificationDropdown
- ProtectedRoute, EmptyState

## Build Order
1. Phase 0: Setup & install dependencies
2. Phase 1: Backend auth module
3. Phase 2: Property module (backend)
4. Phase 3: Booking, maintenance, review, notification (backend)
5. Phase 4: Admin routes (backend)
6. Phase 5: Frontend foundation
7. Phase 6: Auth pages (frontend)
8. Phase 7: Property pages (frontend)
9. Phase 8: Dashboard pages (frontend)
10. Phase 9: Polish & deploy prep
