# 🛒 Production-Ready Full Stack E-Commerce Platform

A feature-rich, high-performance, full-stack E-Commerce application built with **React 19**, **TypeScript**, **Tailwind CSS**, **Redux Toolkit**, **Node.js**, **Express**, and **MongoDB Atlas**. Designed for scalability, security, and exceptional user experience.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Project Architecture & Directory Structure](#-project-architecture--directory-structure)
  - [Frontend Structure](#frontend-structure)
  - [Backend Structure](#backend-structure)
- [Development Roadmap](#-development-roadmap)
  - [Phase 1: Frontend Development](#phase-1--frontend-react--typescript--tailwind-css)
  - [Phase 2: Backend Development](#phase-2--backend-nodejs--express--mongodb-atlas--mongoose)
  - [Phase 3: Full Stack Integration](#phase-3--integration)
  - [Phase 4: Deployment & Production Readiness](#phase-4--deployment)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#-environment-variables)
- [API Reference Overview](#-api-reference-overview)
- [Database Models & Schemas](#-database-models--schemas)
- [Security Implementation](#-security-implementation)
- [Payment Gateways](#-payment-gateways)
- [License](#-license)

---

## 🌟 Overview

This project is a complete, enterprise-grade E-Commerce ecosystem featuring:
- **Customer Shopping Experience**: Product discovery, responsive filters, dark mode, rich cart & wishlist management, multi-step checkout, coupon applications, order tracking, customer profiles, and review management.
- **Admin Control Center**: Full administrative control over products, categories, brands, orders, customer accounts, global store settings, analytics dashboards, and discount coupons.
- **Robust RESTful API**: Built with Node.js/Express, utilizing JWT token-based authentication (with refresh tokens), strict validation, rate limiting, and role-based access control (RBAC).

---

## 🛠 Tech Stack

### **Frontend**
- **Core Engine**: React 19, TypeScript, Vite
- **Styling & UI**: Tailwind CSS, Framer Motion, React Icons, React Hot Toast
- **State & Data Handling**: Redux Toolkit, Axios, React Hook Form, Zod (Validation)
- **Routing**: React Router DOM (v7)

### **Backend**
- **Runtime & Framework**: Node.js, Express.js
- **Database & ODM**: MongoDB Atlas, Mongoose
- **Auth & Security**: JWT (Access & Refresh Tokens), Bcrypt.js, Helmet, CORS, Express Rate Limit
- **Media Storage**: Multer, Cloudinary
- **Payments**: Stripe, Razorpay, Cash on Delivery (COD)

---

## 🏗 Project Architecture & Directory Structure

```
ecommerce-web-site/
├── frontend/             # React + TypeScript + Vite Application
└── backend/              # Node.js + Express + Mongoose API Application
```

### Frontend Structure (`src/`)

```
src/
 ├── assets/          # Images, SVGs, static graphics, custom fonts
 ├── components/      # Shared reusable UI elements (Buttons, Inputs, Modals, Navbar, Footer, Skeletons)
 ├── layouts/         # Layout wrapper components (CustomerLayout, AdminLayout, AuthLayout)
 ├── pages/           # Customer & Admin View Pages
 ├── features/        # Feature-specific state and components (Cart, Wishlist, Checkout, Reviews)
 ├── hooks/           # Custom React hooks (useAuth, useTheme, useDebounce, usePagination)
 ├── services/        # Axios API client instances and endpoint handler functions
 ├── redux/           # Redux Toolkit store setup, root reducer, and domain slices
 ├── routes/          # Application routing, Public Routes, Protected & Admin Guard Routes
 ├── utils/           # Helper utility functions (formatting currency, dates, local storage)
 ├── types/           # Global TypeScript interfaces, types, and schema definitions
 ├── constants/       # Global constants (API routes, storage keys, navigation links)
 └── App.tsx          # Main Application Entry & Global Provider Wrappers
```

### Backend Structure (`backend/`)

```
backend/
 ├── config/          # Database connections, Cloudinary setup, Payment provider configs
 ├── controllers/     # Route request handlers and business logic execution
 ├── middleware/      # Auth verification, Role guards, Error handler, Rate limiters, Multer
 ├── models/          # Mongoose database schemas and instance methods
 ├── routes/          # Express route declarations (API endpoints mapping)
 ├── services/        # Auxiliary services (Email delivery, Payment verification, Cloud uploads)
 ├── utils/           # Custom utilities (API Response wrappers, Async Handler, Custom Error classes)
 ├── validators/      # Request body & query parameter schema validators (Zod / Joi)
 ├── uploads/         # Temporary local upload cache directory
 ├── app.js           # Express App initialization and middleware stack binding
 └── server.js        # Server execution, listener, and unhandled rejection handlers
```

---

## 🗺 Development Roadmap

### Phase 1 – Frontend (React + TypeScript + Tailwind CSS)

#### 1. Project Setup
- [x] Initialize React 19 with Vite & TypeScript.
- [x] Configure Tailwind CSS for custom colors, dark mode support, and fluid typography.
- [x] Set up ESLint & Prettier code formatting standards.
- [x] Install & configure core libraries: `react-router-dom`, `axios`, `@reduxjs/toolkit`, `react-hook-form`, `zod`, `react-hot-toast`, `framer-motion`, `react-icons`.

#### 2. Customer Pages
- **Home**: Banner sliders, featured categories, trending products, promotional deals.
- **Shop**: Complete product grid with dynamic filter sidebar, search, and sorting options.
- **Categories**: Browse products organized by category hierarchies.
- **Product Details**: Multi-image preview, color/size selection, stock indicator, specifications, reviews list, and related products.
- **Search**: Dedicated full-featured search page with real-time suggestions.
- **Cart**: Interactive drawer/page, quantity adjusters, subtotal calculation, coupon applier.
- **Wishlist**: Save favorite items with quick add-to-cart capabilities.
- **Checkout**: Shipping address selector, shipping method selection, payment choice (Card, Razorpay, COD), order summary breakdown.
- **Order Success**: Order confirmation receipt, summary, and action links.
- **My Orders**: Order history list with status timeline trackers.
- **Profile**: Personal information management, password change, address book.
- **Authentication**: Login, Register, Forgot Password, Reset Password.
- **404 Page**: Custom page not found design.

#### 3. Admin Pages
- **Dashboard**: Revenue analytics charts, total orders, active customer counts, top-selling products.
- **Products**: Data table view with search, filter, inline actions, bulk deletion.
- **Add / Edit Product**: Multi-tab form for title, slug, price, stock, specs, tags, category select, and image uploader.
- **Categories**: Category creation, parent-child nesting, image badge assignment.
- **Brands**: Brand directory creation and logo management.
- **Orders**: Order fulfillment management, status updates (Pending, Processing, Shipped, Delivered, Cancelled).
- **Customers**: Customer listing, account status control (Active/Blocked).
- **Coupons**: Discount code creator (Percentage vs Fixed Amount, Min Spend, Expiry).
- **Reviews**: Customer review moderation (Approve/Reject/Delete).
- **Settings**: Store metadata, currency defaults, tax rates, shipping fees configuration.

#### 4. Key Frontend Features
- 🔐 **Authentication UI**: JWT storage handling, seamless login persistence.
- 📱 **Responsive Design**: Mobile-first responsive layouts for mobile, tablet, and desktop.
- 🌙 **Dark Mode**: Dynamic dark mode toggling using Tailwind theme strategies.
- 🔍 **Search, Filter & Sorting**: Multi-faceted filter pipeline (Price range, Ratings, In-stock, Category, Brand).
- 📄 **Pagination & Infinite Scroll**: Smooth server-side pagination integration.
- 💀 **Loading Skeleton**: High-quality skeleton loading states for better UX.
- 🔔 **Toast Notifications**: Interactive toast alerts for success, warnings, and errors.
- 🧪 **Form Validation**: Strict schema-based validation using React Hook Form and Zod.
- 🛡️ **Protected Routes**: Navigation guards restricting pages by authentication state and role (Admin vs Customer).

---

### Phase 2 – Backend (Node.js + Express + MongoDB Atlas + Mongoose)

#### 1. Database Models
- **User**: Name, email, password hash, role (`customer` | `admin`), addresses, avatar, refresh tokens.
- **Product**: Title, slug, description, price, discountPrice, stock, category, brand, images, ratings, specs.
- **Category**: Name, slug, description, image, parentCategory.
- **Brand**: Name, logo, website, isActive.
- **Cart**: User reference, items array (product, variant, quantity), totalAmount.
- **Wishlist**: User reference, array of saved product references.
- **Order**: Customer, items, shippingAddress, paymentMethod, paymentResult, itemsPrice, taxPrice, shippingPrice, totalPrice, orderStatus, trackingNumber.
- **Coupon**: Code, discountType, discountAmount, minPurchase, expiresAt, usageLimit, active.
- **Review**: User, product, rating, comment, title, verifiedPurchase, status.
- **Address**: Street, city, state, postalCode, country, isDefault, addressType (`Home` | `Work`).

#### 2. Authentication & Authorization
- Secure Registration & Password Hashing via `bcryptjs`.
- Dual-Token System: Short-lived Access Token (JWT) + Long-lived HTTP-Only Refresh Token cookie.
- Account recovery flow: Secure tokenized Forgot Password and Reset Password via email.
- Middleware guards: `protect` (authentication check) and `admin` (authorization check).

#### 3. Image Upload Pipeline
- Multer configuration for file intake and MIME-type verification.
- Cloudinary Integration for automatic image resizing, optimization, and cloud hosting.

#### 4. Security Framework
- **Helmet**: Set protective HTTP headers.
- **CORS**: Restricted cross-origin resource sharing to trusted frontend domains.
- **Rate Limiting**: IP-based rate limit protection against brute force and DDoS attacks.
- **Validation**: Sanitization of request parameters and body contents.
- **Centralized Error Handling**: Custom `ApiError` class catching validation, Mongoose duplicate key, and JWT expiration errors seamlessly.

---

### Phase 3 – Integration

- [ ] **Authentication Integration**: Connect register/login state with Redux Toolkit and persistence.
- [ ] **Cart & Wishlist Integration**: Sync guest cart local storage with database cart upon login.
- [ ] **Checkout & Payment Integration**: Stripe Elements / Razorpay SDK integration for real-time transactions.
- [ ] **Order Management Pipeline**: Dynamic creation of orders post-payment verification with inventory decrement.
- [ ] **Admin Dashboard Integration**: Connect real-time database queries to charts and tables.

---

### Phase 4 – Deployment

- **Frontend Hosting**: Vercel (Continuous deployment from main branch, custom domain, routing redirects setup).
- **Backend Hosting**: Render / Railway (Node.js environment setup, environment secret variables configuration).
- **Database**: MongoDB Atlas (Production cluster setup, IP whitelist rule configuration, automated backups).
- **Storage**: Cloudinary Production Account (Asset folder organization, CDN delivery).

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your local development machine:
- **Node.js**: v18.x or higher
- **npm** / **yarn** / **pnpm**
- **MongoDB**: Local installation or MongoDB Atlas Connection URI

---

### Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the root of `backend/` (refer to [Environment Variables](#-environment-variables)).

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   *The server will start on http://localhost:5000*

---

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the root of `frontend/`.

4. **Start Vite development server**:
   ```bash
   npm run dev
   ```
   *The client application will start on http://localhost:5173*

---

## 🔑 Environment Variables

### **Backend (`backend/.env`)**

```env
# Server Config
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/ecommerce?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your_super_secret_jwt_access_key
JWT_EXPIRE=15m
REFRESH_TOKEN_SECRET=your_super_secret_jwt_refresh_key
REFRESH_TOKEN_EXPIRE=7d

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Payment Gateways
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your_razorpay_secret

# SMTP Email Configuration
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
FROM_EMAIL=noreply@ecommerceapp.com
FROM_NAME=E-Commerce App
```

### **Frontend (`frontend/.env`)**

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_RAZORPAY_KEY_ID=rzp_test_...
```

---

## 📡 API Reference Overview

### **Authentication**
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login & obtain access token
- `POST /api/v1/auth/logout` - Logout & clear refresh cookies
- `POST /api/v1/auth/refresh-token` - Refresh expired access token
- `POST /api/v1/auth/forgot-password` - Trigger password reset email
- `PUT /api/v1/auth/reset-password/:token` - Reset password with token

### **Products**
- `GET /api/v1/products` - List products with filter, sort, & pagination
- `GET /api/v1/products/:slug` - Get single product details
- `POST /api/v1/products` *(Admin)* - Create new product
- `PUT /api/v1/products/:id` *(Admin)* - Update existing product
- `DELETE /api/v1/products/:id` *(Admin)* - Soft/Hard delete product

### **Orders**
- `POST /api/v1/orders` - Place new order
- `GET /api/v1/orders/my-orders` - Get current user's order history
- `GET /api/v1/orders/:id` - Get order breakdown by ID
- `PUT /api/v1/orders/:id/status` *(Admin)* - Update shipment status

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
