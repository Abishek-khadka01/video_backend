import winston from 'winston';


const logFormat = winston.format.printf(({ timestamp, level, message }) => {
  return `${timestamp} [${level}]: ${message}`;
});


const logger = winston.createLogger({
  level: 'info',  
  format: winston.format.combine(
    winston.format.timestamp(),   
    winston.format.prettyPrint(),
    logFormat                    
  ),
  transports: [
   
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), 
        winston.format.simple()    
      )
    }),
    
    new winston.transports.File({
      filename: 'logs/error.log', 
      level: 'error',             
    })
  ]
});


export default logger;