import { body } from "express-validator";
import handleValidationError from "./handleValidationErrors.js";

export const userValidator = [
    body("name")
        .notEmpty()
        .withMessage("name is required")
        .isLength({ min: 3, max: 30 })
        .withMessage("name must be between 3 and 30 characters long"),
    body("email")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email format"),
    body("password")
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),
    /* body("role").optional().isIn(['user', 'admin']).withMessage("Role must be either 'user' or 'admin'"), */
    handleValidationError
];
