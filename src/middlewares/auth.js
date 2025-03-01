import logger from "../utils/logger.js";
import jwt from "jsonwebtoken";
import { options } from "../user.controller.js";
import { User } from "../user.models.js";

export const AuthMiddleware = async (req, res, next) => {
  try {
    logger.info(`Auth Middleware is called`);

    const { accessToken, refreshToken } = req.cookies;

    if (!accessToken && !refreshToken) {
      logger.warn(`User is not logged in`);
      return res.status(401).json({
        success: false,
        message: "User is not logged in",
      });
    }

    if (!accessToken) {
      // Refresh token exists, recreate the access token
      const { accessToken: newAccessToken, userId } =
        await RecreateTokensfromRefreshToken(refreshToken);
      req.user = userId;
      res.cookie("accessToken", newAccessToken, {
        ...options,
        maxAge: 1000 * 60 * 15, // Set maxAge to 15 minutes
      });
      logger.info(`Passed through the Auth Middleware`);
      return next();
    } else {
      // Access token is present, verify it
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      req.user = decoded._id; // Attach the user ID to the request
      logger.info(`Passed throiugh the Auth Middleware`);
      return next();
    }
  } catch (error) {
    logger.error(`Error in Auth Middleware: ${error.message}`);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Access token has expired",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const RecreateTokensfromRefreshToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    if (!decoded) {
      logger.error(`Invalid Refresh Token`);
      throw new Error("Invalid Refresh Token");
    }

    const { _id } = decoded;
    const findUser = await User.findById(_id);

    if (!findUser) {
      logger.error(`User not found during token recreation`);
      throw new Error("User Not Found");
    }

    const accessToken = findUser.generateAccessToken();
    return {
      accessToken,
      userId: findUser._id,
    };
  } catch (error) {
    logger.error(
      `Error in Recreating Tokens from Refresh Token: ${error.message}`
    );
    throw new Error(error.message);
  }
};
