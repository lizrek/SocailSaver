const express = require("express");
const youtubedl = require("youtube-dl-exec");
const fs = require("fs-extra");
const path = require("path");
const { getVideoInfo } = require("../utils/mediaUtils");

const router = express.Router();

const sanitizeFilename = (name) => {
  return name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
};

const acceptableCodecs = [
  "mp4a.40.1",
  "mp4a.40.2",
  "mp4a.40.3",
  "mp4a.40.4",
  "mp4a.40.5",
  "mp4a.40.17",
  "mp4a.40.29",
  "mp3",
];

const getBestAudioFormat = (audioQualities) => {
  const bestAudio = audioQualities
    .filter((quality) => acceptableCodecs.includes(quality.codec))
    .map((quality) => ({
      codec: quality.codec,
      bitrate: Math.max(...quality.bitrates),
    }))
    .sort((a, b) => b.bitrate - a.bitrate)[0];

  return bestAudio || null;
};

const getHighestBitrateFormat = (audioQualities) => {
  return audioQualities
    .map((quality) => ({
      codec: quality.codec,
      bitrate: Math.max(...quality.bitrates),
    }))
    .sort((a, b) => b.bitrate - a.bitrate)[0];
};

const getFormatString = (bestAudio, quality, fps) => {
  if (bestAudio.codec === "mp3" || bestAudio.codec.startsWith("mp4a")) {
    return `bestvideo[height<=${quality}][fps<=${fps}]+bestaudio[ext=${
      bestAudio.codec === "mp3" ? "mp3" : "m4a"
    }]`;
  }
  return `bestvideo[height<=${quality}][fps<=${fps}]+bestaudio`;
};

router.post("/download/init", async (req, res) => {
  const { videoUrl, quality, fps } = req.body;

  if (!videoUrl) {
    return res.status(400).json({ error: "You must provide a video URL" });
  }

  if (!quality || !fps) {
    return res.status(400).json({ error: "Invalid quality or fps" });
  }

  try {
    const videoInfo = await getVideoInfo(videoUrl);
    const videoTitle = sanitizeFilename(videoInfo.title);
    const filePath = path.resolve(__dirname, `../downloads/${videoTitle}.mp4`);

    const downloadsDir = path.resolve(__dirname, "../downloads");
    await fs.ensureDir(downloadsDir);

    let bestAudio = getBestAudioFormat(videoInfo.audioQualities);

    if (!bestAudio) {
      bestAudio = getHighestBitrateFormat(videoInfo.audioQualities);
    }

    if (!bestAudio) {
      return res.status(400).json({ error: "No audio formats available." });
    }

    const format = getFormatString(bestAudio, quality, fps);

    const postprocessorArgs = acceptableCodecs.includes(bestAudio.codec)
      ? "-c:v copy -c:a copy"
      : "-c:a aac -strict experimental";

    await youtubedl.exec(videoUrl, {
      format: format,
      mergeOutputFormat: "mp4",
      output: filePath,
      postprocessorArgs: postprocessorArgs,
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
