import type { Request, Response } from "express";
import issueService from "../services/issue.service";
import { sendResponse } from "../../utils/sendResponse";

// 1. Create a new issue
export const createIssue = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, description, type } = req.body;
        const reporterId = req.user!.id;

        const issue = await issueService.createIssue(title, description, type, reporterId);
        sendResponse(res, { message: "Issue logged successfully", data: issue }, 201);
    } catch (error) {
        sendResponse(res, { message: "Internal server error", error: true }, 500);
    }
};

// 2. Get a single issue by ID
export const getSingleIssue = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        const issue = await issueService.getIssueById(id);

        if (!issue) {
            sendResponse(res, { message: "Issue registry not found" }, 404);
            return;
        }

        const reporterId = issue.reporter_id as number;
        const users = await issueService.fetchUsersBatch([reporterId]);
        const { reporter_id, ...issueData } = issue;

        const payload = {
            ...issueData,
            reporter: users[0] || null
        };

        sendResponse(res, { message: "Issue data compiled successfully", data: payload });
    } catch (error) {
        sendResponse(res, { message: "Internal server error", error: true }, 500);
    }
};

// 3. Get all issues
// 3. Get all issues
export const getAllIssues = async (req: Request, res: Response): Promise<any> => {
    try {
        const sortParam = typeof req.query.sort === "string" ? req.query.sort : undefined;
        const typeParam = typeof req.query.type === "string" ? req.query.type : undefined;
        const statusParam = typeof req.query.status === "string" ? req.query.status : undefined;

        const finalizedResultCollection = await issueService.scanAllIssues({
            sort: sortParam,
            type: typeParam,
            status: statusParam
        });

        sendResponse(res, { message: "Filtered issue logs", data: finalizedResultCollection });
    } catch (error: any) {
        console.error("Error in getAllIssues:", error);


        sendResponse(res, {
            message: error?.message || "Internal server fault",
            error: true,
            data: {
                message: error?.message,
                stack: error?.stack,
                details: error
            }
        }, 500);
    }
};

// 4. Update an issue
export const updateIssue = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        const operator = req.user!;

        const existingRecord = await issueService.getIssueById(id);
        if (!existingRecord) {
            sendResponse(res, { message: "Requested reference log empty" }, 404);
            return;
        }

        if (operator.role !== "maintainer") {
            if (existingRecord.reporter_id !== operator.id) {
                sendResponse(res, { message: "Forbidden: Data ownership violation" }, 403);
                return;
            }
            if (existingRecord.status !== "open") {
                sendResponse(res, { message: "Conflict: Log locked from non-maintainer update" }, 409);
                return;
            }
            if (req.body.status && req.body.status !== existingRecord.status) {
                sendResponse(res, { message: "Forbidden: Workflow status can only be managed by maintainers" }, 403);
                return;
            }
        }

        const freshlyUpdatedRecord = await issueService.saveIssueUpdates(id, req.body);
        sendResponse(res, { message: "Issue details updated successfully", data: freshlyUpdatedRecord });
    } catch (error) {
        sendResponse(res, { message: "Internal server fault", error: true }, 500);
    }
};

// 5. Delete an issue
export const deleteIssue = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        const logExists = await issueService.getIssueById(id);

        if (!logExists) {
            sendResponse(res, { message: "Requested reference log empty" }, 404);
            return;
        }

        await issueService.removeIssue(id);
        sendResponse(res, { message: "Target row permanently erased" });
    } catch (error) {
        sendResponse(res, { message: "Internal server fault", error: true }, 500);
    }
};