import type { Request, Response } from "express";
import authService from "../services/auth.service";
import { sendResponse } from "../../utils/sendResponse";
import { signToken } from "../../utils/jwt";
import bcrypt from 'bcryptjs';

export const signup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password, role } = req.body;

        // Check if email already exists
        const uniqueCheck = await authService.findUserByEmail(email);
        if (uniqueCheck) {
            sendResponse(res, { message: "Email already registered" }, 400);
            return;
        }

        // Register new user profile
        const registeredProfile = await authService.registerUser(name, email, password, role);
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

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Validate input fields
        if (!email || !password) {
            sendResponse(res, { message: "Email and password are required fields" }, 400);
            return;
        }

        // Check user identity
        const identityMatch = await authService.findUserByEmail(email);
        if (!identityMatch) {
            sendResponse(res, { message: "Bad request for login inputs" }, 401);
            return;
        }

        // Verify password hash
        const validPass = await bcrypt.compare(password, identityMatch.password);
        if (!validPass) {
            sendResponse(res, { message: "Bad request for login inputs" }, 401);
            return;
        }

        // Generate access token
        const token = signToken({ id: identityMatch.id, name: identityMatch.name, role: identityMatch.role });

        // Omit password from output
        const { password: _, ...securedUserOutput } = identityMatch;

        sendResponse(res, {
            message: "Authentication tokens dispatched",
            data: { token, user: securedUserOutput }
        });
    } catch (error: any) {
        console.error("CRITICAL LOGIN RUNTIME CRASH:", error);

        sendResponse(res, {
            message: error?.message || "Internal server fault",
            error: true,
            data: error
        }, 500);
    }
};