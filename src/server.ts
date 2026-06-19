import app from "./app";
import config from "./config";
import { initDB } from "./db";

initDB()
    .then(() => {
        console.log("Database initialized successfully.");
    })
    .catch((err) => {
        console.error("Database initialization failed:", err);
    });

if (config.node_env !== "production") {
    app.listen(config.port, () => {
        console.log(`Server executing smoothly on ${config.port}`);
    });
}

export default app;