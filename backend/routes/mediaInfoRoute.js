const express = require("express");
const { getVideoInfo } = require("../utils/mediaUtils");

const router = express.Router();

router.post("/info", async (req, res) => {
  const { videoUrl } = req.body;

  try {
    const videoInfo = await getVideoInfo(videoUrl);

    const videoDetails = {
      title: videoInfo.title,
      thumbnail: videoInfo.thumbnail,
      qualities: videoInfo.qualities,
    };

    res.json(videoDetails);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
