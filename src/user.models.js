import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
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
    }


} , {
    timestamps: true
})


userSchema.pre("save", async function(next){
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password, 12)
    }
    next()
})


userSchema.methods.generateAccessToken = async function(){
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


userSchema.methods.generateRefreshToken = async function(){
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
        return await bcrypt.compare(password, this.password)
    } catch (error) {
        console.log(error)
        throw error;
    }
}


export const User = mongoose.model("User", userSchema)