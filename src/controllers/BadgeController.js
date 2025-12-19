import database from "../config/database.js";
import { getBadgeIcon } from "../config/badgeIcons.js";

// Fonction helper pour ajouter les icônes
function enrichBadgeWithIcon(badge) {
  return {
    ...badge,
    icon: getBadgeIcon(badge.icon)
  };
}

// ==================== GET ALL BADGES ====================
// GET /api/badges
// Retourne tous les badges disponibles
export async function getAllBadges(req, res) {
  try {
    const [badges] = await database.query(
      "SELECT * FROM badges ORDER BY points ASC"
    );
    
    // Ajouter les emojis
    const enrichedBadges = badges.map(enrichBadgeWithIcon);
    
    res.json(enrichedBadges);
  } catch (err) {
    console.error("Error fetching badges:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ==================== GET USER BADGES ====================
// GET /api/badges/user
// Retourne les badges débloqués par l'utilisateur
export async function getUserBadges(req, res) {
  const userId = req.auth.sub;

  try {
    const [badges] = await database.query(
      `SELECT 
        b.id,
        b.code,
        b.name,
        b.description,
        b.icon,
        b.points,
        ub.unlocked_at
      FROM badges b
      INNER JOIN user_badges ub ON b.id = ub.badge_id
      WHERE ub.user_id = ?
      ORDER BY ub.unlocked_at DESC`,
      [userId]
    );

    const enrichedBadges = badges.map(enrichBadgeWithIcon);

    res.json({
      badges: enrichedBadges,
      total: enrichedBadges.length
    });
  } catch (err) {
    console.error("Error fetching user badges:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ==================== GET BADGES PROGRESS ====================
// GET /api/badges/progress
// Retourne tous les badges avec leur statut (débloqué ou non) + progression
export async function getBadgesProgress(req, res) {
  const userId = req.auth.sub;

  try {
    const [[stats]] = await database.query(
      `SELECT 
        COUNT(*) as total_entries,
        SUM(CASE WHEN mood >= 4 THEN 1 ELSE 0 END) as good_mood_count
      FROM entries 
      WHERE user_id = ?`,
      [userId]
    );

    const [badges] = await database.query(
      `SELECT 
        b.*,
        CASE WHEN ub.id IS NOT NULL THEN 1 ELSE 0 END as is_unlocked,
        ub.unlocked_at
      FROM badges b
      LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = ?
      ORDER BY b.points ASC`,
      [userId]
    );

    const badgesWithProgress = badges.map(badge => {
      let current = 0;
      let target = 0;
      let progress = 0;

      switch (badge.code) {
        case 'FIRST_ENTRY':
          current = Math.min(stats.total_entries, 1);
          target = 1;
          progress = (current / target) * 100;
          break;

        case 'ENTRIES_10':
          current = Math.min(stats.total_entries, 10);
          target = 10;
          progress = (current / target) * 100;
          break;

        case 'ENTRIES_30':
          current = Math.min(stats.total_entries, 30);
          target = 30;
          progress = (current / target) * 100;
          break;

        case 'GOOD_MOOD_10':
          current = Math.min(stats.good_mood_count, 10);
          target = 10;
          progress = (current / target) * 100;
          break;

        default:
          progress = badge.is_unlocked ? 100 : 0;
      }

      return enrichBadgeWithIcon({
        ...badge,
        is_unlocked: Boolean(badge.is_unlocked),
        progress: {
          current,
          target,
          percentage: Math.round(progress)
        }
      });
    });

    const unlockedCount = badgesWithProgress.filter(b => b.is_unlocked).length;
    const totalBadges = badgesWithProgress.length;

    res.json({
      badges: badgesWithProgress,
      summary: {
        unlocked: unlockedCount,
        total: totalBadges,
        percentage: Math.round((unlockedCount / totalBadges) * 100)
      }
    });

  } catch (err) {
    console.error("Error fetching badges progress:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ==================== AWARD BADGE (interne) ====================
// POST /api/badges/:badgeId/award
// Décerne un badge à un utilisateur (généralement appelé automatiquement)
export async function awardBadgeToUser(req, res) {
  const userId = req.auth.sub;
  const { badgeId } = req.params;

  try {
    // 1. Vérifier que le badge existe
    const [badges] = await database.query(
      "SELECT * FROM badges WHERE id = ?",
      [badgeId]
    );

    if (badges.length === 0) {
      return res.status(404).json({ error: "Badge not found" });
    }

    const badge = badges[0];

    // 2. Vérifier si l'utilisateur a déjà ce badge
    const [existingBadge] = await database.query(
      "SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?",
      [userId, badgeId]
    );

    if (existingBadge.length > 0) {
      return res.status(400).json({ 
        error: "Badge already unlocked",
        badge 
      });
    }

    // 3. Attribuer le badge
    await database.query(
      "INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)",
      [userId, badgeId]
    );

    // 4. Mettre à jour les points de l'utilisateur
    await database.query(
      "UPDATE users SET total_points = total_points + ? WHERE id = ?",
      [badge.points, userId]
    );

    res.status(201).json({ 
      message: "Badge awarded successfully",
      badge: {
        id: badge.id,
        code: badge.code,
        name: badge.name,
        icon: badge.icon,
        points: badge.points
      }
    });

  } catch (err) {
    console.error("Error awarding badge to user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ==================== CHECK & UNLOCK (fonction utilitaire) ====================
// Fonction interne pour débloquer un badge par son code
// Utilisée par le système de gamification
export async function unlockBadgeByCode(userId, badgeCode) {
  try {
    // 1. Récupérer le badge par son code
    const [[badge]] = await database.query(
      "SELECT * FROM badges WHERE code = ?",
      [badgeCode]
    );

    if (!badge) {
      console.warn(`Badge with code ${badgeCode} not found`);
      return null;
    }

    // 2. Vérifier si déjà débloqué
    const [[existing]] = await database.query(
      "SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?",
      [userId, badge.id]
    );

    if (existing) {
      return null; // Déjà débloqué, pas d'action
    }

    // 3. Débloquer le badge
    await database.query(
      "INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)",
      [userId, badge.id]
    );

    // 4. Mettre à jour les points
    await database.query(
      "UPDATE users SET total_points = total_points + ? WHERE id = ?",
      [badge.points, userId]
    );

    console.log(`✅ Badge ${badgeCode} unlocked for user ${userId}`);
    return badge;

  } catch (err) {
    console.error("Error unlocking badge:", err);
    return null;
  }
}
