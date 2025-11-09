import dotenv from "dotenv";
dotenv.config();

import mysql2 from "mysql2/promise";

const database = mysql2.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

database.getConnection().catch((err)=> {
  console.warn(
    "Attention: ",
    "Impossible de se connecter à la db.",
    "Avez vous insérez les bonnes informations dans votre dotenv ?",
    "\n",
    err.sqlMessage
  );
})

export default database;
