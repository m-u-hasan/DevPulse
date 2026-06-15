import jwt from "jsonwebtoken";
import config from "../config";
import type { JwtPayload } from "../types";

export const signToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, config.jwt_secret, { expiresIn: "1d" });
};

export const verifyToken = (token: string): JwtPayload | null => {
    try {
        return jwt.verify(token, config.jwt_secret) as JwtPayload;
    } catch {
        return null;
    }
};