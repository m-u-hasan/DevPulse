# 🚀 DevPulse - AI-Driven Issue & Bug Tracker Backend

Welcome to **DevPulse**! This is a production-ready, highly optimized RESTful API built to track software bugs, issues, and feature requests. This project was developed as a core milestone in my journey toward mastering enterprise-level full-stack software engineering. 

As a passionate learner and junior software engineer, my goal with DevPulse was to implement strict **Role-Based Access Control (RBAC)**, robust relational data handling without heavy ORM overhead, and deploy a scalable serverless architecture.

* **Live API URL:** [https://dev-pulse-five-coral.vercel.app](https://dev-pulse-five-coral.vercel.app)
* **GitHub Repository:** [https://github.com/m-u-hasan/DevPulse](https://github.com/m-u-hasan/DevPulse)
* **Author:** Md. Mahamud- (Junior Full-Stack Software Engineer Intern)

---

## ✨ Key Features

* **Secure Authentication Module:** Complete user onboarding with secure password hashing via `bcrypt` and stateful session security using JSON Web Tokens (JWT).
* **Role-Based Access Control (RBAC):** Granular access delegation dividing users into `contributor` and `maintainer` roles to guard sensitive operational routes.
* **Smart Issue Pipeline:** Full CRUD lifecycle for tracking issues with dynamic filtering parameters (sort, type, status).
* **Data Stitching & Aggregation:** High-performance relational structuring that injects reporter metadata into issues at the application layer, ensuring swift response times without expensive database JOIN overloads.
* **Serverless Resiliency:** Graceful error boundary management tailored for Vercel Serverless Functions paired with Connection Pooling to eliminate database exhaustions.

---

## 🛠️ Tech Stack & Architecture

* **Runtime Environment:** Node.js (v20.x)
* **Language:** TypeScript (Strict Type Safety)
* **Framework:** Express.js (v4.19.2)
* **Database:** Neon PostgreSQL (Serverless Cloud Postgres)
* **Compilation & Bundling:** `tsup` (Rapid ESM/CJS bundling)
* **Deployment & Hosting:** Vercel Infrastructure

---

## 🗄️ Database Schema Summary

The database uses raw, relational PostgreSQL schemas built with relational integrity and cascading rules to enforce strict data dependencies.

```sql
-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'contributor', -- 'contributor' or 'maintainer'
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Issues Table
CREATE TABLE IF NOT EXISTS issues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL, -- Mapped as 'title' in business logic
    description TEXT NOT NULL,
    type VARCHAR(20) NOT NULL,    -- 'bug' or 'feature_request'
    status VARCHAR(20) NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'resolved'
    reporter_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);