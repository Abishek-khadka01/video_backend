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
io.use(async (socket, next) => {
  const { id } = socket.handshake.query;
  console.log(id);
  //check if the user is authenticated
  const findUser = await User.findById(id);
  if (!id || !findUser) {
    logger.warn(`Not authenticated user is trying to connect with socket id`);
    return next(new Error("Not authenticated"));
  }
  logger.info(
    `User with id ${id} is connected to the socket, ${findUser.name}`
  );
  socket.id = id;
  next();
});

io.on("connection", async (socket) => {
  const { id } = socket;
  MapIdAndSocket.set(id, socket.id);
  MapSocketAndId.set(socket.id, id);

  const onlineUsers = await redis.lrange("onlineUsers", 0, -1);
  if (!onlineUsers.includes(id)) {
    await redis.lpush("onlineUsers", id);
    logger.info(`User with id ${id} is added to the online users list`);
  } else {
    console.log("User is already exists.");
  }

  logger.info(`User with id ${id} is connected to the socket`);

  socket.on("hello", (data) => {
    console.log(data);
    io.emit("hello", { message: "hello from server}" });
  });

  socket.on("disconnect", () => {
    logger.info(`User with id ${id} is disconnected to the socket`);
    MapIdAndSocket.delete(id);
    MapSocketAndId.delete(socket.id);
    redis.lrem("onlineUsers", 0, id);
  });
});

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
