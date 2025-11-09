import { Router } from 'express';
import { userValidator } from '../middlewares/userValidator.js';
import { createUser, login }  from '../controllers/UserController.js';
import { checkEMailNotTaken, findUserByEmail, verifyPassword, hashPassword, validateLogin } from '../middlewares/authValidator.js';

const router = Router();

// POST
router.post("/", userValidator, checkEMailNotTaken, hashPassword, createUser);

export { router as usersRouter };
