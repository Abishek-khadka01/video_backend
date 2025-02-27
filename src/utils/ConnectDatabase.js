import mongoose from "mongoose"

const ConnectToDatabase =async  ()=>{

    try {
        await mongoose.connect(process.env.MONGO_DB_URL, {
            dbName :"testz"
        })
        console.log(`Connected to the database`);
        
    } catch (error) {
        console.log(error.message)
        process.exit(1)
    }


}

export {ConnectToDatabase}

