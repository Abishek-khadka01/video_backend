import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";
import dotenv from "dotenv";
import logger from "./utils/logger.js";
import { ConnectToDatabase } from "./utils/ConnectDatabase.js";
import { ErrorMiddleware } from "./middlewares/ErrorMiddleware.js";
import cors from "cors";
import { User } from "./user.models.js";
import Redis from "ioredis";

dotenv.config();
const app = express();
const httpServer = createServer(app);

import cookieParser from "cookie-parser";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const redis = new Redis({
  host: "127.0.0.1",
  port: 6380,
});

redis.on("connect", () => {
  logger.info(`Redis is connected`);
});
redis.on("error", (error) => {
  logger.error(`Error in Redis ${error.message}`);
});

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
const MapIdAndSocket = new Map();
const MapSocketAndId = new Map();

const io = new Server(httpServer, {
  cors: true,
});

// Adding the io middleware to the app

await ConnectToDatabase();

// import all the routes

import { UserRouter } from "./user.routes.js";

app.use("/user", UserRouter);

app.use(ErrorMiddleware);
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  logger.info(`The app is listening at port ${PORT}`);
});

export { io, MapIdAndSocket, MapSocketAndId, redis };
