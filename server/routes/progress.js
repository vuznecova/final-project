const express = require("express");
const router = express.Router();
const knex = require("../db/knex");
const authMiddleware = require("../middleware/auth");

// POST /api/progress
router.post("/", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { level, time_taken, anxiety_rating } = req.body;

  // 💥 добавили валидацию:
  if (
    typeof level !== 'number' || level < 1 || level > 6 ||
    typeof time_taken !== 'number' || time_taken < 0 ||
    typeof anxiety_rating !== 'number' || anxiety_rating < 0 || anxiety_rating > 10
  ) {
    return res.status(400).json({ error: 'Invalid progress data' });
  }

  try {
    await knex("progress").insert({
      user_id: userId,
      level,
      time_taken,
      anxiety_rating,
      completed_at: new Date()
    });


    const progress = await knex("progress")
      .where({ user_id: userId })
      .whereNotNull("completed_at");

    const userAchievements = await knex("user_achievements")
      .where({ user_id: userId })
      .pluck("type_id");
    const issued = new Set(userAchievements);

    const allTypes = await knex("achievement_types").select("*");
    const typeMap = Object.fromEntries(allTypes.map(a => [a.code, a]));

    const toInsert = [];

    for (let i = 1; i <= 6; i++) {
      const code = `lvl${i}_complete`;
      const has = progress.some(p => p.level === i);
      if (has && typeMap[code] && !issued.has(typeMap[code].id)) {
        toInsert.push({
          user_id: userId,
          type_id: typeMap[code].id
        });
      }
    }

    const fast = progress.find(p => p.time_taken !== null && p.time_taken <= 30);
    if (fast && typeMap["speed_runner"] && !issued.has(typeMap["speed_runner"].id)) {
      toInsert.push({
        user_id: userId,
        type_id: typeMap["speed_runner"].id
      });
    }

    const sorted = [...progress].sort(
      (a, b) => new Date(a.completed_at) - new Date(b.completed_at)
    );
    for (let i = 0; i <= sorted.length - 3; i++) {
      const [l1, l2, l3] = [sorted[i], sorted[i + 1], sorted[i + 2]];
      const distinct = l1.level !== l2.level && l2.level !== l3.level && l1.level !== l3.level;
      if (distinct && typeMap["consistency_champ"] && !issued.has(typeMap["consistency_champ"].id)) {
        toInsert.push({
          user_id: userId,
          type_id: typeMap["consistency_champ"].id
        });
        break;
      }
    }

    if (anxiety_rating != null && anxiety_rating <= 3 && typeMap["calm_climber"] && !issued.has(typeMap["calm_climber"].id)) {
      toInsert.push({
        user_id: userId,
        type_id: typeMap["calm_climber"].id
      });
    }

    const justFinished = progress[progress.length - 1];
    if (
      justFinished.time_taken !== null &&
      justFinished.time_taken <= 15 &&
      typeMap["eagle_eye"] &&
      !issued.has(typeMap["eagle_eye"].id)
    ) {
      toInsert.push({
        user_id: userId,
        type_id: typeMap["eagle_eye"].id
      });
    }

    if (toInsert.length > 0) {
      await knex("user_achievements").insert(
        toInsert.map(entry => ({
          ...entry,
          awarded_at: new Date()
        }))
      );
    }

    return res.sendStatus(201);
  } catch (err) {
    console.error("Error saving progress:", err);
    return res.status(500).json({ error: "Failed to save progress." });
  }
});

// GET /api/progress
router.get("/", authMiddleware, async (req, res) => {
  try {
    const data = await knex("progress")
      .where({ user_id: req.user.id })
      .orderBy("completed_at", "desc");
    res.json(data);
  } catch (err) {
    console.error("Error fetching progress:", err);
    res.status(500).json({ error: "Failed to fetch progress." });
  }
});

// GET /api/progress/achievements
router.get("/achievements", authMiddleware, async (req, res) => {
  try {
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Surrogate-Control": "no-store"
    });

    const data = await knex("user_achievements")
      .join(
        "achievement_types",
        "user_achievements.type_id",
        "=",
        "achievement_types.id"
      )
      .select(
        "achievement_types.code",
        "achievement_types.name",
        "achievement_types.description",
        "achievement_types.icon_path",
        "user_achievements.awarded_at"
      )
      .where("user_achievements.user_id", req.user.id)
      .orderBy("user_achievements.awarded_at", "desc");

    res.json(data);
  } catch (err) {
    console.error("Error fetching achievements:", err);
    res.status(500).json({ error: "Failed to fetch achievements." });
  }
});

// POST /api/achievements/unlock
router.post("/achievements/unlock", authMiddleware, async (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).json({ error: "No achievement key provided" });

  try {
    const type = await knex("achievement_types").where({ code: key }).first();
    if (!type) return res.status(404).json({ error: "Achievement type not found" });

    const existing = await knex("user_achievements")
      .where({ user_id: req.user.id, type_id: type.id })
      .first();

    if (!existing) {
      await knex("user_achievements").insert({
        user_id: req.user.id,
        type_id: type.id,
        awarded_at: new Date()
      });
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("[Achievements] unlock error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
