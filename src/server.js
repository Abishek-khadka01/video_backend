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
  const { userID } = socket.handshake.auth;
  console.log(userID);
  //check if the user is authenticated
  const findUser = await User.findById(userID);
  if (!userID || !findUser) {
    logger.warn(`Not authenticated user is trying to connect with socket id`);
    return next(new Error("Not authenticated"));
  }
  logger.info(
    `User with id ${userID} is connected to the socket, ${findUser.name}`
  );
  socket.userID = userID;
  next();
});

io.on("connection", async (socket) => {
  const { userID } = socket;
  logger.warn(userID, socket.id);
  MapIdAndSocket.set(userID, socket.id);
  MapSocketAndId.set(socket.id, userID);

  const onlineUsers = await redis.lrange("onlineUsers", 0, -1);
  if (!onlineUsers.includes(userID)) {
    await redis.lpush("onlineUsers", userID);
    logger.info(`User with id ${userID} is added to the online users list`);
  } else {
    console.log("User is already exists.");
  }

  logger.info(`User with id ${userID} is connected to the socket`);

  socket.on("initialize-call", ({ to, offer, successUrl }) => {
    console.log(`initialize call is called`);
    logger.error(`the to is ${to}`);
    const socketId = MapIdAndSocket.get(to);
    const getUserId = MapSocketAndId.get(socket.id);
    logger.warn(
      ` The socket id is ${socket.id} and the getUser id is ${getUserId} `
    );

    console.log(offer);
    socket.to(socketId).emit("incoming-callrequest", {
      from: getUserId,
      offer,
      successUrl,
    });
  });

  socket.on("answer-call", async ({ from, to, answer }) => {
    const findUser1 = await User.findById(from); // the receiver id
    const findUser2 = await User.findById(to); // call initiator id
    logger.error(
      `The call is answered by ${findUser1.name}  and the call initiator is ${findUser2.name}`
    );

    
    const fromSocketId = MapIdAndSocket.get(from);
    console.log(`The result is ${fromSocketId}`);
    logger.error(
      `the userid of from is ${fromSocketId} and socketID is ${fromSocketId}`
    );

    const toSocketId = MapIdAndSocket.get(to);
    logger.error(`The receiver id is ${to} and the socketId is ${toSocketId}`);

    socket.to(toSocketId).emit("hello-accept-call", {
      from,
      answer,
    });
  });

  socket.on("reject-call", ({ from, to }) => {
    const toSocketId = MapIdAndSocket.get(to);
    socket.to(toSocketId).emit("rejection", {
      message: "Call ended ",
    });
  });

  socket.on("ended-call", ({ from, to, message }) => {
    console.log(`The userid received for end call is ${to}`);
    console.log(`End call was triggered`);
    const toSocketId = MapIdAndSocket.get(to);
    console.log(`The socketID of that user is ${toSocketId}`);
    console.log(message);
    socket.to(toSocketId).emit("end-call-success", {
      from,
      message,
    });
  });
  socket.on("disconnect", () => {
    logger.info(`User with id ${userID} is disconnected to the socket`);
    MapIdAndSocket.delete(userID);
    MapSocketAndId.delete(socket.id);
    redis.lrem("onlineUsers", 0, userID);
  });
});
await ConnectToDatabase();

// import all the routes

import { UserRouter } from "./user.routes.js";
import { UserRegisterValidator } from "./user.validator.js";

app.use("/user", UserRouter);

app.use(ErrorMiddleware);
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  logger.info(`The app is listening at port ${PORT}`);
});

export { io, MapIdAndSocket, MapSocketAndId, redis };
