export const ErrorMiddleware = (err, req, res, next) => { 

    if(err){
        console.log(err)
        res.status(500).json({message: err.message})
    }
    


}