import express from "express";
import logger from "./middlewares/logger.js";
import { usersRouter } from "./routes/users.js";
import { entriesRouter } from "./routes/entries.js";
import { login, myProfile}  from './controllers/UserController.js';
import { findUserByEmail, verifyPassword, validateLogin, requireAuth } from './middlewares/authValidator.js';
import cookieParser from "cookie-parser";
import { statsRouter } from "./routes/stats.js";
import { badgesRouter } from "./routes/badges.js";

// Création de l'application Express
const app = express();

// Port du serveur, par défaut 3000 ou défini par la variable d'environnement SERVER_PORT
const serverPort = process.env.SERVER_PORT ?? 3000;

// ---------------MIDDLEWARE ---------------------------

// middleware express.json() pour parser le corps des requêtes en JSON
app.use(express.json());
// log method, url and date of the request
app.use(logger); 
app.use(cookieParser()); // Middleware pour parser les cookies

// ---------------ROUTE INDEX ---------------------------

app.use("/users", usersRouter);
app.use("/entries", entriesRouter);
app.use("/stats", statsRouter);
app.use("/badges", badgesRouter);

// ---------------ROUTE AUTH ---------------------------
app.post("/login", validateLogin, findUserByEmail, verifyPassword, login);
app.get("/profile", requireAuth, myProfile )

// ---------------ROUTE Controller ---------------------------


app.get("/", (req, res) => {
  console.log(`Requête reçue : ${req.method} ${req.url}`);
  res.send("<h1>Hello User ! Welcome in API ZenQuest</h1>");
});


app.listen(serverPort, () => {
  console.info(`Listening on port http://localhost:${serverPort}`);
});
