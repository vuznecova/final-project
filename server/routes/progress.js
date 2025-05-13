const express = require("express");
const router = express.Router();
const knex = require("../db/knex");
const authMiddleware = require("../middleware/auth");

// POST /api/progress
router.post("/", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { level, time_taken, anxiety_rating } = req.body;

  try {
    // 1) Сохраняем прогресс
    await knex("progress").insert({
      user_id: userId,
      level,
      time_taken,
      anxiety_rating,
      completed_at: new Date()
    });

    // 2) Текущий прогресс пользователя
    const progress = await knex("progress")
      .where({ user_id: userId })
      .whereNotNull("completed_at");

    // 3) Уже выданные ачивки
    const userAchievements = await knex("user_achievements")
      .where({ user_id: userId })
      .pluck("type_id");
    const issued = new Set(userAchievements);

    // 4) Вся коллекция типов ачивок
    const allTypes = await knex("achievement_types").select("*");
    const typeMap = Object.fromEntries(allTypes.map(a => [a.code, a]));

    const toInsert = [];

    // ——————————————————————————————————————————
    // 5) Ачивки за прохождение уровней lvlX_complete
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

    // ——————————————————————————————————————————
    // 6) Speed Runner: любой уровень ≤ 30 секунд
    const fast = progress.find(p => p.time_taken !== null && p.time_taken <= 30);
    if (
      fast &&
      typeMap["speed_runner"] &&
      !issued.has(typeMap["speed_runner"].id)
    ) {
      toInsert.push({
        user_id: userId,
        type_id: typeMap["speed_runner"].id
      });
    }

    // ——————————————————————————————————————————
    // 7) Consistency Champ: 3 разных уровня подряд
    const sorted = [...progress].sort(
      (a, b) => new Date(a.completed_at) - new Date(b.completed_at)
    );
    for (let i = 0; i <= sorted.length - 3; i++) {
      const [l1, l2, l3] = [sorted[i], sorted[i + 1], sorted[i + 2]];
      const distinct =
        l1.level !== l2.level &&
        l2.level !== l3.level &&
        l1.level !== l3.level;
      if (
        distinct &&
        typeMap["consistency_champ"] &&
        !issued.has(typeMap["consistency_champ"].id)
      ) {
        toInsert.push({
          user_id: userId,
          type_id: typeMap["consistency_champ"].id
        });
        break;
      }
    }

    // ——————————————————————————————————————————
    // 8) Serenity Seeker: anxiety_rating ≤ 3
    if (
      anxiety_rating != null &&
      anxiety_rating <= 3 &&
      typeMap["calm_climber"] &&      // убедитесь, что в БД есть запись с code = 'calm_climber'
      !issued.has(typeMap["calm_climber"].id)
    ) {
      toInsert.push({
        user_id: userId,
        type_id: typeMap["calm_climber"].id
      });
    }

    // ——————————————————————————————————————————
    // 9) Eagle Eye: 3 объекта ≤ 15 секунд
    // justFinished — это последняя запись в прогрессе
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

    // ——————————————————————————————————————————
    // 10) Вставляем все новые ачивки за раз
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

module.exports = router;
