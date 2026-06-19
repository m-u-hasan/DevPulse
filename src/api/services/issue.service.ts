import { pool } from "../../db";

class IssueService {

    // 1. Save a new issue to the database
    async createIssue(title: string, description: string, type: string, reporterId: number) {
        const query = `
            INSERT INTO issues (title, description, type, reporter_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const result = await pool.query(query, [title, description, type, reporterId]);
        return result.rows[0];
    }

    // 2. Find a specific issue by its ID
    async getIssueById(id: number) {
        const result = await pool.query(`SELECT * FROM issues WHERE id = $1;`, [id]);
        return result.rows[0] || null;
    }

    // 3. Fetch multiple users from the database in one single batch
    async fetchUsersBatch(ids: number[]) {
        if (ids.length === 0) return [];
        const uniqueIds = [...new Set(ids)]; // Remove duplicate IDs
        const placeholders = uniqueIds.map((_, i) => `$${i + 1}`).join(",");

        const query = `SELECT id, name, role FROM users WHERE id IN (${placeholders});`;
        const result = await pool.query(query, uniqueIds);
        return result.rows;
    }

    // 4. Get all issues and stitch user data at the application level
    async scanAllIssues(filters: { sort?: string; type?: string; status?: string }): Promise<any[]> {
        // Build SQL query dynamically based on active filters
        let sqlStatement = `SELECT * FROM issues WHERE 1=1`;
        const parameters: string[] = [];
        let indexOffset = 1;

        if (filters.type) {
            sqlStatement += ` AND type = $${indexOffset}`;
            parameters.push(filters.type);
            indexOffset++;
        }
        if (filters.status) {
            sqlStatement += ` AND status = $${indexOffset}`;
            parameters.push(filters.status);
            indexOffset++;
        }

        const sortSequence = filters.sort === "oldest" ? "ASC" : "DESC";
        sqlStatement += ` ORDER BY created_at ${sortSequence};`;

        // Step A: Fetch raw issues from the database
        const queryResult = await pool.query(sqlStatement, parameters);
        const rawIssues = queryResult.rows;

        if (rawIssues.length === 0) return [];

        // Step B: Collect all reporter IDs from the fetched issues
        const reporterIds = rawIssues.map(issue => issue.reporter_id);

        // Step C: Fetch user profiles for all collected IDs in a single batch
        const users = await this.fetchUsersBatch(reporterIds);

        // Step D: Create a fast in-memory Hash Map for O(1) user lookups
        const userMap = new Map<number, any>();
        users.forEach(user => userMap.set(user.id, user));

        // Step E: Core Data Stitching Layer with defensive null safety
        const stitchedIssues = rawIssues.map((issue) => {
            const reporter = userMap.get(issue.reporter_id);

            // Guardrail: Fallback object if a user profile is missing or deleted
            const reporterData = reporter ? {
                id: reporter.id,
                name: reporter.name,
                role: reporter.role
            } : {
                id: issue.reporter_id,
                name: "Unknown / Disassociated User",
                role: "N/A"
            };

            // Omit raw reporter_id field and inject the structural reporter object
            const { reporter_id, ...issueData } = issue;

            return {
                ...issueData,
                reporter: reporterData
            };
        });

        return stitchedIssues;
    }

    // 5. Update dynamic issue fields using dynamic SQL token assignment
    async saveIssueUpdates(id: number, activeFields: any): Promise<any> {
        const syntaxTokens: string[] = [];
        const argumentValues: any[] = [];
        let variableCounter = 1;

        Object.entries(activeFields).forEach(([property, value]) => {
            if (value !== undefined) {
                syntaxTokens.push(`${property} = $${variableCounter}`);
                argumentValues.push(value);
                variableCounter++;
            }
        });

        if (syntaxTokens.length === 0) return null;
        argumentValues.push(id);

        const sql = `UPDATE issues SET ${syntaxTokens.join(", ")}, updated_at = NOW() WHERE id = $${variableCounter} RETURNING *;`;
        const actionResult = await pool.query(sql, argumentValues);
        return actionResult.rows[0] || null;
    }

    // 6. Delete a specific issue from the database completely
    async removeIssue(id: number): Promise<boolean> {
        const status = await pool.query(`DELETE FROM issues WHERE id = $1;`, [id]);
        return (status.rowCount ?? 0) > 0;
    }
}

export default new IssueService();