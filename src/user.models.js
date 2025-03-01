import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()
const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    profile: {
        type: String,
        default:"https://imgs.search.brave.com/Hf4meI54w1WzlXbOlp_oN9prJv28W-VgzNK8k--Eb7U/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90NC5m/dGNkbi5uZXQvanBn/LzA5LzcwLzk4LzQ1/LzM2MF9GXzk3MDk4/NDU5Ml9SUkdndHo3/MXNzN3VYc0NPbEMy/MWZ4WENZNGo4ckdM/TC5qcGc"
    },


} , {
    timestamps: true
})


userSchema.pre("save", async function(next){
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password, 12)
    }
    next()
})


userSchema.methods.generateAccessToken =  function(){
    try {
        
        let token = jwt.sign({_id: this._id}, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY 
        })
        
        
        return token
    } catch (error) {
        console.log(error)
        throw error;
    }
}


userSchema.methods.generateRefreshToken =  function(){
    try {

        let token = jwt.sign({_id: this._id}, process.env.REFRESH_TOKEN_SECRET, {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        })
        
        
        return token
    } catch (error) {
        console.log(error)
        throw error;
    }
}


userSchema.methods.checkPassword = async function(password){
    try {
        console.log(`Checking password ${password} for ${this.password}`)   
        return await bcrypt.compare(password, this.password)
    } catch (error) {
        console.log(error)
        throw error;
    }
}


export const User = mongoose.model("User", userSchema)