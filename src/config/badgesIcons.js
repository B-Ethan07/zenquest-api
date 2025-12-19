export const BADGE_ICONS = {
  seedling: '🌱',
  star: '⭐',
  trophy: '🏆',
  smile: '😊',
  fire: '🔥',
  rocket: '🚀',
  medal: '🏅',
  crown: '👑'
};

// Fonction helper pour récupérer l'icône
export function getBadgeIcon(iconCode) {
  return BADGE_ICONS[iconCode] || '🎯'; 
}