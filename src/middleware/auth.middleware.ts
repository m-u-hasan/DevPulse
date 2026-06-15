import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { sendResponse } from "../utils/sendResponse";
import type { UserRole } from "../types";

export const authGuard = (authorizedRoles?: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
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