import type { NextFunction, Request, Response } from "express";
import config from "../config";

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const devMode = config.node_env === "development";
    
   
    console.error("🛑 GLOBAL ERROR CATCHER:", err);

    res.status(500).json({
        success: false,
 
        message: err?.message || (typeof err === "string" ? err : "Fatal App Failure"),
        errorDetails: devMode ? err : undefined,
        stack: devMode ? err?.stack : undefined
    });
};