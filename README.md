# 🚀 DevPulse - AI-Driven Issue & Bug Tracker Backend

Welcome to **DevPulse**! This is a production-ready, highly optimized RESTful API built to track software bugs, issues, and feature requests. 

* **Live API URL:** [https://dev-pulse-five-coral.vercel.app](https://dev-pulse-five-coral.vercel.app)
* **GitHub Repository:** [https://github.com/m-u-hasan/DevPulse](https://github.com/m-u-hasan/DevPulse)
* **Author:** Md. Mahamud-Ul-Hasan (Junior Full-Stack Software Engineer Intern)

---

## 📹 Technical Interview Videos
* **purpose of next() in Express middleware (1):** [Watch on YouTube](https://youtu.be/enIYHd-UoNE?si=NlRYXW4GylJGCO7l)
* **Database Connection Pooling Explainer (2):** [Watch on YouTube](https://youtu.be/15Cr1YFmhrQ?si=kDXTZEUvTaNF6i65)

---

## ✨ Key Features
* **Secure Auth:** Onboarding with bcrypt password hashing and JSON Web Tokens (JWT).
* **Role-Based Access:** Enforced route protection for `contributor` and `maintainer` roles.
* **Smart Pipelines:** Full CRUD lifecycle supporting dynamic sorting and query filters.
* **Data Stitching:** Application-layer user metadata injection to bypass expensive database JOINs.
* **Cloud Resiliency:** Tailored for Vercel Serverless Functions paired with Neon Connection Pooling.

---

## 🛠️ Tech Stack & Architecture
* **Language/Framework:** TypeScript, Node.js, Express.js (v4.19.2)
* **Database:** Neon PostgreSQL (Serverless Cloud Postgres)
* **Compilation/Hosting:** `tsup` bundler, Vercel cloud infrastructure

---

## 🗄️ Database Schema Summary

```sql
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'contributor',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS issues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    reporter_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## 🛣️ API Endpoints Specification

### 🔐 1. Authentication Module

#### A. User Registration
* **Endpoint:** `POST` `https://dev-pulse-five-coral.vercel.app/api/auth/signup`
* **Access:** Public
* **Payload:**
```json
{
  "name": "Md. Mahamud-Ul-Hasan",
  "email": "web.mahamud@gmail.com",
  "password": "test123",
  "role": "contributor"
}
```

#### B. User Login
* **Endpoint:** `POST` `https://dev-pulse-five-coral.vercel.app/api/auth/login`
* **Access:** Public
* **Payload:**
```json
{
  "email": "web.mahamud@gmail.com",
  "password": "test123"
}
```

---

### 🐛 2. Issues Module

#### A. Create Issue
* **Endpoint:** `POST` `https://dev-pulse-five-coral.vercel.app/api/issues`
* **Access:** Authenticated (Bearer Token required)
* **Payload:**
```json
{
  "title": "JWT verification failing intermittently on serverless edge",
  "description": "Token signature validation drops under concurrent edge network spikes, throwing 401 unhandled rejections.",
  "type": "bug"
}
```

#### B. Get All Issues (With Filtering & Sorting)
* **Endpoint:** `GET` `https://dev-pulse-five-coral.vercel.app/api/issues`
* **Access:** Public
* **Supported Query Params:** `?sort=newest|oldest&type=bug&status=open`

#### C. Get Single Issue
* **Endpoint:** `GET` `https://dev-pulse-five-coral.vercel.app/api/issues/:id`
* **Access:** Public

#### D. Update Issue
* **Endpoint:** `PATCH` `https://dev-pulse-five-coral.vercel.app/api/issues/:id`
* **Access:** Maintainer OR Contributor (Own open issues only)
* **Payload:**
```json
{
  "title": "Fixed: JWT validation pipeline deployment sync",
  "description": "Refactored secret gateway buffers to preserve clock timestamp margins on cluster restarts.",
  "type": "bug"
}
```

#### E. Delete Issue
* **Endpoint:** `DELETE` `https://dev-pulse-five-coral.vercel.app/api/issues/:id`
* **Access:** Maintainer Only

---

## ⚙️ Local Setup & Installation

### 1. Clone & Install Dependencies
```bash
git clone [https://github.com/m-u-hasan/DevPulse.git](https://github.com/m-u-hasan/DevPulse.git)
cd DevPulse
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=your_neon_postgresql_pooler_url
JWT_SECRET=your_jwt_secret_passphrase
```

### 3. Local Development & Deployment
```bash
# Start development watch loop
npm run dev

# Compile distribution bundle
npm run build

# Push straight into production cloud infrastructure
vercel --prod
```

---

## 💡 Engineering Reflection & Growth Takeaways
* **Serverless Behavior:** Mastered graceful error boundaries by eliminating hard `process.exit()` loops that break serverless host execution.
* **Connection Pooling:** Implemented serverless transactional pooling to regulate query concurrency thresholds under heavy traffic.
* **Type Strictness:** Enforced tight TypeScript compiler rule maps across core service schemas for zero data leakage.
