import { pool } from "../../db";

class IssueService {
    async createIssue(title: string, description: string, type: string, reporterId: number) {
        const query = `
            INSERT INTO issues (title, description, type, reporter_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const result = await pool.query(query, [title, description, type, reporterId]);
        return result.rows[0];
    }

    async getIssueById(id: number) {
        const result = await pool.query(`SELECT * FROM issues WHERE id = $1;`, [id]);
        return result.rows[0] || null;
    }

    async fetchUsersBatch(ids: number[]) {
        if (ids.length === 0) return [];
        const uniqueIds = [...new Set(ids)];
        const placeholders = uniqueIds.map((_, i) => `$${i + 1}`).join(",");

        const query = `SELECT id, name, role FROM users WHERE id IN (${placeholders});`;
        const result = await pool.query(query, uniqueIds);
        return result.rows;
    }
    //design scalable linear data scanning for raw issue metrics
    async scanAllIssues(filters: { sort?: string; type?: string; status?: string }): Promise<any[]> {
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

        const queryResult = await pool.query(sqlStatement, parameters);
        return queryResult.rows;
    }
//design flexible database mutation engines for patch requests

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

    async removeIssue(id: number): Promise<boolean> {
        const status = await pool.query(`DELETE FROM issues WHERE id = $1;`, [id]);
        return (status.rowCount ?? 0) > 0;
    }

}



export default new IssueService();

