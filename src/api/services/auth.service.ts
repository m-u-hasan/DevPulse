import { pool } from "../../db";
import type { UserRole } from "../../types";
import bcrypt from "bcrypt";

class AuthService {
    async registerUser(name: string, email: string, pass: string, role?: UserRole) {
        const saltRound = 10;
        const hash = await bcrypt.hash(pass, saltRound);
        const userRole = role || "contributor";

        const sql = `
            INSERT INTO users (name, email, password, role)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, email, role, created_at, updated_at;
        `;
        const result = await pool.query(sql, [name, email, hash, userRole]);
        return result.rows[0] || null;
    }

    async findUserByEmail(email: string) {
        const result = await pool.query(`SELECT * FROM users WHERE email = $1;`, [email]);
        return result.rows[0] || null;
    }
}
export default new AuthService();