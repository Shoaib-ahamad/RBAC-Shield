# Scalability & Cloud Architecture Note: RBAC & Task System

This document outlines the architectural roadmap for transitioning this monolithic local application into a production-grade, highly available, and horizontally scalable system capable of serving millions of requests.

---

## 1. High-Level Production Architecture Topology

In a production environment, the single-server docker setup is replaced by a distributed cloud topology:

```
                  [ Client Browser Requests ]
                              │
                              ▼ (HTTPS / DNS Geo-Routing)
                      [ Cloudflare CDN ]
            (DDoS Protection, SSL, Static Asset Caching)
                              │
                              ▼
                [ Application Load Balancer ] (AWS ALB / Nginx)
            (SSL Termination, Path Routing, Health Checking)
                              │
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
   [ API Instance Pod 1 ]              [ API Instance Pod 2 ]
  (Express, Stateless)                (Express, Stateless)
   - CPU Auto-scaled (ECS/K8s)         - CPU Auto-scaled (ECS/K8s)
            │                                   │
      ┌─────┴───────────────┬───────────────────┴─────┐
      ▼                     ▼                         ▼
 [ Redis Cluster ]     [ PgBouncer Pooler ]    [ Redis Sentinel ]
 (Token Blacklist)     (Db Connection Pool)    (Task / Role Cache)
      │                     │                         │
      │                     ├── (Write Queries)       │
      │                     ▼                         │
      │            [ PostgreSQL Primary ]             │
      │            (ACID Writes, Schema)              │
      │                     │                         │
      │                     ▼ (Streaming Replication) │
      │            [ PostgreSQL Replicas ]            │
      │            (Read Queries - SELECTs) ◄─────────┘
      └───────────────────────────────────────────────┘
```

---

## 2. Stateless Core & Horizontal Compute Scaling

### Load Balancing & Container Orchestration
- **Application Load Balancer (ALB)**: Acts as the single entry point. It distributes traffic using a Round-Robin algorithm across backend containers. It handles SSL/TLS termination, freeing up compute power on API nodes.
- **Kubernetes (EKS) / AWS ECS (Fargate)**: Backend containers are hosted as serverless tasks. Autoscaling groups are configured to scale horizontally based on target metrics (e.g., scale up when CPU utilization exceeds 70% or request-count-per-target exceeds 2000/min).

### PM2 Clustering
- Within individual Node.js container hosts, **PM2 Cluster Mode** is utilized to spawn worker instances matching the available CPU core count. Node's single-threaded event loop is thus replicated across all cores, maximizing single-host capacity.

---

## 3. Database Scaling & Connection Pooling

### Connection Pooling (PgBouncer)
- PostgreSQL spawns a separate backend process for each client connection, which consumes memory (approx. 10MB per connection). Under high traffic, API instances scaling horizontally can easily exceed PostgreSQL's max connection limits.
- **PgBouncer** sits in front of PostgreSQL to manage a pool of active database connections. Express instances query PgBouncer, which reuse connections dynamically via transaction-level pooling, reducing connection overhead.

### Read Replicas (Write/Read Segmentation)
- In typical web apps, read operations (e.g., retrieving tasks list, checking user roles) outnumber write operations (e.g., registering users, editing tasks) by a 10:1 ratio.
- We implement **Write/Read Split**:
  - All mutations (`INSERT`, `UPDATE`, `DELETE`) target the **PostgreSQL Primary Database**.
  - All read actions (`SELECT`) are routed to a pool of **PostgreSQL Read Replicas**, which sync asynchronously with the primary. This offloads resource-heavy search queries from the primary node.

### Indexes & Query Optimizations
- Relational tables include compound indices:
  - `idx_tasks_created_by` and `idx_tasks_assigned_to` are crucial for supporting fast paginated searches.
  - `idx_users_email` enables sub-millisecond login verification times.

---

## 4. Multi-Tiered Caching Topology (Redis)

To protect databases from high query loads, we utilize **Redis** across three key layers:

### A. Session & Role Cache (TTL: 5 Minutes)
- Rather than querying PostgreSQL on every API call to verify if a user's ID exists and what their role is during authorization, we store user objects in Redis:
  - Key: `user:session:${userId}` -> Value: `{ email, role }`
  - When the authorization middleware executes, it queries Redis first. On cache miss, it queries PostgreSQL and populates the cache.
  - Role modifications by admins immediately delete the user's session cache key, forcing a database reload on their next request (immediate role enforcement).

### B. Task Board List Cache (TTL: 15 Minutes)
- Paginated task boards are cached using user-specific cache keys:
  - Key: `tasks:user:${userId}:status:${statusFilter}:search:${searchQuery}:page:${page}`
  - **Cache Invalidation**: Any write mutation (create, edit, delete, or status update) on tasks by a user immediately invalidates all cache keys prefixed with `tasks:user:${userId}:*`. This maintains data accuracy while eliminating read queries on unchanged data.

### C. Refresh Token Blacklisting & Session Revocation
- To support Refresh Token Rotation (RTR), used or logged-out refresh tokens are stored in Redis with a TTL matching the token's remaining expiration time. 
- Using Redis for blacklisting provides rapid checks during token exchange, safeguarding the app from replay attacks.

---

## 5. Decomposing to Microservices

As the application grows, the monolithic backend can be split into three decoupled services:

1. **Authentication Service**: Handles user register/login, password hashing, and JWT signing/validation. Exposes token rotation APIs.
2. **Task Service**: Manages task boards, CRUD operations, and assignee allocations.
3. **Admin Service**: Handles user role management, system audits, and user lists.

### Inter-Service Communication
- **Synchronous**: REST/gRPC for immediate queries (e.g., Task Service calling Auth Service to verify if an assignee ID exists).
- **Asynchronous**: Message brokers (**RabbitMQ** or **Apache Kafka**) handle event-driven flows. For example, when a user is deleted, a `user.deleted` event is published. The Task Service consumes this event and updates all tasks assigned to that user, ensuring eventual consistency without synchronous blocks.

---

## 6. Resilience & Edge Security

### API Gateway & Rate Limiting
- **Cloudflare Integration**: Handles DDoS mitigation, Web Application Firewall (WAF) rule sets, and geo-ip blocks.
- **Distributed Rate Limiting**: The rate-limiting middleware queries a shared Redis Cluster using a sliding-window algorithm. This prevents users from bypassing rate limits by hitting different Express API nodes, protecting authentication routes from brute-force attempts.
