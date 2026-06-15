import type { Request, Response } from "express";
import authService from "../services/auth.service";
import { sendResponse } from "../../utils/sendResponse";
import { signToken } from "../../utils/jwt";
import bcrypt from "bcrypt";

export const signup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password, role } = req.body;

        const uniqueCheck = await authService.findUserByEmail(email);
        if (uniqueCheck) {
            sendResponse(res, { message: "Email already registered" }, 400);
            return;
        }

        const registeredProfile = await authService.registerUser(name, email, password, role);
        if (!registeredProfile) {
            sendResponse(res, { message: "Registration setup aborted" }, 400);
            return;
        }

        sendResponse(res, { message: "Account created successfully", data: registeredProfile }, 201);
    } catch (error) {
        sendResponse(res, { message: "Internal server fault", error: true }, 500);
    }
};





export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        const identityMatch = await authService.findUserByEmail(email);

        if (!identityMatch) {
            sendResponse(res, { message: "Bad request for login inputs" }, 401);
            return;
        }

        const validPass = await bcrypt.compare(password, identityMatch.password);
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
        sendResponse(res, { message: "Internal server fault", error: true }, 500);
    }
};