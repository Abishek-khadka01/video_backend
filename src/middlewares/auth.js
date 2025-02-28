import logger from "../utils/logger.js"
import jwt from "jsonwebtoken"
import { options } from "../user.controller.js";
const AuthMiddleware = async (req,res,next)=>{

    try {
        const {accessToken , refreshToken} = req.cookies;
        if(!accessToken && !refreshToken){
            logger.warn(`User is not logged in`);
            return res.status(400).json({
                success : false,
                message: "User is not logged in"});
        }

        if(!accessToken){
            
            const {accessToken, userId} = await RecreateTokensfromRefreshToken(refreshToken);
            req.user = userId;
            res.cookie("accessToken",accessToken,{
                ...options,
                maxAge : 1000 * 60 * 15
            });

            next();
        }else{

            const tokens = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
            if(!tokens){
                logger.error(`Error in Auth Middleware`);
                throw new Error("Invalid Access Token")
            }

            req.user = tokens._id;
            next();

        }




    } catch (error) {
        logger.error(`Error in Auth Middleware ${error.message}`);
        next(error)
    }



}


const RecreateTokensfromRefreshToken = async (refreshToken )=>{

        try {
            
            const tokens =  jwt.verify(refreshToken , process.env.REFRESH_TOKEN_SECRET);
            if(!tokens){
                logger.error(`Error in Recreating Tokens from Refresh Token`);
                throw new Error("Invalid Refresh Token")
            }

            const {_id} = tokens;
            const findUser = await User.findbyId(_id);
            if(!findUser){
                logger.error(`Error in Recreating Tokens from Refresh Token`);
                throw new Error("User Not Found")
            }

                const accessToken =  findUser.generateAccessToken();

            return {
                accessToken,
                userId : findUser._id
            }
            


        } catch (error) {
            logger.error(`Error in Recreating Tokens from Refresh Token ${error.message}`);
            throw new Error(error.message)  
        }




}