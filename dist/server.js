

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app.ts
import express from "express";
import cors from "cors";

// src/config/index.ts
import dotenv from "dotenv";
dotenv.config();
var config = {
  port: process.env.PORT || 5e3,
  database_url: process.env.DATABASE_URL,
  node_env: process.env.NODE_ENV || "development",
  jwt_secret: process.env.JWT_SECRET
};
var config_default = config;

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  const devMode = config_default.node_env === "development";
  console.error("\u{1F6D1} GLOBAL ERROR CATCHER:", err);
  res.status(500).json({
    success: false,
    message: err?.message || (typeof err === "string" ? err : "Fatal App Failure"),
    errorDetails: devMode ? err : void 0,
    stack: devMode ? err?.stack : void 0
  });
};

// src/api/routes/auth.routes.ts
import { Router } from "express";

// src/db/index.ts
import { Pool } from "pg";
var pool = new Pool({
  connectionString: config_default.database_url
});
var initDB = async () => {
  try {
    await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role VARCHAR(20) NOT NULL DEFAULT 'contributor',
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW()
            );
        `);
    await pool.query(`
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
        `);
    console.log("Postgres tables successfully created.");
  } catch (error) {
    console.error("Database schema boot failed:", error);
    throw error;
  }
};

// src/api/services/auth.service.ts
import bcrypt from "bcryptjs";
var AuthService = class {
  async registerUser(name, email, pass, role) {
    const saltRound = 10;
    const hash = await bcrypt.hash(pass, saltRound);
    const userRole = role || "contributor";
    const sql = `
            INSERT INTO users (name, email, password, role)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, email, role, created_at, updated_at;
        `;
    const result = await pool.query(sql, [name, email, hash, userRole]);
    return result.rows[0] || null;
  }
  async findUserByEmail(email) {
    const result = await pool.query(`SELECT * FROM users WHERE email = $1;`, [email]);
    return result.rows[0] || null;
  }
};
var auth_service_default = new AuthService();

// src/utils/sendResponse.ts
function sendResponse(res, { message, data, error }, status = 200) {
  res.status(status).json({
    success: !error,
    message,
    data: error ? void 0 : data
  });
}

// src/utils/jwt.ts
import jwt from "jsonwebtoken";
var signToken = (payload) => {
  return jwt.sign(payload, config_default.jwt_secret, { expiresIn: "1d" });
};
var verifyToken = (token) => {
  try {
    return jwt.verify(token, config_default.jwt_secret);
  } catch {
    return null;
  }
};

// src/api/controllers/auth.controller.ts
import bcrypt2 from "bcryptjs";
var signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const uniqueCheck = await auth_service_default.findUserByEmail(email);
    if (uniqueCheck) {
      sendResponse(res, { message: "Email already registered" }, 400);
      return;
    }
    const registeredProfile = await auth_service_default.registerUser(name, email, password, role);
    if (!registeredProfile) {
      sendResponse(res, { message: "Registration setup aborted" }, 400);
      return;
    }
    sendResponse(res, { message: "Account created successfully", data: registeredProfile }, 201);
  } catch (error) {
    console.error("SIGNUP RUNTIME CRASH:", error);
    sendResponse(res, {
      message: error instanceof Error ? error.message : "Internal server fault",
      error: true
    }, 500);
  }
};
var login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      sendResponse(res, { message: "Email and password are required fields" }, 400);
      return;
    }
    const identityMatch = await auth_service_default.findUserByEmail(email);
    if (!identityMatch) {
      sendResponse(res, { message: "Bad request for login inputs" }, 401);
      return;
    }
    const validPass = await bcrypt2.compare(password, identityMatch.password);
    if (!validPass) {
      sendResponse(res, { message: "Bad request for login inputs" }, 401);
      return;
    }
    const token = signToken({ id: identityMatch.id, name: identityMatch.name, role: identityMatch.role });
    const { password: _, ...securedUserOutput } = identityMatch;
    sendResponse(res, {
      message: "Authentication tokens dispatched",
      data: { token, user: securedUserOutput }
    });
  } catch (error) {
    console.error("CRITICAL LOGIN RUNTIME CRASH:", error);
    sendResponse(res, {
      message: error?.message || "Internal server fault",
      error: true,
      data: error
    }, 500);
  }
};

// src/api/routes/auth.routes.ts
var router = Router();
router.post("/signup", signup);
router.post("/login", login);
var auth_routes_default = router;

// src/api/routes/issue.routes.ts
import { Router as Router2 } from "express";

// src/api/services/issue.service.ts
var IssueService = class {
  // 1. Save a new issue to the database
  async createIssue(title, description, type, reporterId) {
    const query = `
            INSERT INTO issues (title, description, type, reporter_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
    const result = await pool.query(query, [title, description, type, reporterId]);
    return result.rows[0];
  }
  // 2. Find a specific issue by its ID
  async getIssueById(id) {
    const result = await pool.query(`SELECT * FROM issues WHERE id = $1;`, [id]);
    return result.rows[0] || null;
  }
  // 3. Fetch multiple users from the database in one single batch
  async fetchUsersBatch(ids) {
    if (ids.length === 0) return [];
    const uniqueIds = [...new Set(ids)];
    const placeholders = uniqueIds.map((_, i) => `$${i + 1}`).join(",");
    const query = `SELECT id, name, role FROM users WHERE id IN (${placeholders});`;
    const result = await pool.query(query, uniqueIds);
    return result.rows;
  }
  // 4. Get all issues and stitch user data at the application level
  async scanAllIssues(filters) {
    let sqlStatement = `SELECT * FROM issues WHERE 1=1`;
    const parameters = [];
    let indexOffset = 1;
    if (filters.type) {
      sqlStatement += ` AND type = $${indexOffset}`;
      parameters.push(filters.type);
      indexOffset++;
    }
    if (filters.status) {
      sqlStatement += ` AND status = $${indexOffset}`;
      parameters.push(filters.status);
      indexOffset++;
    }
    const sortSequence = filters.sort === "oldest" ? "ASC" : "DESC";
    sqlStatement += ` ORDER BY created_at ${sortSequence};`;
    const queryResult = await pool.query(sqlStatement, parameters);
    const rawIssues = queryResult.rows;
    if (rawIssues.length === 0) return [];
    const reporterIds = rawIssues.map((issue) => issue.reporter_id);
    const users = await this.fetchUsersBatch(reporterIds);
    const userMap = /* @__PURE__ */ new Map();
    users.forEach((user) => userMap.set(user.id, user));
    const stitchedIssues = rawIssues.map((issue) => {
      const reporter = userMap.get(issue.reporter_id);
      const reporterData = reporter ? {
        id: reporter.id,
        name: reporter.name,
        role: reporter.role
      } : {
        id: issue.reporter_id,
        name: "Unknown / Disassociated User",
        role: "N/A"
      };
      const { reporter_id, ...issueData } = issue;
      return {
        ...issueData,
        reporter: reporterData
      };
    });
    return stitchedIssues;
  }
  // 5. Update dynamic issue fields using dynamic SQL token assignment
  async saveIssueUpdates(id, activeFields) {
    const syntaxTokens = [];
    const argumentValues = [];
    let variableCounter = 1;
    Object.entries(activeFields).forEach(([property, value]) => {
      if (value !== void 0) {
        syntaxTokens.push(`${property} = $${variableCounter}`);
        argumentValues.push(value);
        variableCounter++;
      }
    });
    if (syntaxTokens.length === 0) return null;
    argumentValues.push(id);
    const sql = `UPDATE issues SET ${syntaxTokens.join(", ")}, updated_at = NOW() WHERE id = $${variableCounter} RETURNING *;`;
    const actionResult = await pool.query(sql, argumentValues);
    return actionResult.rows[0] || null;
  }
  // 6. Delete a specific issue from the database completely
  async removeIssue(id) {
    const status = await pool.query(`DELETE FROM issues WHERE id = $1;`, [id]);
    return (status.rowCount ?? 0) > 0;
  }
};
var issue_service_default = new IssueService();

// src/api/controllers/issue.controller.ts
var createIssue = async (req, res) => {
  try {
    const { title, description, type } = req.body;
    const reporterId = req.user.id;
    const issue = await issue_service_default.createIssue(title, description, type, reporterId);
    sendResponse(res, { message: "Issue logged successfully", data: issue }, 201);
  } catch (error) {
    sendResponse(res, { message: "Internal server error", error: true }, 500);
  }
};
var getSingleIssue = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const issue = await issue_service_default.getIssueById(id);
    if (!issue) {
      sendResponse(res, { message: "Issue registry not found" }, 404);
      return;
    }
    const reporterId = issue.reporter_id;
    const users = await issue_service_default.fetchUsersBatch([reporterId]);
    const { reporter_id, ...issueData } = issue;
    const payload = {
      ...issueData,
      reporter: users[0] || null
    };
    sendResponse(res, { message: "Issue data compiled successfully", data: payload });
  } catch (error) {
    sendResponse(res, { message: "Internal server error", error: true }, 500);
  }
};
var getAllIssues = async (req, res) => {
  try {
    const sortParam = typeof req.query.sort === "string" ? req.query.sort : void 0;
    const typeParam = typeof req.query.type === "string" ? req.query.type : void 0;
    const statusParam = typeof req.query.status === "string" ? req.query.status : void 0;
    const finalizedResultCollection = await issue_service_default.scanAllIssues({
      sort: sortParam,
      type: typeParam,
      status: statusParam
    });
    sendResponse(res, { message: "Filtered issue logs", data: finalizedResultCollection });
  } catch (error) {
    console.error("Error in getAllIssues:", error);
    sendResponse(res, {
      message: error?.message || "Internal server fault",
      error: true,
      data: {
        message: error?.message,
        stack: error?.stack,
        details: error
      }
    }, 500);
  }
};
var updateIssue = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const operator = req.user;
    const existingRecord = await issue_service_default.getIssueById(id);
    if (!existingRecord) {
      sendResponse(res, { message: "Requested reference log empty" }, 404);
      return;
    }
    if (operator.role !== "maintainer") {
      if (existingRecord.reporter_id !== operator.id) {
        sendResponse(res, { message: "Forbidden: Data ownership violation" }, 403);
        return;
      }
      if (existingRecord.status !== "open") {
        sendResponse(res, { message: "Conflict: Log locked from non-maintainer update" }, 409);
        return;
      }
      if (req.body.status && req.body.status !== existingRecord.status) {
        sendResponse(res, { message: "Forbidden: Workflow status can only be managed by maintainers" }, 403);
        return;
      }
    }
    const freshlyUpdatedRecord = await issue_service_default.saveIssueUpdates(id, req.body);
    sendResponse(res, { message: "Issue details updated successfully", data: freshlyUpdatedRecord });
  } catch (error) {
    sendResponse(res, { message: "Internal server fault", error: true }, 500);
  }
};
var deleteIssue = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const logExists = await issue_service_default.getIssueById(id);
    if (!logExists) {
      sendResponse(res, { message: "Requested reference log empty" }, 404);
      return;
    }
    await issue_service_default.removeIssue(id);
    sendResponse(res, { message: "Target row permanently erased" });
  } catch (error) {
    sendResponse(res, { message: "Internal server fault", error: true }, 500);
  }
};

// src/middleware/auth.middleware.ts
var authGuard = (authorizedRoles) => {
  return (req, res, next) => {
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader) {
      sendResponse(res, { message: "Authorization credential tokens missing" }, 401);
      return;
    }
    const tokenSegments = authorizationHeader.split(" ");
    const extractedToken = tokenSegments.length === 2 ? tokenSegments[1] : tokenSegments[0];
    const sessionPayload = verifyToken(extractedToken);
    if (!sessionPayload) {
      sendResponse(res, { message: "Token signature validation failed" }, 401);
      return;
    }
    req.user = sessionPayload;
    if (authorizedRoles && !authorizedRoles.includes(sessionPayload.role)) {
      sendResponse(res, { message: "Access roles criteria constraint" }, 403);
      return;
    }
    next();
  };
};

// src/api/routes/issue.routes.ts
var router2 = Router2();
router2.post("/", authGuard(["contributor", "maintainer"]), createIssue);
router2.get("/", getAllIssues);
router2.get("/:id", getSingleIssue);
router2.patch("/:id", authGuard(["contributor", "maintainer"]), updateIssue);
router2.delete("/:id", authGuard(["maintainer"]), deleteIssue);
var issue_routes_default = router2;

// src/app.ts
var app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", auth_routes_default);
app.use("/api/issues", issue_routes_default);
app.get("/health", (req, res) => {
  res.status(200).json({ success: true, status: "DevPulse API is active and running" });
});
app.use(globalErrorHandler);
var app_default = app;

// src/server.ts
initDB().then(() => {
  console.log("Database initialized successfully.");
}).catch((err) => {
  console.error("Database initialization failed:", err);
});
if (config_default.node_env !== "production") {
  app_default.listen(config_default.port, () => {
    console.log(`Server executing smoothly on ${config_default.port}`);
  });
}
var server_default = app_default;
export {
  server_default as default
};
//# sourceMappingURL=server.js.map