import {v2 as cloudinary} from 'cloudinary';
import logger from './logger.js';
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});



 export const uploadProfile = async (filepath)=>{
    try {
            const result =  await cloudinary.uploader.upload(filepath, {
                folder: 'profile'
            })

            return result.secure_url



    } catch (error) {
        logger.error(`Error uploading profile image: ${error.message}`)
        throw new Error(`Error uploading profile image: ${error.message}`)
    }

    

}

