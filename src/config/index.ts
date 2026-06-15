import dotenv from "dotenv";
import { env } from "process";

dotenv.config();

const config = {
    port: (env.PORT || 5000) as string | number,
    database_url: env.DATABASE_URL as string,
    node_env: env.NODE_ENV || "development",
    jwt_secret: env.JWT_SECRET as string,
};

export default config;