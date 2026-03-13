# PropertyManager - Full-Stack Property Management System

A production-grade, full-stack property management platform built with **Next.js 14**, **Express.js**, and **MongoDB**. Supports 4 user roles (Customer, Owner, Worker, Admin) with complete property listing, booking, maintenance, and admin management flows.

---

## Features

### Authentication & Authorization
- JWT-based auth with access + refresh token rotation
- Multi-step registration with role selection
- OTP-based forgot password flow via email
- Role-based access control (RBAC) for all routes

### Property Management
- Property CRUD with multi-image upload (Cloudinary)
- Advanced search with filters (type, price range, location, amenities)
- Property comparison (side-by-side up to 4 properties)
- Admin approval workflow for new listings
- Featured property highlighting

### Booking System
- Customers can book properties (rent/sale/visit)
- Owners approve/reject/complete booking requests
- Real-time status tracking with email notifications

### Maintenance Requests
- Tenants raise maintenance requests per property
- Owners assign workers to requests
- Workers update task status (start → complete)
- Full lifecycle tracking (pending → assigned → in-progress → completed → closed)

### Admin Dashboard
- System-wide analytics with Recharts (bookings, revenue, property types, user roles)
- User management (search, filter, toggle active, change roles)
- Property management (approve/reject, toggle featured)
- Booking and maintenance oversight

### Notifications
- In-app notification system with real-time unread count
- Email notifications for key events (booking updates, maintenance assignments, property approvals)
- Mark read/unread, bulk mark all read, delete

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js 20 + Express.js | REST API server |
| MongoDB + Mongoose | Database & ODM |
| JWT (jsonwebtoken) | Authentication |
| bcryptjs | Password hashing |
| Nodemailer + Handlebars | Email templates |
| Cloudinary | Image storage & optimization |
| Multer | File upload middleware |
| express-validator | Request validation |
| express-rate-limit | Rate limiting |
| helmet | Security headers |
| morgan | HTTP logging |
| compression | Response compression |
| cookie-parser | Cookie handling |
| slugify | URL-friendly slugs |

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 14 (App Router) | React framework |
| TypeScript | Type safety |
| Tailwind CSS 3 | Utility-first styling |
| shadcn/ui (Radix) | Accessible UI primitives |
| Zustand | State management |
| React Hook Form + Zod | Forms & validation |
| Axios | HTTP client with interceptors |
| TanStack Query v5 | Server state management |
| Recharts | Admin dashboard charts |
| Framer Motion | Page transitions & animations |
| Lucide React | Icons |
| React Hot Toast | Toast notifications |

---

## Project Structure

```
property-management/
├── backend/
│   ├── config/          # DB, Cloudinary, Email configs
│   ├── controllers/     # Route handlers (7 controllers)
│   ├── middleware/       # Auth, error handler, file upload
│   ├── models/          # Mongoose models (7 models)
│   ├── routes/          # Express routes (7 route files)
│   ├── utils/           # ApiError, tokens, email, notifications
│   ├── uploads/         # Temp upload directory
│   ├── server.js        # Express app entry point
│   └── .env             # Environment variables
├── frontend/
│   ├── src/
│   │   ├── app/         # Next.js App Router pages
│   │   │   ├── auth/    # Login, Register, Forgot, OTP, Reset
│   │   │   ├── compare/ # Property comparison page
│   │   │   ├── dashboard/
│   │   │   │   ├── admin/      # Admin dashboard + sub-pages
│   │   │   │   ├── customer/   # Customer dashboard
│   │   │   │   ├── owner/      # Owner dashboard + property CRUD
│   │   │   │   ├── worker/     # Worker task dashboard
│   │   │   │   ├── bookings/   # Shared bookings page
│   │   │   │   ├── maintenance/# Shared maintenance page
│   │   │   │   ├── notifications/
│   │   │   │   └── profile/    # Profile settings
│   │   │   └── properties/     # Listings + detail pages
│   │   ├── components/
│   │   │   ├── shared/  # Reusable components (13 components)
│   │   │   ├── ui/      # shadcn/ui primitives (8 components)
│   │   │   └── providers/# QueryProvider
│   │   ├── lib/         # API, utils, validations, types
│   │   ├── store/       # Zustand stores (auth, notifications)
│   │   └── middleware.ts # Next.js middleware
│   ├── .env.local       # Frontend env vars
│   └── next.config.mjs  # Next.js config
└── README.md
```

---

## Getting Started

### Prerequisites
- **Node.js** 18+ (recommended: 20 LTS)
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Cloudinary** account ([sign up free](https://cloudinary.com))
- **Gmail** or SMTP email provider for sending emails

### 1. Clone the Repository
```bash
git clone <repository-url>
cd property-management
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/property-management
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=PropertyManager <your_email@gmail.com>

CLIENT_URL=http://localhost:3000
```

Start the backend:
```bash
npm run dev
```
Backend runs on `http://localhost:5000`

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Create `.env.local` in `frontend/`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

Start the frontend:
```bash
npm run dev
```
Frontend runs on `http://localhost:3000`

---

## API Endpoints

### Auth Routes (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Register new user |
| POST | `/login` | Login with email/password |
| POST | `/logout` | Logout (clear refresh token) |
| POST | `/refresh-token` | Refresh access token |
| GET | `/me` | Get current user profile |
| PUT | `/update-profile` | Update profile info |
| PUT | `/change-password` | Change password |
| POST | `/forgot-password` | Send OTP to email |
| POST | `/verify-otp` | Verify OTP code |
| POST | `/reset-password` | Reset password with token |

### Property Routes (`/api/properties`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get all properties (with filters) |
| GET | `/featured` | Get featured properties |
| GET | `/:slug` | Get property by slug |
| GET | `/detail/:id` | Get property by ID (auth required) |
| GET | `/owner/my-listings` | Owner's properties |
| POST | `/` | Create property (owner) |
| PUT | `/:id` | Update property (owner) |
| DELETE | `/:id` | Delete property (owner) |
| PATCH | `/:id/approve` | Approve property (admin) |
| PATCH | `/:id/reject` | Reject property (admin) |
| PATCH | `/:id/toggle-featured` | Toggle featured (admin) |

### Booking Routes (`/api/bookings`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create booking |
| GET | `/my-bookings` | Customer's bookings |
| GET | `/owner-requests` | Owner's booking requests |
| PATCH | `/:id/approve` | Approve booking (owner) |
| PATCH | `/:id/reject` | Reject booking (owner) |
| PATCH | `/:id/complete` | Complete booking (owner) |
| PATCH | `/:id/cancel` | Cancel booking (customer) |

### Maintenance Routes (`/api/maintenance`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create request (customer) |
| GET | `/my-requests` | Customer's requests |
| GET | `/owner-requests` | Owner's property requests |
| GET | `/worker-tasks` | Worker's assigned tasks |
| PATCH | `/:id/assign` | Assign worker (owner) |
| PATCH | `/:id/start` | Start task (worker) |
| PATCH | `/:id/complete` | Complete task (worker) |
| PATCH | `/:id/close` | Close request (owner) |

### Review Routes (`/api/reviews`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create review |
| GET | `/property/:id` | Get property reviews |

### Notification Routes (`/api/notifications`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get notifications |
| PATCH | `/:id/read` | Mark as read |
| PATCH | `/mark-all-read` | Mark all as read |
| DELETE | `/:id` | Delete notification |

### Admin Routes (`/api/admin`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard` | Dashboard stats |
| GET | `/analytics` | Analytics data |
| GET | `/users` | All users (paginated) |
| PATCH | `/users/:id/toggle-active` | Toggle user active |
| PATCH | `/users/:id/change-role` | Change user role |
| GET | `/properties` | All properties |
| GET | `/bookings` | All bookings |
| GET | `/maintenance` | All maintenance requests |

---

## User Roles

| Role | Capabilities |
|---|---|
| **Customer** | Browse properties, book, raise maintenance, write reviews |
| **Owner** | List properties, manage bookings, assign workers to maintenance |
| **Worker** | View assigned tasks, update maintenance request progress |
| **Admin** | Full system management, approve properties, manage users, view analytics |

---

## Deployment

### Backend (Render/Railway)
1. Set all environment variables in hosting dashboard
2. Whitelist hosting IP in MongoDB Atlas (or `0.0.0.0/0`)
3. Set `NODE_ENV=production`
4. Set `CLIENT_URL` to your Vercel frontend URL
5. Configure CORS for production frontend URL

### Frontend (Vercel)
1. Set `NEXT_PUBLIC_API_URL` to production backend URL
2. Set `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
3. Configure custom domain if needed

---

## License

This project is built for educational and portfolio purposes.
