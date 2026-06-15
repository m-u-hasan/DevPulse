import type { NextFunction, Request, Response } from "express";
import config from "../config";

export const globalErrorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
    const devMode = config.node_env === "development";
    res.status(500).json({
        success: false,
        message: err instanceof Error ? err.message : "Fatal App Failure",
        stack: devMode && err instanceof Error ? err.stack : undefined
    });
};