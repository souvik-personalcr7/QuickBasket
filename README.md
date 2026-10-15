# QuickBasket — Hyperlocal Multi-Vendor Quick Commerce Platform

QuickBasket is a hyperlocal quick-commerce platform that connects customers with neighborhood grocery stores and regional retailers, providing transparent pricing, stock tracking, and role-based workflows for **Customers**, **Shop Owners**, and **Delivery Partners**.

---

## Architecture & Project Structure

- **Frontend**: Next.js App Router, React 19, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js, Express, TypeScript, Mongoose, Socket.IO, Zod.
- **Database**: MongoDB.
- **Security & Authorization**: Server-enforced Role-Based Access Control (RBAC), HTTP-only JWT cookies, ownership verification, atomic inventory decrements.

```
QuickBasket/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment & MongoDB connection
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Auth, RBAC, error handling
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # REST endpoints (/api/v1)
│   │   ├── services/        # Business logic & state machine
│   │   ├── utils/           # Response helpers & AppError
│   │   ├── app.ts           # Express application
│   │   └── server.ts        # HTTP & Socket.IO server
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # UI, Navbar, role components
│   │   ├── lib/             # API client & utilities
│   │   └── types/           # Type definitions
│   ├── .env.local.example
│   └── package.json
├── docs/                    # Architecture and PRD documentation
├── .gitignore
├── package.json             # Root workspace runner
└── README.md
```

---

## Quick Start / Development Commands

### 1. Prerequisites
- Node.js `v20+` (tested on Node `v24.13.0`)
- MongoDB running locally on port 27017 or a MongoDB Atlas URI

### 2. Environment Variables
- Copy `backend/.env.example` to `backend/.env`
- Copy `frontend/.env.local.example` to `frontend/.env.local`

### 3. Running Backend
```bash
cd backend
npm install
npm run dev
```
Backend runs on `http://localhost:5000`. Health check is available at `http://localhost:5000/api/v1/health`.

### 4. Running Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:3000`.

### 5. Running from Workspace Root
From the root repository:
```bash
npm run dev:backend   # Launches Express + Socket.IO server
npm run dev:frontend  # Launches Next.js dev server
npm run build:backend # Compiles backend TypeScript
npm run build:frontend # Builds production Next.js assets
```
