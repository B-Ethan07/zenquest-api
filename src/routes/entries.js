import { Router } from 'express';
import { userValidator } from '../middlewares/userValidator.js';
import { entryValidator } from '../middlewares/entryValidator.js';
import { 
  createEntry, 
  getEntries, 
  getEntryById, 
  deleteEntry, 
  updateEntry 
} from '../controllers/EntriesController.js';
import { requireAuth } from '../middlewares/authValidator.js';

const router = Router();

// Appliquer userValidator à toutes les routes de ce router
router.use(requireAuth);

// GET all entries for the authenticated user
router.get("/", getEntries);

// GET entry by ID
router.get("/:id", getEntryById);

// POST create a new entry (avec validation des données)
router.post("/", entryValidator, createEntry);

// PUT update entry by ID (avec validation des données)
router.put("/:id", entryValidator, updateEntry);

// DELETE entry by ID
router.delete("/:id", deleteEntry);

export { router as entriesRouter };
