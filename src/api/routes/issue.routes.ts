import { Router } from "express";

import { createIssue, deleteIssue, getAllIssues, getSingleIssue, updateIssue } from "../controllers/issue.controller";
import { authGuard } from "../../middleware/auth.middleware";

const router = Router();

//Create new issues, login, contribute or maintainer 
router.post("/", authGuard(["contributor", "maintainer"]), createIssue);

//Get all or single issue
router.get("/", getAllIssues);
router.get("/:id", getSingleIssue);

//As contributor or maintainer update 
router.patch("/:id", authGuard(["contributor", "maintainer"]), updateIssue);

// Delete for only maintainer
router.delete("/:id", authGuard(["maintainer"]), deleteIssue);

export default router;