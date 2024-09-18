const express = require("express");
const youtubedl = require("youtube-dl-exec");
const fs = require("fs-extra");
const path = require("path");
const { getVideoInfo } = require("../utils/mediaUtils");

const router = express.Router();

const sanitizeFilename = (name) => {
  return name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
};

router.post("/download/init", async (req, res) => {
  const { videoUrl, quality } = req.body;

  if (!videoUrl) {
    return res.status(400).json({ error: "You must provide a video URL" });
  }

  if (!quality) {
    return res.status(400).json({ error: "Invalid quality" });
  }

  try {
    const videoInfo = await getVideoInfo(videoUrl);
    const videoTitle = sanitizeFilename(videoInfo.title);
    const filePath = path.resolve(__dirname, `../downloads/${videoTitle}.mp4`);

    const downloadsDir = path.resolve(__dirname, "../downloads");
    await fs.ensureDir(downloadsDir);

    await youtubedl.exec(videoUrl, {
      format: `bestvideo[height<=${quality}]+bestaudio/best`,
      mergeOutputFormat: "mp4",
      output: filePath,
      postprocessorArgs: ["-c:a aac -strict experimental"],
    });

    res.status(200).json({ filename: `${videoTitle}.mp4` });
  } catch (error) {
    console.error("Error during video download:", error);
    res.status(500).json({
      error: "Error during video download",
      details: error.message,
    });
  }
});

router.get("/download/:filename", async (req, res) => {
  const { filename } = req.params;
  const filePath = path.resolve(__dirname, `../downloads/${filename}`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  res.download(filePath, filename, (err) => {
    if (err) {
      console.error("Error sending the file:", err);
      res.status(500).send("Error sending the file");
    }

    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
      }
    });
  });
});

module.exports = router;
