# 🛡️ Secure RBAC & Task Management System

A production-ready full-stack application demonstrating secure authentication, authorization, Role-Based Access Control (RBAC), task management, and modern deployment practices.

This project was built to explore how real-world applications handle authentication, authorization, session management, security, and scalability while maintaining a clean and modular architecture.

---

# 🌐 Live Demo

### Frontend Application

https://rbac-shield.vercel.app

### Backend API

https://rbac-shield.onrender.com/api/v1

### Swagger Documentation

https://rbac-shield.onrender.com/api-docs

---

# 🎯 Project Overview

This project implements a complete Role-Based Access Control (RBAC) system with secure JWT authentication and task management capabilities.

The application demonstrates:

* Secure Authentication & Authorization
* Role-Based Access Control (RBAC)
* JWT Access & Refresh Tokens
* Refresh Token Rotation
* Secure HTTP-Only Cookie Handling
* Input Validation & Validation Pipelines
* Optimistic Concurrency Control (OCC)
* API Documentation using Swagger
* Production Deployment
* Scalable Backend Architecture

---

# ✨ Features

## Authentication & Authorization

* User Registration
* User Login & Logout
* JWT Authentication
* Access Token Expiration
* Refresh Token Rotation
* Session Restoration
* Secure Password Hashing
* HTTP-Only Refresh Token Cookies
* Role-Based Route Protection

## Task Management

* Create Tasks
* View Tasks
* Update Tasks
* Delete Tasks
* Assign Tasks
* Task Status Tracking
* Ownership Validation
* Pagination & Filtering

## Administration

* View Registered Users
* Promote Users
* Demote Users
* Prevent Self-Demotion
* Manage System-Wide Resources

## Security

* Password Hashing using bcrypt
* JWT Access Tokens
* Refresh Token Rotation
* Secure Cookies
* Rate Limiting
* Input Validation
* RBAC Enforcement
* Optimistic Concurrency Control
* Centralized Error Handling

---

# 🔐 RBAC Model

The system follows a Role-Based Access Control (RBAC) architecture.

## USER

Permissions:

* Create Tasks
* View Own Tasks
* Update Own Tasks
* Delete Own Tasks
* Manage Personal Workflows

## ADMIN

Permissions:

* Manage All Tasks
* View All Users
* Promote Users
* Demote Users
* Access Administrative Endpoints

### Security Rule

Newly registered accounts are always assigned the `USER` role by the backend.

Administrative privileges can only be granted by an existing administrator.

This prevents privilege escalation through client-side manipulation.

---

# 🏗️ System Architecture

```text
┌─────────────────────────┐
│ React + TypeScript SPA  │
│        (Vercel)         │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Express.js REST API     │
│        (Render)         │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ PostgreSQL Database     │
│       (Supabase)        │
└─────────────────────────┘
```

---

# 🛠️ Tech Stack

## Frontend

* React
* TypeScript
* Vite
* Axios
* Context API
* Vanilla CSS

## Backend

* Node.js
* Express.js
* TypeScript
* Prisma ORM
* JWT
* bcryptjs
* Zod

## Database

* PostgreSQL
* SQLite (Local Fallback)

## DevOps & Deployment

* Docker
* Render
* Vercel
* Supabase
* GitHub

---

# 🔑 Test Accounts

The application includes seeded accounts for evaluation.

## Administrator Account

Email:

```text
admin@system.com
```

Password:

```text
AdminPass123
```

Permissions:

* Full CRUD on all tasks
* User management
* Role management

---

## Standard User Account

Email:

```text
user@system.com
```

Password:

```text
UserPass123
```

Permissions:

* CRUD on owned tasks only
* No administrative access

---

# 📁 Repository Structure

```text
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

# 🚀 Quick Start (Docker Compose)

The easiest way to spin up the complete environment is through Docker Compose.

### Prerequisites

* Docker Desktop

### Start Services

```bash
docker compose up --build
```

After startup:

Frontend:

```text
http://localhost:3000
```

Backend API:

```text
http://localhost:5000/api/v1
```

Swagger Documentation:

```text
http://localhost:5000/api-docs
```

---

# 🛠️ Local Setup

## Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="file:./dev.db"

JWT_ACCESS_SECRET="your_access_secret"
JWT_REFRESH_SECRET="your_refresh_secret"
```

Generate Prisma Client:

```bash
npx prisma generate
```

Run Migrations:

```bash
npx prisma migrate dev --name init
```

Seed Database:

```bash
npx prisma db seed
```

Start Backend:

```bash
npm run dev
```

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# 🔒 Security Features

## Password Hashing

* bcryptjs
* 12 Salt Rounds
* Protection against bcrypt truncation attacks

## JWT Strategy

* Short-Lived Access Tokens
* Long-Lived Refresh Tokens
* Refresh Token Rotation

## Cookie Security

* HTTP-Only Cookies
* Secure Cookies
* SameSite Protection

## Rate Limiting

Login Endpoint:

```text
10 requests/minute
```

Registration Endpoint:

```text
5 requests/minute
```

## Optimistic Concurrency Control

A version column is maintained for tasks to prevent lost updates during concurrent modifications.

---

# 📚 API Documentation

Swagger UI is available at:

https://rbac-shield.onrender.com/api-docs

The documentation includes:

* Authentication APIs
* User APIs
* Task APIs
* Request Schemas
* Response Schemas
* Error Responses

---

# 📈 Scalability Considerations

This repository includes a dedicated scalability roadmap covering:

* Redis Caching
* Database Connection Pooling
* Read Replicas
* PgBouncer
* Microservice Decomposition
* Horizontal Scaling
* Cache Invalidation Strategies

See:

```text
SCALABILITY.md
```

for detailed discussion.

---

# 🎓 Key Learning Outcomes

Through this project I gained practical experience with:

* Authentication vs Authorization
* Role-Based Access Control (RBAC)
* JWT Session Management
* Refresh Token Rotation
* Secure Cookie Handling
* Prisma ORM
* PostgreSQL Database Design
* API Validation
* Rate Limiting
* Optimistic Concurrency Control
* Swagger Documentation
* CORS Configuration
* Production Deployment
* Environment Variable Management
* Git-Based CI/CD Workflows
* Debugging Real-World Deployment Issues

---

# 🚀 Future Improvements

* Email Verification
* Password Reset Flow
* Audit Logging
* Fine-Grained Permissions
* Team-Based Access Control
* Redis Session Storage
* WebSocket Notifications
* Activity Monitoring
* Analytics Dashboard

---

## 👨‍💻 Author

**Shoaib Ahamad Mev**

Computer Science Engineer | Backend Developer | Full-Stack Developer

* GitHub: https://github.com/Shoaib-ahamad

* LinkedIn: https://www.linkedin.com/in/shoaib-ahamad-mev/

---

If you found this project useful, feel free to explore the codebase, review the architecture, and provide feedback.
