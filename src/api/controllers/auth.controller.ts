import type { Request, Response } from "express";
import authService from "../services/auth.service";
import { sendResponse } from "../../utils/sendResponse";

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