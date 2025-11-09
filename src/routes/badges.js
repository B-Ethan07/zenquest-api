import { Router } from "express";
import { requireAuth } from "../middlewares/authValidator.js";
import { 
        getAllBadges, 
        getUserBadges,
        getBadgesProgress,
        awardBadgeToUser    
    } from "../controllers/BadgeController.js";

const router = Router();

router.use(requireAuth);

router.get("/", getAllBadges);
router.get("/user", getUserBadges);
router.get("/progress", getBadgesProgress);
router.post("/:badgeId/award", awardBadgeToUser);

export { router as badgesRouter };
