import { createServer } from "http";
import { Server, Socket } from "socket.io";
import express from "express"
import dotenv from "dotenv"
import logger from "./utils/Logger.js";
import { ConnectToDatabase } from "./utils/ConnectDatabase.js";
dotenv.config()
const app = express()
const httpServer = createServer(app);

import {cookieParser} from "cookie-parser"

app.use(cookieParser())




const io = new Server(httpServer, {
  cors:{
    origin:"*"
  }
});

io.on("connection", (socket) => {
  // ...
});


 await ConnectToDatabase();

const PORT = process.env.PORT || 4000
httpServer.listen(PORT , ()=>{
    logger.info(`The app is listening at port ${PORT}`)
});