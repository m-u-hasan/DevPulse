# DevPulse Enterprise Issue Tracker

An elite-tier, high-performance, AI-driven asynchronous issue tracking and metrics management system engineered using **Node.js (TypeScript)**, **Express.js**, and raw **PostgreSQL**. 

This system features a highly optimized distributed memory application-level data stitching engine (In-Memory Hash Mapping Architecture) designed to bypass traditional heavy database joins (`SQL JOIN`), enabling lightning-fast operations and linear database scaling.

---

## 🚀 Live Environment Architecture
* **Production Core API URL:** `http://localhost:5000`
* **API Version:** `v1.0.0`
* **Environment Status:** Active / Production Ready

---

## 🛠️ Tech Stack & Architecture Matrix

### Backend Core Engine
* **Language Runtime:** TypeScript / Node.js (ES2022 / ESM System)
* **Application Framework:** Express.js (Strict Typing Configuration)
* **Execution Watcher:** `tsx` (TypeScript Execute Core)

### Database Infrastructure
* **Engine:** PostgreSQL 16+ Core
* **Driver Interface:** `pg` (Node-Postgres Native Driver Pool)
* **Connection Pooling:** Dynamic Elastic Resource Pool Management

### Security & Optimization Layers
* **Identity Validation:** JSON Web Token (JWT) asymmetric signature verification
* **Cryptographic Hashing:** `bcrypt` (Adaptive workload structural salt configuration)
* **Data Synthesis Engine:** Application-Level Inline Index Memory Stitching ($O(1)$ Hash Map Resolution)

---

## 🔥 Enterprise Engineering Features
* **Zero-Join Structural Stitching:** Combines normalized issue metrics and user metadata dynamically at the application level via an in-memory memory map, preventing index scan delays on database clusters.
* **Granular Role-Based Access Control (RBAC):** Rigid separation of operational capabilities between `contributor` and `maintainer` records.
* **Deterministic Filtering & Sequence Engines:** Bulletproof scan pipelines implementing strict parameters for types, workflow state-machines, and creation timelines.
* **State & Data Mutability Guardrails:** Contributor records are completely locked from altering system workflow properties (`status`), and mutations are permitted strictly for owned logs that remain in an `open` state.

---

## 🗄️ Database Schema Topology

The database enforces a clean relational footprint utilizing structured referential integrity without reliance on heavy views or redundant denormalized properties.

### 1. `users` Table
| Column Name  | Data Type  | Constraints / Modifiers |
| :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` |
| `name` | `VARCHAR(100)` | `NOT NULL` |
| `email` | `VARCHAR(255)` | `UNIQUE` / `NOT NULL` |
| `password` | `TEXT` | `NOT NULL` (Bcrypt Encrypted Hash) |
| `role` | `VARCHAR(20)` | `NOT NULL` / `DEFAULT 'contributor'` |
| `created_at` | `TIMESTAMP` | `NOT NULL` / `DEFAULT NOW()` |
| `updated_at` | `TIMESTAMP` | `NOT NULL` / `DEFAULT NOW()` |

### 2. `issues` Table
| Column Name  | Data Type  | Constraints / Modifiers |
| :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` |
| `title` | `VARCHAR(150)` | `NOT NULL` |
| `description`| `TEXT` | `NOT NULL` |
| `type` | `VARCHAR(20)` | `NOT NULL` (`bug` \| `feature`) |
| `status` | `VARCHAR(20)` | `NOT NULL` / `DEFAULT 'open'` (`open` \| `in_progress` \| `resolved`) |
| `reporter_id`| `INT` | `NOT NULL` / `REFERENCES users(id) ON DELETE CASCADE` |
| `created_at` | `TIMESTAMP` | `NOT NULL` / `DEFAULT NOW()` |
| `updated_at` | `TIMESTAMP` | `NOT NULL` / `DEFAULT NOW()` |

---

## ⚙️ Local Infrastructure Setup Steps

Execute these sequential instructions inside your enterprise shell terminal to build the infrastructure layout from base configurations:

### 1. Clone & Access the Directory
```bash
git clone <your-repository-url>
cd devpulse