import database from "../config/database.js";
import jwt from 'jsonwebtoken';

// Fonction pour insérer un nouvel utilisateur
export async function createUser(req, res) {
    const { name, email, hashedPassword } = req.body;
    
    try {
        const [result] = await database.query(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)", 
            [name, email, hashedPassword]
        );
        
        return res.status(201).json({ id: result.insertId });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Internal server error" }); 
    }
}

export async function login(req, res) {
    const { user } = req;
    const now = Math.floor(Date.now() / 1000);
    
    // Génération du token JWT
    const token = jwt.sign({
        sub: user.id,
        iat: now,
        exp: now + 60 * 60 * 24,
    }, process.env.JWT_SECRET);
    
    // Envoi du token dans un cookie
    res.cookie("access_token", token, {
        httpOnly: true,
        secure: false,
        maxAge: 60 * 60 * 24 * 1000,
    });
    
    // ✅ RETOURNER LE TOKEN dans la réponse JSON pour Postman
    // TODO: Le retirer plus tard !!!!!!!!!!!!!
    return res.status(200).json({ 
        message: "Login successful",
        token,  // Pour pouvoir copier le token dans Postman
        user: {
            id: user.id,
            name: user.name,
            email: user.email
        }
    });
}

export async function myProfile(req, res) {
    const { sub } = req.auth;
    
    try {
        const [users] = await database.query(
            "SELECT id, name, email, created_at FROM users WHERE id = ?", 
            [sub]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        
        res.json(users[0]);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" }); 
    }
}
