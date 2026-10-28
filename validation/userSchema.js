const Joi = require("joi");

const userSchema = Joi.object({
    email: Joi.string().trim().lowercase().email().required(),
    name: Joi.string().trim().min(3).max(30).required(),
    password: Joi.string()
        .trim()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/)
        .required()
        .messages({
            "string.pattern.base":
                "password must be at least 8 character long and include upper and lower case letters, a number, and a special character.",
        }),
});

module.exports = { userSchema };