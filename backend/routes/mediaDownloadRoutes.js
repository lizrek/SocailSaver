const express = require("express");
const youtubedl = require("youtube-dl-exec");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs-extra");
const path = require("path");
const { getVideoInfo } = require("../utils/mediaUtils");

const router = express.Router();

const codecMap = {
  "mp4a.40.2": { codec: "aac", ext: "m4a" },
  "mp4a.40.5": { codec: "aac", ext: "m4a" },
  opus: { codec: "opus", ext: "webm" },
  vorbis: { codec: "vorbis", ext: "ogg" },
  mp3: { codec: "mp3", ext: "mp3" },
};

const sanitizeFilename = (name) => {
  return name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
};

router.post("/download/init", async (req, res) => {
  const {
    videoUrl,
    quality,
    fps,
    bitrate,
    isVideoOnly,
    audioCodec,
    videoFormat,
  } = req.body;

  if (!videoUrl) {
    return res.status(400).json({ error: "You must provide a video URL" });
  }

  let ytdlpOptions = {};

  if (
    quality &&
    fps &&
    !bitrate &&
    !isVideoOnly &&
    !audioCodec &&
    !videoFormat
  ) {
    try {
      const videoInfo = await getVideoInfo(videoUrl);
      const videoTitle = sanitizeFilename(videoInfo.title);
      const filePath = path.resolve(
        __dirname,
        `../downloads/${videoTitle}.mp4`
      );
      ytdlpOptions = {
        output: filePath,
        format: `bestvideo[height<=${quality}][fps<=${fps}]+bestaudio[ext=m4a]`,
        mergeOutputFormat: "mp4",
      };

      await youtubedl.exec(videoUrl, ytdlpOptions);
      return res.status(200).json({ filename: `${videoTitle}.mp4` });
    } catch (error) {
      console.log("Error during download video by default:", error);
      return res.status(500).json({
        error: "Error during download video by default:",
        details: error.message,
      });
    }
  }

  if (
    bitrate &&
    !quality &&
    !fps &&
    !isVideoOnly &&
    !audioCodec &&
    !videoFormat
  ) {
    try {
      const videoInfo = await getVideoInfo(videoUrl);
      const videoTitle = sanitizeFilename(videoInfo.title);
      const filePath = path.resolve(
        __dirname,
        `../downloads/${videoTitle}.m4a`
      );

      ytdlpOptions = {
        output: filePath,
        format: `bestaudio[ext=m4a][abr<=${Math.round(bitrate) + 1}]`,
        postprocessorArgs: [`-b:a ${Math.round(bitrate)}k`],
      };

      await youtubedl.exec(videoUrl, ytdlpOptions);
      return res.status(200).json({ filename: `${videoTitle}.m4a` });
    } catch (error) {
      console.log("Error during audio download:", error);
      return res.status(500).json({
        error: "Error during audio download",
        details: error.message,
      });
    }
  }

  if (
    quality &&
    fps &&
    !bitrate &&
    isVideoOnly &&
    !audioCodec &&
    !videoFormat
  ) {
    try {
      const videoInfo = await getVideoInfo(videoUrl);
      const videoTitle = sanitizeFilename(videoInfo.title);
      const filePath = path.resolve(
        __dirname,
        `../downloads/${videoTitle}.mp4`
      );
      ytdlpOptions = {
        output: filePath,
        format: `bestvideo[height<=${quality}][fps<=${fps}][ext=webm]`,
        mergeOutputFormat: "mp4",
      };
      await youtubedl.exec(videoUrl, ytdlpOptions);
      return res.status(200).json({ filename: `${videoTitle}.mp4` });
    } catch (error) {
      console.log("Error during download video by default:", error);
      return res.status(500).json({
        error: "Error during download video by default:",
        details: error.message,
      });
    }
  }

  if (quality && fps && bitrate && !isVideoOnly && audioCodec && videoFormat) {
    try {
      const videoInfo = await getVideoInfo(videoUrl);
      const videoTitle = sanitizeFilename(videoInfo.title);
      const codecInfo = codecMap[audioCodec] || { codec: "aac", ext: "m4a" };
      const filePath = path.resolve(
        __dirname,
        `../downloads/${videoTitle}.${videoFormat}`
      );

      ytdlpOptions = {
        output: filePath,
        format: `bestvideo[height<=${quality}][fps<=${fps}][ext=${videoFormat}]+bestaudio[ext=${
          codecInfo.ext
        }][abr<=${Math.round(bitrate) + 1}]`,
        mergeOutputFormat: videoFormat,
      };

      await youtubedl.exec(videoUrl, ytdlpOptions);
      return res.status(200).json({ filename: `${videoTitle}.${videoFormat}` });
    } catch (error) {
      console.log("Error during download video by default:", error);
      return res.status(500).json({
        error: "Error during download video by default:",
        details: error.message,
      });
    }
  }

  if (
    !quality &&
    !fps &&
    bitrate &&
    !isVideoOnly &&
    audioCodec &&
    !videoFormat
  ) {
    try {
      const videoInfo = await getVideoInfo(videoUrl);
      const videoTitle = sanitizeFilename(videoInfo.title);
      const codecInfo = codecMap[audioCodec] || { codec: "aac", ext: "m4a" };
      const filePath = path.resolve(
        __dirname,
        `../downloads/${videoTitle}.${codecInfo.ext}`
      );

      ytdlpOptions = {
        output: filePath,
        format: `bestaudio[ext=${codecInfo.ext}][abr<=${
          Math.round(bitrate) + 1
        }]`,
      };

      await youtubedl.exec(videoUrl, ytdlpOptions);
      return res
        .status(200)
        .json({ filename: `${videoTitle}.${codecInfo.ext}` });
    } catch (error) {
      console.log("Error during download audio:", error);
      return res.status(500).json({
        error: "Error during download advanced only audio:",
        details: error.message,
      });
    }
  }

  if (quality && fps && !bitrate && isVideoOnly && !audioCodec && videoFormat) {
    try {
      const videoInfo = await getVideoInfo(videoUrl);
      const videoTitle = sanitizeFilename(videoInfo.title);
      const filePath = path.resolve(
        __dirname,
        `../downloads/${videoTitle}.${videoFormat}`
      );

      ytdlpOptions = {
        output: filePath,
        format: `bestvideo[height<=${quality}][fps<=${fps}][ext=webm]`,
        mergeOutputFormat: videoFormat
      };

      await youtubedl.exec(videoUrl, ytdlpOptions);
      return res
        .status(200)
        .json({ filename: `${videoTitle}.${videoFormat}` });
    } catch (error) {
      console.log("Error during download audio:", error);
      return res.status(500).json({
        error: "Error during download advanced only audio:",
        details: error.message,
      });
    }
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
