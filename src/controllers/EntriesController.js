import database from "../config/database.js";
import { unlockBadgeByCode } from "./BadgeController.js";

// ==================== CREATE ====================
// POST /entries
export async function createEntry(req, res) {
  const userId = req.auth.sub;
  const { entry_date, mood, sleep_hours, sport_minutes, food_quality, note } = req.body;

  try {
    // 1. Insérer l'entrée
    const [result] = await database.query(
      "INSERT INTO entries (user_id, entry_date, mood, sleep_hours, sport_minutes, food_quality, note) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [userId, entry_date, mood, sleep_hours || null, sport_minutes || null, food_quality || null, note || null]
    );

    // 2. Vérifier et débloquer les badges
    const unlockedBadges = await checkAndUnlockBadges(userId);

    // 3. Retourner la réponse avec les badges débloqués
    res.status(201).json({
      id: result.insertId,
      message: "Entry created successfully",
      unlockedBadges: unlockedBadges.length > 0 ? unlockedBadges : null
    });

  } catch (err) {
    console.error("Error creating entry:", err);
    
    // Gérer l'erreur de doublon (même user + même date)
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        error: "You already have an entry for this date"
      });
    }

    res.status(500).json({ error: "Internal server error" });
  }
}

// ==================== READ ALL ====================
// GET /entries
export async function getEntries(req, res) {
  const userId = req.auth.sub;

  try {
    const [entries] = await database.query(
      "SELECT * FROM entries WHERE user_id = ? ORDER BY entry_date DESC",
      [userId]
    );
    res.json(entries);
  } catch (err) {
    console.error("Error fetching entries:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ==================== READ ONE ====================
// GET /entries/:id
export async function getEntryById(req, res) {
  const userId = req.auth.sub;
  const { id } = req.params;

  try {
    const [entries] = await database.query(
      "SELECT * FROM entries WHERE id = ? AND user_id = ? LIMIT 1",
      [id, userId]
    );

    if (entries.length === 0) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.json(entries[0]);
  } catch (err) {
    console.error("Error fetching entry by ID:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ==================== UPDATE ====================
// PUT /entries/:id
export async function updateEntry(req, res) {
  const userId = req.auth.sub;
  const { id } = req.params;
  const { entry_date, mood, sleep_hours, sport_minutes, food_quality, note } = req.body;

  // Validation des champs requis
  if (!entry_date || !mood) {
    return res.status(400).json({
      error: "entry_date and mood are required"
    });
  }

  try {
    const [result] = await database.query(
      "UPDATE entries SET entry_date = ?, mood = ?, sleep_hours = ?, sport_minutes = ?, food_quality = ?, note = ? WHERE id = ? AND user_id = ?",
      [entry_date, mood, sleep_hours || null, sport_minutes || null, food_quality || null, note || null, id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Entry not found" });
    }

    // Re-vérifier les badges après modification
    const unlockedBadges = await checkAndUnlockBadges(userId);

    res.status(200).json({ 
      message: "Entry updated successfully",
      unlockedBadges: unlockedBadges.length > 0 ? unlockedBadges : null
    });

  } catch (err) {
    console.error("Error updating entry:", err);

    // Gérer l'erreur de doublon lors de la mise à jour
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        error: "You already have an entry for this date"
      });
    }

    res.status(500).json({ error: "Internal server error" });
  }
}

// ==================== DELETE ====================
// DELETE /entries/:id
export async function deleteEntry(req, res) {
  const userId = req.auth.sub;
  const { id } = req.params;

  try {
    const [result] = await database.query(
      "DELETE FROM entries WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.status(200).json({ message: "Entry deleted successfully" });

  } catch (err) {
    console.error("Error deleting entry:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ==================== CHECK & UNLOCK BADGES ====================
// Fonction interne : vérifie les conditions et débloque les badges
async function checkAndUnlockBadges(userId) {
  const unlockedBadges = [];

  try {
    // 1. Compter le total d'entrées et les bonnes humeurs en une seule requête
    const [[stats]] = await database.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN mood >= 4 THEN 1 ELSE 0 END) as good_mood_count
       FROM entries 
       WHERE user_id = ?`,
      [userId]
    );

    const { total, good_mood_count } = stats;

    // 2. Vérifier badge "Première entrée"
    if (total === 1) {
      const badge = await unlockBadgeByCode(userId, 'FIRST_ENTRY');
      if (badge) unlockedBadges.push(badge);
    }

    // 3. Vérifier badge "Explorateur" (10 entrées)
    if (total === 10) {
      const badge = await unlockBadgeByCode(userId, 'ENTRIES_10');
      if (badge) unlockedBadges.push(badge);
    }

    // 4. Vérifier badge "Assidu" (30 entrées)
    if (total === 30) {
      const badge = await unlockBadgeByCode(userId, 'ENTRIES_30');
      if (badge) unlockedBadges.push(badge);
    }

    // 5. Vérifier badge "Optimiste" (10 jours de bonne humeur)
    if (good_mood_count === 10) {
      const badge = await unlockBadgeByCode(userId, 'GOOD_MOOD_10');
      if (badge) unlockedBadges.push(badge);
    }

    // Log pour debug
    if (unlockedBadges.length > 0) {
      console.log(`🎉 ${unlockedBadges.length} badge(s) unlocked for user ${userId}`);
    }

    return unlockedBadges;

  } catch (err) {
    console.error("Error checking badges:", err);
    // Ne pas faire planter la requête principale si les badges échouent
    return [];
  }
}
