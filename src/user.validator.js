import joi from "joi";

const UserRegisterValidator = joi.object({
  username: joi
    .string()
    .required()
    .alphanum()
    .min(3)      
    .max(20)     
    .pattern(/^[a-zA-Z0-9]+$/)
  ,
  email: joi
    .string()
    .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
    .required()
    ,
  password: joi
    .string()
    .required()
    .min(6)
    .max(20)
  ,
});

const UserLoginValidator = joi.object({
  email: joi
    .string()
    .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
    .required()
  ,
  password: joi
    .string()
    .required()
    .min(6)
    .max(20)
    
});

export { UserLoginValidator, UserRegisterValidator };