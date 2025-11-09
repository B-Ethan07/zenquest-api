import database from "../config/database.js";

/**
 * Get overall statistics for a user
 */
export async function getStats(req, res) {
  const userId = req.auth.sub;
  
  try {
    const [[stats]] = await database.query(
      `SELECT 
        COUNT(*) as total_entries,
        MIN(entry_date) as first_entry_date,
        MAX(entry_date) as last_entry_date,
        ROUND(AVG(mood), 2) as overall_avg_mood,
        ROUND(AVG(sleep_hours), 2) as overall_avg_sleep,
        ROUND(AVG(sport_minutes), 2) as overall_avg_sport,
        ROUND(AVG(food_quality), 2) as overall_avg_food
      FROM entries 
      WHERE user_id = ?`,
      [userId]
    );
    
    res.json({
      totalEntries: stats.total_entries || 0,
      firstEntryDate: stats.first_entry_date,
      lastEntryDate: stats.last_entry_date,
      averages: {
        mood: stats.overall_avg_mood,
        sleep: stats.overall_avg_sleep,
        sport: stats.overall_avg_sport,
        food: stats.overall_avg_food
      }
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Get monthly statistics grouped by day (last 30 days)
 */
export async function getMonthlyStats(req, res) {
  const userId = req.auth.sub;
  
  try {
    // Statistiques globales du mois
    const [[summary]] = await database.query(
      `SELECT
        COUNT(*) as total_entries,
        ROUND(AVG(mood), 2) as avg_mood,
        ROUND(AVG(sleep_hours), 2) as avg_sleep,
        ROUND(AVG(sport_minutes), 2) as avg_sport,
        ROUND(AVG(food_quality), 2) as avg_food
      FROM entries
      WHERE user_id = ?
        AND entry_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      [userId]
    );

    // Données par jour pour les graphiques
    const [dailyData] = await database.query(
      `SELECT
        entry_date,
        mood,
        sleep_hours,
        sport_minutes,
        food_quality
      FROM entries
      WHERE user_id = ?
        AND entry_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      ORDER BY entry_date ASC`,
      [userId]
    );
    
    res.json({
      summary: summary || {
        total_entries: 0,
        avg_mood: null,
        avg_sleep: null,
        avg_sport: null,
        avg_food: null
      },
      daily: dailyData
    });
  } catch (err) {
    console.error("Error fetching monthly stats:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Get weekly statistics grouped by day (last 7 days)
 */
export async function getWeeklyStats(req, res) {
  const userId = req.auth.sub;
  
  try {
    const [[summary]] = await database.query(
      `SELECT
        COUNT(*) as total_entries,
        ROUND(AVG(mood), 2) as avg_mood,
        ROUND(AVG(sleep_hours), 2) as avg_sleep,
        ROUND(AVG(sport_minutes), 2) as avg_sport,
        ROUND(AVG(food_quality), 2) as avg_food
      FROM entries
      WHERE user_id = ?
        AND entry_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      [userId]
    );

    const [dailyData] = await database.query(
      `SELECT
        entry_date,
        mood,
        sleep_hours,
        sport_minutes,
        food_quality
      FROM entries
      WHERE user_id = ?
        AND entry_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      ORDER BY entry_date ASC`,
      [userId]
    );
    
    res.json({
      summary: summary || {
        total_entries: 0,
        avg_mood: null,
        avg_sleep: null,
        avg_sport: null,
        avg_food: null
      },
      daily: dailyData
    });
  } catch (err) {
    console.error("Error fetching weekly stats:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Get today's statistics
 */
export async function getDailyStats(req, res) {
  const userId = req.auth.sub;
  
  try {
    const [entries] = await database.query(
      `SELECT
        mood,
        sleep_hours,
        sport_minutes,
        food_quality,
        note,
        entry_date
      FROM entries
      WHERE user_id = ?
        AND entry_date = CURDATE()`,
      [userId]
    );
    
    if (entries.length === 0) {
      return res.json({
        hasEntry: false,
        entry: null
      });
    }
    
    res.json({
      hasEntry: true,
      entry: entries[0]
    });
  } catch (err) {
    console.error("Error fetching daily stats:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Get statistics for a custom date range
 */
export async function getCustomRangeStats(req, res) {
  const userId = req.auth.sub;
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({ 
      error: "startDate and endDate are required" 
    });
  }
  
  try {
    const [[summary]] = await database.query(
      `SELECT
        COUNT(*) as total_entries,
        ROUND(AVG(mood), 2) as avg_mood,
        ROUND(AVG(sleep_hours), 2) as avg_sleep,
        ROUND(AVG(sport_minutes), 2) as avg_sport,
        ROUND(AVG(food_quality), 2) as avg_food
      FROM entries
      WHERE user_id = ?
        AND entry_date BETWEEN ? AND ?`,
      [userId, startDate, endDate]
    );

    const [dailyData] = await database.query(
      `SELECT
        entry_date,
        mood,
        sleep_hours,
        sport_minutes,
        food_quality
      FROM entries
      WHERE user_id = ?
        AND entry_date BETWEEN ? AND ?
      ORDER BY entry_date ASC`,
      [userId, startDate, endDate]
    );
    
    res.json({
      dateRange: { startDate, endDate },
      summary: summary || {
        total_entries: 0,
        avg_mood: null,
        avg_sleep: null,
        avg_sport: null,
        avg_food: null
      },
      daily: dailyData
    });
  } catch (err) {
    console.error("Error fetching custom range stats:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
