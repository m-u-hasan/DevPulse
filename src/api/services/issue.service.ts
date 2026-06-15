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


}



export default new IssueService();

