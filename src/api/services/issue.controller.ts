import type { Request, Response } from "express";
import issueService from "../services/issue.service";
import { sendResponse } from "../../utils/sendResponse";

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

export const getSingleIssue = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        const issue = await issueService.getIssueById(id);

        if (!issue) {
            sendResponse(res, { message: "Issue registry not found" }, 404);
            return;
        }

        const users = await issueService.fetchUsersBatch([issue.reporter_id]);
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

export const getAllIssues = async (req: Request, res: Response): Promise<void> => {
    try {
        const { sort, type, status } = req.query;
        const issuesList = await issueService.scanAllIssues({
            sort: sort as string,
            type: type as string,
            status: status as string
        });

        const distinctReporterIds = issuesList.map((item: any) => item.reporter_id);
        const collectiveUsers = await issueService.resolveUsersInBatch(distinctReporterIds);

        // O(1) searching hasj
        const internalUserMap: any = {};
        collectiveUsers.forEach((individual: any) => { internalUserMap[individual.id] = individual; });

        // Data stiching in application lavel
        const finalizedResultCollection = issuesList.map((issueElement: any) => {
            const { reporter_id, ...baseData } = issueElement;
            return {
                ...baseData,
                reporter: internalUserMap[reporter_id] || null
            };
        });

        sendResponse(res, { message: "Filtered issue logs assembled", data: finalizedResultCollection });
    } catch (error) {
        sendResponse(res, { message: "Internal server fault", error: true }, 500);
    }
};