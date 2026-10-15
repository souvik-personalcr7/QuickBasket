# QuickBasket — System Architecture & Development Guide

## 1. Overview
QuickBasket is a hyperlocal multi-vendor quick-commerce platform that connects customers with local neighborhood stores. It features role-based access for:
1. **Customers**: Product search, store discovery, cart management, checkout, order tracking.
2. **Shop Owners**: Store profile management, product CRUD, inventory management, incoming order processing.
3. **Delivery Partners**: Mobile-first dispatch interface, availability toggles, order pickup & delivery workflows.

*Note*: Administrative interfaces (Admin/Super Admin) will be developed in a future project. The backend reserves the `/api/v1/admin` namespace and RBAC infrastructure to support this future frontend without database or API redesigns.

---

## 2. Directory Structure
```
QuickBasket/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment & MongoDB connection
│   │   ├── controllers/     # Route request handlers
│   │   ├── middleware/      # Auth, RBAC, error handling, rate limiting
│   │   ├── models/          # Mongoose schemas (User, Shop, Product, Order, Delivery)
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Reusable business logic
│   │   ├── types/           # TypeScript definitions
│   │   ├── utils/           # Response helpers, formatters
│   │   ├── validators/      # Zod validation schemas
│   │   ├── app.ts           # Express application setup
│   │   └── server.ts        # Server entry point & Socket.IO
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router (public, customer, shop, delivery)
│   │   ├── components/      # UI & layout components
│   │   ├── features/        # Feature-specific state, components & hooks
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility functions, API client
│   │   ├── types/           # TypeScript interfaces
│   │   └── validators/      # Form validation schemas
│   ├── package.json
│   └── tailwind.config.ts
├── docs/                    # Architecture & API specifications
└── README.md
```

---

## 3. Technology Stack
- **Frontend**: Next.js App Router, React 19, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js, Express.js, TypeScript, Mongoose, Socket.IO, Zod.
- **Database**: MongoDB (Atlas or local instance).
- **Authentication**: JWT with HTTP-only cookies & role verification.
