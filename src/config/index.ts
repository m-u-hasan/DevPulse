import dotenv from "dotenv";

dotenv.config();

const config = {
    port: (process.env.PORT || 5000) as string | number,
    database_url: process.env.DATABASE_URL as string,
    node_env: process.env.NODE_ENV || "development",
    jwt_secret: process.env.JWT_SECRET as string,
};

export default config;