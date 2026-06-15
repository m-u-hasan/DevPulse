import app from "./app";
import config from "./config";
import { initDB } from "./db";

const initServer = async () => {
    await initDB();
    app.listen(config.port, () => {
        console.log(`Server executing smoothly on ${config.port}`);
    });
};

initServer();