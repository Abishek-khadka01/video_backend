import { Router } from "express";
import {
  UserRegister,
  UserLogin,
  UserDetails,
  UserLogOut,
  onlineUsersSocket,
} from "./user.controller.js";
import { AuthMiddleware } from "./middlewares/auth.js";
import { AddProfile } from "./user.controller.js";
import { Upload } from "./middlewares/multer.js";
import { User } from "./user.models.js";

const UserRouter = Router();

UserRouter.post("/register", UserRegister);
UserRouter.post("/login", UserLogin);
UserRouter.use(AuthMiddleware);
UserRouter.post("/logout", UserLogOut);
UserRouter.get("/details/:id", UserDetails);
UserRouter.post("/addProfile", Upload.single("profile"), AddProfile);
UserRouter.get("/onlineUsers", onlineUsersSocket);

export { UserRouter };
