import database from "../config/database.js";
import bcrypt from 'bcrypt';
import handleValidationError from "./handleValidationErrors.js";
import { body } from "express-validator";
import jwt from 'jsonwebtoken';


export async function checkEMailNotTaken(req, res, next) {
    const { email } = req.body;
    try {
        const [users] = await database.query("SELECT email FROM users WHERE email = ?", [email]);
        if (users.length > 0) {
            return res.status(400).json({ error: "Email is already taken" });
        }
        next();
    } catch (err) {
        console.error("Database error: ", err);
        res.status(500).json({ error: "Internal server error" });
    }
}


export async function hashPassword(req, res, next) {
    try {
        const { password } = req.body;
        req.body.hashedPassword = await bcrypt.hash(password, 10);
        delete req.body.password;
        next();
    } catch (err) {
        console.error(err);
        res.sendStatus(500).json({ error: "Internal server error" });
    }
}

export const validateLogin =[
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationError
];

export async function findUserByEmail(req, res, next) {
    const { email } = req.body;
    
    try {
        const [users] = await database.query("SELECT * FROM users WHERE email = ?", [email]);
        console.log("Utilisateurs trouvés : ", users);
        
        if (users.length === 0) {
            return res.status(401).json({ error: "User not found" });
        }
        
        req.user = users[0];
        next(); // ✅ AJOUTEZ CECI
    } catch (err) {
        console.error("Error finding user:", err);
        res.status(500).json({ error: "Internal server error" });
    }
}

export async function verifyPassword(req, res, next) {
    const { password } = req.body;
    const user = req.user; // Assuming user is set in the previous middleware

    // Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ error: "Invalid password" });
    }
    next();
}


export function requireAuth(req, res, next) {
     // Vérifie que le cookie est bien passé
    const token = req.cookies.access_token;

    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        // Vérifie et décode le token
        req.auth = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}
