/**
 * Middleware pour valider les données d'une entrée (entry)
 */
export function entryValidator(req, res, next) {
  const { entry_date, mood, sleep_hours, sport_minutes, food_quality, note } = req.body;

  // Validation des champs requis
  if (!entry_date) {
    return res.status(400).json({
      error: "entry_date is required"
    });
  }

  if (!mood) {
    return res.status(400).json({
      error: "mood is required"
    });
  }

  // Validation du format de la date (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(entry_date)) {
    return res.status(400).json({
      error: "entry_date must be in YYYY-MM-DD format"
    });
  }

  // Vérifier que la date est valide
  const date = new Date(entry_date);
  if (isNaN(date.getTime())) {
    return res.status(400).json({
      error: "entry_date is not a valid date"
    });
  }

  // Validation du mood (doit être un nombre entre 1 et 5, par exemple)
  const moodNum = Number(mood);
  if (isNaN(moodNum) || moodNum < 1 || moodNum > 5) {
    return res.status(400).json({
      error: "mood must be a number between 1 and 5"
    });
  }

  // Validation optionnelle de sleep_hours
  if (sleep_hours !== undefined && sleep_hours !== null && sleep_hours !== '') {
    const sleepNum = Number(sleep_hours);
    if (isNaN(sleepNum) || sleepNum < 0 || sleepNum > 24) {
      return res.status(400).json({
        error: "sleep_hours must be a number between 0 and 24"
      });
    }
  }

  // Validation optionnelle de sport_minutes
  if (sport_minutes !== undefined && sport_minutes !== null && sport_minutes !== '') {
    const sportNum = Number(sport_minutes);
    if (isNaN(sportNum) || sportNum < 0) {
      return res.status(400).json({
        error: "sport_minutes must be a positive number"
      });
    }
  }

  // Validation optionnelle de food_quality
  if (food_quality !== undefined && food_quality !== null && food_quality !== '') {
    const foodNum = Number(food_quality);
    if (isNaN(foodNum) || foodNum < 1 || foodNum > 5) {
      return res.status(400).json({
        error: "food_quality must be a number between 1 and 5"
      });
    }
  }

  // Validation optionnelle de la note
  if (note && typeof note !== 'string') {
    return res.status(400).json({
      error: "note must be a string"
    });
  }

  if (note && note.length > 1000) {
    return res.status(400).json({
      error: "note must be less than 1000 characters"
    });
  }

  // Tout est valide, continuer
  next();
}
