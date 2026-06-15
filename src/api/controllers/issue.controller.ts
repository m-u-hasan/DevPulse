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
        const sortParam = req.query.sort as string | undefined;
        const typeParam = req.query.type as string | undefined;
        const statusParam = req.query.status as string | undefined;

        const issuesList = await issueService.scanAllIssues({
            sort: sortParam,
            type: typeParam,
            status: statusParam
        });

        const distinctReporterIds = issuesList.map((item: any) => item.reporter_id);
        const collectiveUsers = await issueService.resolveUsersInBatch(distinctReporterIds);

        const internalUserMap: any = {};
        collectiveUsers.forEach((individual: any) => { internalUserMap[individual.id] = individual; });

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



//introduce secure multi-tier permission checking on mutating operations
export const updateIssue = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        const operator = req.user!;

        const existingRecord = await issueService.fetchIssueById(id);
        if (!existingRecord) {
            sendResponse(res, { message: "Requested reference log empty" }, 404);
            return;
        }

        //Requirment check: User contributer as if not maintainer
        if (operator.role !== "maintainer") {
            //Cant change another users issues
            if (existingRecord.reporter_id !== operator.id) {
                sendResponse(res, { message: "Forbidden: Data ownership violation" }, 403);
                return;
            }
            //Check issue open 
            if (existingRecord.status !== "open") {
                sendResponse(res, { message: "Conflict: Log locked from non-maintainer update" }, 409);
                return;
            }
            //
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

export const deleteIssue = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        const logExists = await issueService.fetchIssueById(id);

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