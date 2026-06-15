export type UserRole = "contributor" | "maintainer";
export type IssueType = "bug" | "feature";
export type IssueStatus = "open" | "in_progress" | "resolved";

export interface JwtPayload {
    id: number;
    name: string;
    role: UserRole;
}