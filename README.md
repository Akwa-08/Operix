# Operix — Setup & Developer Guide

> **Web-based integrated management system for VTA Link Printing Services**  
> Stack: React 19 + TypeScript + Vite · Express 5 · Supabase (Auth + PostgreSQL)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture at a Glance](#2-architecture-at-a-glance)
3. [Prerequisites](#3-prerequisites)
4. [Repository Structure](#4-repository-structure)
5. [Supabase Setup](#5-supabase-setup)
6. [Backend Setup](#6-backend-setup)
7. [Frontend Setup](#7-frontend-setup)
8. [Running the Full Stack](#8-running-the-full-stack)
9. [Role System & Access Matrix](#9-role-system--access-matrix)
10. [API Reference](#10-api-reference)
11. [Environment Variables Reference](#11-environment-variables-reference)
12. [Common Errors & Fixes](#12-common-errors--fixes)

---

## 1. Project Overview

Operix is a full-stack business management platform built for **VTA Link Printing Services**. It consolidates:

- **Order management** — customer orders, cashier processing
- **Inventory tracking** — raw materials, low-stock alerts, supplier linking
- **Product management** — material cost calculation, production feasibility
- **Account management** — employee creation, supplier CRUD, role assignment
- **Payroll automation** — admin-controlled payroll module
- **Customer portal** — self-service orders, profile, cart, messages

Authentication is handled **entirely by Supabase Auth** on the frontend. The Express backend validates Supabase JWTs on every `/api/*` request and enforces role-based access control.

---

## 2. Architecture at a Glance

```
Browser
  │
  ├── React 19 + Vite (frontend/)        port 5173 (dev)
  │     ├── Supabase Auth  ──────────────────────────────────┐
  │     ├── AuthContext (session, user, role)                 │
  │     ├── Redux Toolkit (cart, UI state)                    │
  │     └── apiClient.ts  ─── Bearer JWT ──► Express         │
  │                                                           │
  ├── Express 5 (backend/)               port 5000           │
  │     ├── Helmet + CORS + Rate Limiter                      │
  │     ├── verifyToken middleware (validates JWT w/ Supabase)│
  │     ├── requireRole middleware (RBAC)                     │
  │     ├── /api/users, /api/suppliers  (accountRoutes)       │
  │     └── /api/inventory/*            (inventoryRoutes)     │
  │                                                           │
  └── Supabase ◄───────────────────────────────────────────-─┘
        ├── Auth (email/password, JWT issuance)
        ├── PostgreSQL (all data)
        └── Row Level Security (RLS)
```

**Auth flow:**
1. User logs in via `LoginModal` → `authService.login()` → Supabase issues JWT
2. JWT stored in browser session by Supabase SDK
3. `apiClient.ts` reads the JWT and attaches it as `Authorization: Bearer <token>`
4. Express `verifyToken` calls `supabase.auth.getUser(token)` to validate
5. `requireRole(...)` checks `user_metadata.role` before every protected route

---

## 3. Prerequisites

Install **all** of these before proceeding.

| Tool | Minimum Version | Download |
|------|----------------|---------|
| Node.js | **20.x** (LTS) | https://nodejs.org |
| npm | 10.x (ships with Node 20) | included |
| Git | any recent | https://git-scm.com |
| Supabase account | — | https://supabase.com (free tier works) |

**Verify your installs:**
```bash
node --version      # should print v20.x.x or higher
npm --version       # should print 10.x.x or higher
git --version
```

---

## 4. Repository Structure

```
operix/
├── frontend/                     # React 19 + TypeScript + Vite
│   ├── public/
│   │   └── operix-logo.png
│   ├── src/
│   │   ├── App.tsx               # Router + ProtectedRoute definitions
│   │   ├── main.tsx              # React entry point
│   │   ├── store.ts              # Redux store
│   │   ├── config/
│   │   │   └── supabaseClient.ts # Supabase browser client
│   │   ├── context/
│   │   │   └── AuthContext.tsx   # Session + user state
│   │   ├── services/
│   │   │   ├── authService.ts    # login/register/logout wrappers
│   │   │   └── apiClient.ts      # Auto-JWT-attached fetch wrapper
│   │   ├── components/
│   │   │   ├── Admin/
│   │   │   ├── Cashier/
│   │   │   ├── Designer/
│   │   │   ├── Production/
│   │   │   ├── Landing/
│   │   │   ├── Auth/
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   ├── UserModal/
│   │   │   │   └── LoginModal.tsx
│   │   │   └── Shared/
│   │   └── pages/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                      # Node.js + Express 5
│   ├── src/
│   │   ├── server.js             # App entry point
│   │   ├── config/
│   │   │   └── supabase.js       # Service role + anon Supabase clients
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js # verifyToken, requireRole, createAuthenticatedClient
│   │   │   └── errorHandler.js   # Global error + 404 handlers
│   │   ├── modules/
│   │   │   ├── inventory/
│   │   │   │   ├── controllers/
│   │   │   │   │   ├── inventoryItemController.js
│   │   │   │   │   ├── productController.js
│   │   │   │   │   └── supplierController.js
│   │   │   │   └── routes/
│   │   │   │       └── inventoryRoutes.js
│   │   │   └── accounts_management/
│   │   │       ├── controllers/
│   │   │       │   ├── userController.js
│   │   │       │   └── supplierController.js
│   │   │       └── routes/
│   │   │           └── accountRoutes.js
│   │   └── utils/
│   │       └── responseHelper.js
│   └── package.json
│
└── README.md
```

---

## 5. Supabase Setup

This is the most critical step. Do this **before** setting up either the backend or frontend.

### Step 5.1 — Create a Supabase Project

1. Go to https://supabase.com and sign in (or create a free account)
2. Click **"New project"**
3. Fill in:
   - **Project name**: `operix` (or anything you prefer)
   - **Database password**: choose a strong password and **save it somewhere safe**
   - **Region**: choose closest to your users
4. Click **"Create new project"**
5. Wait ~2 minutes for the project to finish provisioning

### Step 5.2 — Collect Your Credentials

From your Supabase project dashboard:

1. Click **Settings** (gear icon in left sidebar)
2. Click **API** in the settings menu
3. Copy these three values — you will need them for both `.env` files:

| Value | Where to find it | Used by |
|-------|-----------------|---------|
| **Project URL** | "Project URL" box | Backend + Frontend |
| **anon / public key** | "Project API keys" → `anon public` | Backend + Frontend |
| **service_role key** | "Project API keys" → `service_role` (click reveal) | Backend **only** |

> ⚠️ **SECURITY**: The `service_role` key bypasses Row Level Security. Never expose it in frontend code or commit it to Git.

### Step 5.3 — Enable Email Auth

1. In Supabase dashboard → **Authentication** → **Providers**
2. Confirm **Email** is enabled (it is by default)
3. For development, go to **Authentication** → **Settings** → turn **OFF** "Enable email confirmations" (so you can test without needing to confirm emails)

### Step 5.4 — Create the Database Schema

1. In Supabase dashboard → click **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Paste and run the following SQL to create the required tables:

```sql
-- =============================================
-- USERS TABLE (mirrors Supabase auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  first_name    TEXT,
  last_name     TEXT,
  contact_number TEXT,
  address       TEXT,
  role          TEXT NOT NULL DEFAULT 'customer'
                  CHECK (role IN ('admin','cashier','designer','production','customer')),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- AUTO-CREATE users ROW ON SIGNUP (DB trigger)
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, contact_number, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'contact_number',
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'customer')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- SUPPLIERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.suppliers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  contact_person TEXT,
  contact_number TEXT,
  email         TEXT,
  address       TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  is_flagged    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INVENTORY ITEMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  unit          TEXT NOT NULL,
  quantity      NUMERIC NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  low_stock_threshold NUMERIC NOT NULL DEFAULT 10,
  unit_cost     NUMERIC NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INVENTORY HISTORY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.inventory_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id       UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  changed_by    UUID REFERENCES public.users(id),
  change_type   TEXT NOT NULL CHECK (change_type IN ('restock','deduction','adjustment','initial')),
  quantity_before NUMERIC NOT NULL,
  quantity_change NUMERIC NOT NULL,
  quantity_after  NUMERIC NOT NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INVENTORY ITEM <-> SUPPLIER LINK TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.inventory_item_suppliers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id       UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  supplier_id   UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  UNIQUE (item_id, supplier_id)
);

-- =============================================
-- PRODUCTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  category      TEXT,
  base_price    NUMERIC NOT NULL DEFAULT 0 CHECK (base_price >= 0),
  markup_percent NUMERIC NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- PRODUCT <-> MATERIAL MAPPING TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.product_materials (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  quantity_required NUMERIC NOT NULL CHECK (quantity_required > 0),
  UNIQUE (product_id, inventory_item_id)
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
-- Enable RLS on users table (customers only see their own row)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_update_own ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- NOTE: All other tables (suppliers, inventory, products) are accessed
-- via the backend service_role client which bypasses RLS.
-- RLS can be added to those tables later if needed.
```

4. Click **"Run"** — you should see "Success. No rows returned."

### Step 5.5 — Create Your First Admin User

1. In Supabase dashboard → **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Fill in email and password
4. Click **"Create user"**
5. After creation, click on the user row to open it
6. Click **"Edit"** on the user
7. In the **"User metadata"** JSON field, enter:
```json
{
  "role": "admin",
  "first_name": "Your",
  "last_name": "Name"
}
```
8. Click **"Save"**

---

## 6. Backend Setup

### Step 6.1 — Navigate to the Backend Directory

Open a terminal and run:
```bash
cd path/to/operix/backend
```

### Step 6.2 — Install Dependencies

```bash
npm install
```

This installs: `express`, `@supabase/supabase-js`, `dotenv`, `cors`, `helmet`, `express-rate-limit`, `joi`, and `nodemon` (dev).

### Step 6.3 — Create the `.env` File

In the `backend/` folder, create a file called **`.env`** (note the dot at the start).

On Windows (Command Prompt):
```
copy NUL .env
```

On Mac/Linux:
```bash
touch .env
```

Open `.env` in any text editor and paste **exactly** this, replacing the placeholder values:

```env
# ─── Server ───────────────────────────────────────────────
NODE_ENV=development
PORT=5000

# ─── Supabase ─────────────────────────────────────────────
# From Supabase Dashboard → Settings → API

SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your_service_role_key
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your_anon_key

# ─── CORS ─────────────────────────────────────────────────
ALLOWED_ORIGINS=http://localhost:5173

# ─── Rate Limiting ────────────────────────────────────────
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX_REQUESTS=100
```

> ⚠️ Replace the `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_ANON_KEY` values with the real values you collected in Step 5.2.

### Step 6.4 — Verify `.gitignore`

Make sure `.env` is ignored by Git. In `backend/`, check that `.gitignore` contains:
```
node_modules/
.env
```

If there's no `.gitignore`, create one and add those two lines.

### Step 6.5 — Start the Backend (Dev Mode)

```bash
npm run dev
```

**Expected output:**
```
  OPERIX BACKEND | Port: 5000 | Env: development | DB: Connected ✓ | Auth: Supabase Direct
```

If you see `❌ Supabase connection failed`, recheck your `.env` values and that the `users` table exists in Supabase.

### Step 6.6 — Verify the Backend is Running

Open a browser or use curl:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "...",
  "environment": "development"
}
```

---

## 7. Frontend Setup

### Step 7.1 — Navigate to the Frontend Directory

Open a **new terminal tab** (keep backend running):
```bash
cd path/to/operix/frontend
```

### Step 7.2 — Install Dependencies

```bash
npm install
```

This installs React 19, Vite, TypeScript, Tailwind CSS 4, MUI, Redux Toolkit, Supabase JS SDK, Framer Motion, and all other dependencies.

### Step 7.3 — Create the `.env` File

In the `frontend/` folder, create a file called **`.env`**:

On Windows:
```
copy NUL .env
```

On Mac/Linux:
```bash
touch .env
```

Open `.env` and paste this, replacing placeholder values:

```env
# ─── Supabase ─────────────────────────────────────────────
# From Supabase Dashboard → Settings → API

VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your_anon_key

# ─── Backend API ──────────────────────────────────────────
VITE_API_BASE_URL=http://localhost:5000
```

> ⚠️ **IMPORTANT**: All frontend environment variables **must** start with `VITE_` or Vite will not expose them to the browser.

> ⚠️ Only use the **`anon` / public key** here. Never put the `service_role` key in the frontend.

### Step 7.4 — Verify `.gitignore`

In `frontend/`, ensure `.gitignore` contains:
```
node_modules/
dist/
.env
.env.local
```

### Step 7.5 — Start the Frontend Dev Server

```bash
npm run dev
```

**Expected output:**
```
  VITE v7.x.x  ready in 300 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open your browser to **http://localhost:5173**. You should see the Operix landing page.

---

## 8. Running the Full Stack

You need **two terminal windows** running simultaneously:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Running on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Running on http://localhost:5173
```

### Logging In

1. Open http://localhost:5173
2. Click **"Login"** in the navbar
3. Use the admin account you created in Step 5.5
4. You will be automatically redirected to `/admin` based on your role

### Available Routes After Login

| Role | Dashboard Route |
|------|----------------|
| `admin` | `/admin` |
| `cashier` | `/cashier` |
| `designer` | `/designer` |
| `production` | `/production` |
| `customer` | `/customer` |

### Building for Production

**Frontend build:**
```bash
cd frontend
npm run build
# Output in frontend/dist/
```

**Backend production start:**
```bash
cd backend
NODE_ENV=production npm start
```

For production, set `NODE_ENV=production` and update `ALLOWED_ORIGINS` in the backend `.env` to your actual frontend domain.

---

## 9. Role System & Access Matrix

Roles are stored in Supabase `auth.user_metadata.role`. The backend reads this from the verified JWT.

### Role Definitions

| Role | Description |
|------|-------------|
| `admin` | Full access to all modules. Creates/manages employee accounts. |
| `cashier` | Read inventory + products. Process orders. |
| `production` | Read inventory + products. Adjust stock. Deduct materials. |
| `designer` | Read-only access to products only. |
| `customer` | Self-service portal only. No backend API access. |

### Backend Route Access Matrix

| Endpoint | admin | cashier | production | designer | customer |
|----------|:-----:|:-------:|:----------:|:--------:|:--------:|
| `GET /api/users` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `POST /api/users` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `GET /api/suppliers` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `POST /api/suppliers` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `GET /api/inventory/inventory-items` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `POST /api/inventory/inventory-items` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `PATCH /api/inventory/inventory-items/:id/adjust` | ✅ | ❌ | ✅ | ❌ | ❌ |
| `GET /api/inventory/products` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `POST /api/inventory/products` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `POST /api/inventory/products/:id/deduct-materials` | ✅ | ❌ | ✅ | ❌ | ❌ |

### Creating Employee Accounts

Employee accounts (non-customer roles) are **not** created via the public signup page. Only admins can create them through the Admin Management panel, which calls `POST /api/users`.

The `POST /api/users` endpoint:
1. Creates the user in Supabase Auth with the specified role in `user_metadata`
2. The DB trigger (`handle_new_user`) auto-creates the row in `public.users`

---

## 10. API Reference

All endpoints require `Authorization: Bearer <supabase_jwt>` header.

### Health Check (No Auth Required)

```
GET /health
→ { status: "OK", timestamp: "...", environment: "..." }
```

### User / Account Management

```
GET    /api/users                      → List all employees (admin)
POST   /api/users                      → Create employee account (admin)
PUT    /api/users/:id                  → Update employee (admin)
PATCH  /api/users/deactivate           → Bulk deactivate users (admin)
PATCH  /api/users/reactivate           → Bulk reactivate users (admin)
PATCH  /api/users/:id/reactivate       → Reactivate single user (admin)
```

### Supplier Management

```
GET    /api/suppliers                  → List all suppliers (admin, cashier, production)
POST   /api/suppliers                  → Create supplier (admin)
PATCH  /api/suppliers/deactivate       → Bulk deactivate (admin)
PATCH  /api/suppliers/reactivate       → Bulk reactivate (admin)
PATCH  /api/suppliers/:id/flag         → Flag a supplier (admin)
PATCH  /api/suppliers/:id/reactivate   → Reactivate supplier (admin)
```

### Inventory Items

```
GET    /api/inventory/inventory-items               → List all items
GET    /api/inventory/inventory-items/low-stock     → Items below threshold
GET    /api/inventory/inventory-items/stats         → Summary stats
GET    /api/inventory/inventory-items/:id           → Single item
GET    /api/inventory/inventory-items/:id/history   → Adjustment history (admin, production)
POST   /api/inventory/inventory-items               → Create item (admin)
PUT    /api/inventory/inventory-items/:id           → Update item (admin)
DELETE /api/inventory/inventory-items/:id           → Delete item (admin)
PATCH  /api/inventory/inventory-items/:id/adjust    → Adjust quantity (admin, production)
POST   /api/inventory/inventory-items/:id/suppliers → Link supplier to item (admin)
DELETE /api/inventory/inventory-items/:id/suppliers/:supplierId → Unlink supplier (admin)
```

### Products

```
GET    /api/inventory/products                        → List all products
GET    /api/inventory/products/categories             → Product categories
GET    /api/inventory/products/stats                  → Product stats (admin)
GET    /api/inventory/products/:id                    → Single product
GET    /api/inventory/products/:id/material-cost      → Calculated material cost (admin, production)
GET    /api/inventory/products/:id/production-feasibility → Can we produce it? (admin, production)
POST   /api/inventory/products                        → Create product (admin)
PUT    /api/inventory/products/:id                    → Update product (admin)
DELETE /api/inventory/products/:id                    → Delete product (admin)
POST   /api/inventory/products/:id/materials          → Add material (admin)
PUT    /api/inventory/products/materials/:mappingId   → Update material qty (admin)
DELETE /api/inventory/products/:id/materials/:materialId → Remove material (admin)
PUT    /api/inventory/products/:id/pricing            → Update pricing (admin)
POST   /api/inventory/products/:id/deduct-materials   → Deduct materials (admin, production)
PATCH  /api/inventory/products/:id/status             → Toggle active/inactive (admin)
```

### Standard Response Format

All endpoints return:
```json
{
  "success": true | false,
  "message": "Human-readable message",
  "data": { ... } | null,
  "timestamp": "2026-03-17T00:00:00.000Z"
}
```

Error responses include an `errors` field with details.

---

## 11. Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `development` or `production` |
| `PORT` | No | Default: `5000` |
| `SUPABASE_URL` | ✅ Yes | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | Service role key (bypasses RLS — backend only) |
| `SUPABASE_ANON_KEY` | ✅ Yes | Anon/public key (for RLS-aware client) |
| `ALLOWED_ORIGINS` | No | Comma-separated allowed CORS origins. Default: `*` |
| `API_RATE_LIMIT_WINDOW_MS` | No | Rate limit window in ms. Default: `900000` (15 min) |
| `API_RATE_LIMIT_MAX_REQUESTS` | No | Max requests per window. Default: `100` |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ Yes | Anon/public key ONLY |
| `VITE_API_BASE_URL` | No | Backend URL. Default: `http://localhost:5000` |

---

## 12. Common Errors & Fixes

### ❌ `Missing required environment variable: SUPABASE_URL`

**Cause**: The backend `.env` file is missing or in the wrong location.

**Fix**:
1. Make sure `.env` is inside the `backend/` folder (not root, not `backend/src/`)
2. Verify the variable name matches exactly (no typos, no extra spaces)
3. Restart the backend server after editing `.env`

---

### ❌ `❌ Supabase connection failed`

**Cause**: Wrong `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY`, or the `users` table doesn't exist.

**Fix**:
1. Double-check your keys from Supabase dashboard → Settings → API
2. Make sure you ran the SQL from Step 5.4 to create the `users` table
3. Ensure your Supabase project is not paused (free tier pauses after inactivity)

---

### ❌ `Missing Supabase env vars` (frontend crash on load)

**Cause**: The frontend `.env` is missing `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY`.

**Fix**:
1. Make sure `.env` is in the `frontend/` folder
2. Variable names must start with `VITE_`
3. Restart `npm run dev` after changing `.env` — Vite does not hot-reload env files

---

### ❌ `Authentication required. Please log in.` (401 from API)

**Cause**: Frontend is calling the backend without a valid JWT, or the JWT has expired.

**Fix**: This usually means the user is not logged in. Ensure `AuthContext` has a valid session and that `apiClient.ts` is being used for all backend calls (it auto-attaches the Bearer token).

---

### ❌ `Access denied. Required role: admin. Your role: customer` (403)

**Cause**: The logged-in user's role does not match what the route requires.

**Fix**:
1. Check the user's role in Supabase → Authentication → Users → User metadata
2. If the role was just updated in the database, the JWT won't reflect it until the user logs out and back in
3. Roles must be set in `auth.users.user_metadata.role`, not just `public.users.role`

---

### ❌ CORS error in browser console

**Cause**: Frontend origin is not in the backend's `ALLOWED_ORIGINS`.

**Fix**: In `backend/.env`, ensure:
```
ALLOWED_ORIGINS=http://localhost:5173
```
Restart the backend after changing `.env`.

---

### ❌ `npm install` fails with peer dependency errors

**Cause**: Node.js version is too old.

**Fix**: Upgrade to Node.js 20 LTS. Use `nvm` (Node Version Manager) if you manage multiple Node versions:
```bash
nvm install 20
nvm use 20
```

---

*Operix — Developed by the Operix Development Team for VTA Link Printing Services*
