export function requireAdminQuery(req, res, next) {
    // Vérifie si la requête contient le paramètre 'admin' avec la valeur 'true'
    if (req.query.role === 'admin') {
        console.log('Admin access granted');
        next(); // Passe au middleware suivant si l'accès admin est accordé
    } else {
        console.log('Admin access denied');
        return res.status(403).json({ error: "Access denied. Admin privileges required." }); // Retourne une erreur 403 si l'accès est refusé
    }
}
