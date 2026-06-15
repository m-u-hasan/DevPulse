import express, { type Application } from "express";
import cors from "cors";
import { globalErrorHandler } from "./middleware/globalErrorHandler";
import authRoutes from "./api/routes/auth.routes";
import issueRoutes from "./api/routes/issue.routes";

const app: Application = express();

app.use(cors());
app.use(express.json());

// Route Mounting
app.use("/api/auth", authRoutes);
app.use("/api/issues", issueRoutes);

app.get("/health", (req, res) => {
    res.status(200).json({ success: true, status: "DevPulse API is active and running" });
});

app.use(globalErrorHandler);
export default app;