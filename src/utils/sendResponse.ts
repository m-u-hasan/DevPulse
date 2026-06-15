import type { Response } from "express";

export function sendResponse<T>(
    res: Response,
    { message, data, error }: { message: string; data?: T; error?: boolean },
    status = 200,
): void {
    res.status(status).json({
        success: !error,
        message,
        data: error ? undefined : data,
    });
}