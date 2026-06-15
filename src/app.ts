import express, { type Application } from "express";
import cors from "cors";
import { globalErrorHandler } from "./middleware/globalErrorHandler";

const app: Application = express();

app.use(cors());
app.use(express.json());

app.use(globalErrorHandler);
export default app;