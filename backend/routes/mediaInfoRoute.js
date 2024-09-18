const express = require("express");
const { getVideoInfo } = require("../utils/mediaUtils");

const router = express.Router();

router.post("/info", async (req, res) => {
  const { videoUrl } = req.body;

  try {
    const videoInfo = await getVideoInfo(videoUrl);

    if (
      !videoInfo ||
      !videoInfo.qualities ||
      !Array.isArray(videoInfo.qualities)
    ) {
      return res
        .status(400)
        .json({ error: "Invalid video information or no formats available" });
    }

    const videoDetails = {
      title: videoInfo.title,
      thumbnail: videoInfo.thumbnail,
      qualities: videoInfo.qualities,
      audioQualities: videoInfo.audioQualities,
    };

    res.json(videoDetails);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
