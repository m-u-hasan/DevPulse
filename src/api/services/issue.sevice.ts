import { pool } from "../../db";

class IssueService {
    async logNewIssue(title: string, description: string, type: string, reporterId: number) {
        const sql = `
            INSERT INTO issues (title, description, type, reporter_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const result = await pool.query(sql, [title, description, type, reporterId]);
        return result.rows[0];
    }

    async fetchIssueById(id: number) {
        const result = await pool.query(`SELECT * FROM issues WHERE id = $1;`, [id]);
        return result.rows[0] || null;
    }


    async resolveUsersInBatch(ids: number[]) {
        if (ids.length === 0) return [];
        const filteredIds = [...new Set(ids)]; 
        const inlineParameters = filteredIds.map((_, index) => `$${index + 1}`).join(",");

        const sql = `SELECT id, name, role FROM users WHERE id IN (${inlineParameters});`;
        const result = await pool.query(sql, filteredIds);
        return result.rows;
    }
}
export default new IssueService();