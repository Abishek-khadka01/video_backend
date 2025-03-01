import { User } from "./user.models.js";
import logger from "./utils/logger.js";
import { UserRegisterValidator, UserLoginValidator } from "./user.validator.js";
import fs from "fs";
import { uploadProfile } from "./utils/cloudinary.js";
import { redis, MapIdAndSocket, MapSocketAndId } from "./server.js";

export const options = {
  httpOnly: false,
  maxAge: 1000 * 60 * 60 * 24 * 7,
  secure: true,
  path: "/",
  domain: "localhost",
};

const UserRegister = async (req, res) => {
  try {
    logger.info(`The User Register API is called with ${req.body}`);
    const validate = UserRegisterValidator.validate(
      JSON.parse(JSON.stringify(req.body))
    );
    if (validate.error) {
      logger.warn(`Error in the validation ${validate.error.message}`);
      return res.status(400).json({
        success: false,
        message: validate.error.message,
      });
    }
    logger.info(`The validation is passed`);
    const { username, email, password } = req.body;
    // check if the user already exists in the database
    const userfind = await User.findOne({
      email: req.body.email,
    });
    if (userfind) {
      logger.warn(`User already exists with email ${email}`);
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const user = await User.create({
      name: username,
      email,
      password,
    });

    logger.info(`The user is created ${user}`);
    return res.status(200).json({
      success: true,
      message: "User created successfully",
    });
  } catch (error) {
    logger.error(`Error in User Register API ${error.message}`);
    return res.status(500).json({
      success: false,
      message: `Internal Server Error 
            ERROR = ${error.message}`,
    });
  }
};

const UserLogin = async (req, res) => {
  try {
    const validate = UserLoginValidator.validate(req.body);
    if (validate.error) {
      logger.warn(`Error in the validation ${validate.error.message}`);
      return res.status(400).json({
        success: false,
        message: validate.error.message,
      });
    }

    const { email, password } = req.body;

    logger.info(`The User Login API is called with ${req.body}`);
    // find User
    const findUser = await User.findOne({
      email,
    });

    if (!findUser) {
      logger.warn(`User not found with email ${email}`);
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    // check if the password is correct
    const isPasswordCorrect = await findUser.checkPassword(password);
    if (!isPasswordCorrect) {
      logger.warn(`Password is incorrect for email ${email}`);
      return res.status(400).json({
        success: false,
        message: "Password is incorrect",
      });
    }

    const refreshToken = findUser.generateRefreshToken();
    const accessToken = findUser.generateAccessToken();
    logger.info(
      `Access Token : ${accessToken} and Refresh Token : ${refreshToken}`
    );

    res
      .cookie("refreshToken", refreshToken, options)
      .cookie("accessToken", accessToken, {
        ...options,
        maxAge: 1000 * 60 * 15,
      }); // 15 minutes
    logger.info(`Cookies are set and the user is logged in `);
    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: {
        accessToken,
        refreshToken,
      },
      user: {
        _id: findUser._id,
        username: findUser.name,
        email: findUser.email,
        profile: findUser.profile,
      },
    });
  } catch (error) {
    logger.error(`Error in User Login API ${error.message}`);
    return res.status(500).json({
      success: false,
      message: `Internal Server Error 
            ERROR = ${error.message}`,
    });
  }
};

const UserLogOut = async (req, res) => {
  try {
    // the user is from the auth Middleware
    const { user } = req;
    const findUser = await User.findById(user);
    if (!user || !findUser) {
      logger.warn(`User is not logged in`);
      return res.status(400).json({
        success: false,
        message: "User is not logged in",
      });
    }

    res.clearCookie("refreshToken").clearCookie("accessToken");

    req.user = null;
    return res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    logger.error(`Error in logging out the user `);
    return res.status(500).json({
      success: false,
      message: `Internal Server Error 
            ERROR = ${error.message}`,
    });
  }
};

const UserDetails = async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;

    if (!id) {
      logger.warn(`User id is not provided`);
      return res.status(400).json({
        success: false,
        message: "User id is not provided",
      });
    }

    const findUser = await User.findById(user);
    if (!user || !findUser) {
      logger.warn(`User is not logged in`);
      return res.status(400).json({
        success: false,
        message: "Log in to search for the user",
      });
    }

    const userDetails = await User.findById(id);
    if (!userDetails) {
      logger.warn(`User not found with id ${id}`);
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    logger.info(`User details are ${userDetails}`);
    return res.status(200).json({
      success: true,
      message: "User details found",
      data: {
        username: userDetails.username,
        email: userDetails.email,
      },
    });
  } catch (error) {
    logger.error(`Error in getting the user details `);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const AddProfile = async (req, res) => {
  try {
    const { user } = req;
    const { file } = req;

    const findUser = await User.findById(user);
    if (!findUser) {
      logger.warn(`No user found , login again`);
      return res.status(400).json({
        success: false,
        message: "No user found , login again",
      });
    }

    const Cloudinary_Url = await uploadProfile(file.path);
    const userUpdate = await User.findOneAndUpdate(
      {
        _id: user,
      },
      {
        profile: Cloudinary_Url,
      },
      { new: true }
    );

    fs.unlinkSync(file.path);
    return res.status(200).json({
      success: true,
      message: "Profile added successfully",
      data: {
        user: userUpdate,
      },
    });
  } catch (error) {
    logger.error(`Error in adding the profile ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const onlineUsersSocket = async (req, res) => {
  try {
    logger.info(`The online users API is called`);

    const { user } = req;
    const findUser = await User.findById(user);
    if (!findUser) {
      logger.warn(`User is not logged in`);
      return res.status(400).json({
        success: false,
        message: "User is not logged in",
      });
    }

    const onlineUsers = await redis.lrange("onlineUsers", 0, -1);
    logger.info(`The online users are ${onlineUsers}`);

    if (onlineUsers.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No users are online",
        data: {
          onlineUsers: [],
        },
      });
    }

    const FilterUsers = onlineUsers.filter((id) => id !== user);
    logger.info(`The filtered users are ${FilterUsers}`);

    const onlineUsersDetails = await User.find({
      _id: {
        $in: FilterUsers,
      },
    }).select("name email profile");

    logger.info(`The online users details are ${onlineUsersDetails}`);

    return res.status(200).json({
      success: true,
      message: "Online Users",
      data: {
        onlineUsers: onlineUsersDetails,
      },
    });
  } catch (error) {
    logger.error(`Error in giving the online users: ${error.message} `);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  UserRegister,
  UserLogin,
  UserLogOut,
  UserDetails,
  AddProfile,
  onlineUsersSocket,
};
