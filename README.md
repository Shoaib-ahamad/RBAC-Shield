# 🛡️ Secure RBAC & Task Management System

This repository contains a production-ready, highly secure REST API with Role-Based Access Control (RBAC) and a supportive React Single-Page Application (SPA) dashboard. 

The application is built to demonstrate secure JWT handling, refresh token rotation, input validation, optimistic concurrency control, and modular architecture.

---

## 🚀 Quick Start (Docker Compose)

The easiest way to spin up the entire environment (PostgreSQL, Redis, Express API, and React Client) is using Docker Compose.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### Spin up the services
From the root directory, run:
```bash
docker compose up --build
```

Once execution completes:
- 🖥️ **Frontend Client**: http://localhost:3000
- 🔌 **Backend API**: http://localhost:5000/api/v1
- 📖 **Swagger API Docs**: http://localhost:5000/api-docs

---

## 🛠️ Local Startup (Without Docker)

For easy evaluation, the application includes a **complete fallback system**. If PostgreSQL or Redis are not detected, the API will automatically switch to **SQLite** (local file database) and an **in-memory cache wrapper**.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended) installed.

### 1. Setup Backend
```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder:
```env
PORT=5000
NODE_ENV=development
# For SQLite, use this database URL
DATABASE_URL="file:./dev.db"
# JWT Secrets
JWT_ACCESS_SECRET="super_secret_access_key_123_abc_xyz"
JWT_REFRESH_SECRET="super_secret_refresh_key_123_abc_xyz"
```

Configure the database, run migrations, and seed initial data:
```bash
# Update schema provider to sqlite (edit backend/prisma/schema.prisma)
# Change line 4: provider = "postgresql" -> provider = "sqlite"

npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

### 2. Setup Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open your browser to http://localhost:3000.

---

## 🔑 Test Accounts (Seeded)

The database seeder provisions two standard accounts:

1. ⚙️ **Administrator Account**:
   - **Email**: `admin@system.com`
   - **Password**: `AdminPass123`
   - *Clearance*: Full CRUD on all tasks, view registered users list, demote/promote users.

2. 👥 **Ordinary User Account**:
   - **Email**: `user@system.com`
   - **Password**: `UserPass123`
   - *Clearance*: CRUD on tasks they create, assign tasks to themselves, blocked from viewing user lists or accessing `/admin`.

---

## 📁 Repository Structure

```
rbac-system/
├── docker-compose.yml          # Multi-container orchestration
├── SCALABILITY.md             # Theoretical guide for large-scale operations
├── README.md                  # This file
│
├── backend/                    # Node.js + Express + TS
│   ├── prisma/
│   │   ├── schema.prisma      # DB definitions
│   │   └── seed.ts            # Database seeder
│   ├── src/
│   │   ├── config/            # Env, Redis, and Swagger setups
│   │   ├── controllers/       # Route request handlers
│   │   ├── middleware/        # JWT auth, RBAC, error handlers, and rate limiters
│   │   ├── routes/            # Express endpoint routers
│   │   ├── services/          # Pure business logic core
│   │   ├── utils/             # Winston logging & custom AppError classes
│   │   └── app.ts             # Server entry point
│   └── Dockerfile
│
└── frontend/                   # React + Vite + TS (Vanilla CSS)
    ├── src/
    │   ├── components/        # Modals, Navbar, Task cards
    │   ├── context/           # Session state (AuthContext)
    │   ├── pages/             # Dashboard, Admin panel, Login, Register
    │   ├── services/          # Axios client with auto-refresh interceptors
    │   └── main.tsx & App.tsx # Root SPA routing files
    └── Dockerfile
```

---

## 🛡️ Security Rationale & Implemented Rules

1. **Password Hashing**: Done via `bcryptjs` with `12` rounds. Max length checks reject strings >72 characters (preventing bcrypt truncation bypass).
2. **Access Token Lifespan**: Access tokens are kept in-memory and expire in 15 minutes.
3. **HTTP-Only Cookies**: Long-lived refresh tokens are stored in cookies with `httpOnly: true` (blocks XSS token extraction), `secure: true` (only over HTTPS), and `sameSite: 'strict'` (blocks CSRF cross-origin submits).
4. **Refresh Token Rotation (RTR)**: Each token exchange invalidates the old token. If a token is reused (indicating a stolen token replay), the system immediately revokes all active sessions for that user.
5. **Optimistic Concurrency Control (OCC)**: Handled via the `version` column. Prevents the "lost update" problem where concurrent updates overwrite each other.
6. **Self-Demotion Safety Check**: Admins cannot demote themselves, preventing locks.
