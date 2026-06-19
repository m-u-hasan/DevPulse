import app from "./app";
import config from "./config";
import { initDB } from "./db";

// Initialize DB tables asynchronously
initDB()
    .then(() => {
        console.log("Database initialized successfully.");
    })
    .catch((err) => {
        console.error("Database initialization failed:", err);
    });

// Only run listen in local development mode
if (config.node_env !== "production") {
    app.listen(config.port, () => {
        console.log(`Server executing smoothly on port ${config.port}`);
    });
}

// CRITICAL FOR VERCEL: Export the app object as default handler
export default app;