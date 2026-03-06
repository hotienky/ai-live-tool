const express = require("express");
const router = express.Router();
const { generateReply, analyzeSentiment } = require("../replyService");

/**
 * POST /api/reply/suggest
 * Body: { comment, label, nickname }
 * Returns: { reply }
 */
router.post("/suggest", async (req, res) => {
  try {
    const { comment, label, nickname } = req.body;
    if (!comment) {
      return res.status(400).json({ error: "comment is required" });
    }
    const reply = await generateReply(comment, label, nickname);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/reply/sentiment
 * Body: { comments: [{comment: "..."}] }
 * Returns: { score, mood, summary }
 */
router.post("/sentiment", async (req, res) => {
  try {
    const { comments } = req.body;
    const result = await analyzeSentiment(comments || []);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
