export default function logger(req, res, next) {
    // Middleware pour logger les requêtes
    // On peut logger les requêtes HTTP
  const now = new Date().toISOString(); // get current date-time string
  console.log(`${now} ${req.method} ${req.url}`);
  next();
}
