const express = require("express");
const router = express.Router();
const knex = require("../db/knex");
const authMiddleware = require("../middleware/auth");

// Добавить новую запись о прогрессе
router.post("/", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { level, time_taken, anxiety_rating } = req.body;

  try {
    // 1. Запись прогресса
    await knex("progress").insert({
      user_id: userId,
      level,
      time_taken,
      anxiety_rating,
      completed_at: new Date()
    });

    // 2. Получение всех завершённых уровней
    const progress = await knex("progress")
      .where({ user_id: userId })
      .whereNotNull("completed_at");

    // 3. Список уже выданных ачивок
    const userAchievements = await knex("user_achievements")
      .where({ user_id: userId })
      .pluck("type_id");

    const issued = new Set(userAchievements);

    // 4. Получение справочника ачивок
    const allTypes = await knex("achievement_types").select("*");
    const typeMap = Object.fromEntries(allTypes.map(a => [a.code, a]));

    const toInsert = [];

    // === Уровневые достижения ===
    for (let i = 1; i <= 6; i++) {
      const code = `lvl${i}_complete`;
      const hasCompleted = progress.some(p => p.level === i);
      if (hasCompleted && typeMap[code] && !issued.has(typeMap[code].id)) {
        toInsert.push({ user_id: userId, type_id: typeMap[code].id });
      }
    }

    // === Speed Runner: за <= 30 сек ===
    const fast = progress.find(p => p.time_taken !== null && p.time_taken <= 30);
    if (fast && typeMap["speed_runner"] && !issued.has(typeMap["speed_runner"].id)) {
      toInsert.push({ user_id: userId, type_id: typeMap["speed_runner"].id });
    }

    // === Consistency Champ: 3 подряд без паузы и перезагрузки ===
    const sorted = [...progress].sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at));
    for (let i = 0; i <= sorted.length - 3; i++) {
      const l1 = sorted[i];
      const l2 = sorted[i + 1];
      const l3 = sorted[i + 2];
      const isValid =
        l1.user_id === userId &&
        l2.user_id === userId &&
        l3.user_id === userId &&
        l1.level !== l2.level &&
        l2.level !== l3.level &&
        l1.level !== l3.level;

      if (isValid && typeMap["consistency_champ"] && !issued.has(typeMap["consistency_champ"].id)) {
        toInsert.push({ user_id: userId, type_id: typeMap["consistency_champ"].id });
        break;
      }
    }

    // === Вставка новых ачивок ===
    if (toInsert.length > 0) {
      await knex("user_achievements").insert(
        toInsert.map(entry => ({
          ...entry,
          awarded_at: new Date()
        }))
      );
    }

    res.sendStatus(201);
  } catch (err) {
    console.error("Error saving progress:", err);
    res.status(500).json({ error: "Failed to save progress." });
  }
});

// Получить прогресс пользователя
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

// Получить достижения пользователя
router.get("/achievements", authMiddleware, async (req, res) => {
  try {
    // 💡 Отключаем кеш
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");

    const data = await knex("user_achievements")
      .join("achievement_types", "user_achievements.type_id", "=", "achievement_types.id")
      .select(
        "achievement_types.name",
        "achievement_types.description",
        "achievement_types.icon_path",
        "user_achievements.awarded_at"
      )
      .where("user_achievements.user_id", req.user.id)
      .orderBy("user_achievements.awarded_at", "desc");

    // 💡 Убеждаемся, что всегда отправляем JSON (и не попадаем в 304)
    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching achievements:", err);
    res.status(500).json({ error: "Failed to fetch achievements." });
  }
});


module.exports = router;
