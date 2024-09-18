const youtubedl = require("youtube-dl-exec");

const getDistinctQualities = (formats) => {
  const qualitiesMap = {};

  formats.forEach((format) => {
    if (format.height && format.vcodec !== "none") {
      const resolution = `${format.height}p`;
      const fps = format.fps || 30;

      if (!qualitiesMap[resolution]) {
        qualitiesMap[resolution] = { resolution, fps: [fps] };
      } else if (!qualitiesMap[resolution].fps.includes(fps)) {
        qualitiesMap[resolution].fps.push(fps);
      }
    }
  });

  return Object.values(qualitiesMap);
};

const getVideoInfo = async (videoUrl) => {
  try {
    const videoInfo = await youtubedl(videoUrl, {
      dumpSingleJson: true,
    });

    if (!videoInfo || !videoInfo.formats) {
      throw new Error("Unable to retrieve video information");
    }

    const distinctQualities = getDistinctQualities(videoInfo.formats);

    const audioFormats = videoInfo.formats.filter(
      (format) =>
        format.vcodec === "none" && format.acodec !== "none" && format.abr
    );

    const audioQualities = audioFormats.reduce((acc, format) => {
      const codec = format.acodec;
      const bitrate = format.abr;

      const codecEntry = acc.find((entry) => entry.codec === codec);
      if (codecEntry) {
        if (!codecEntry.bitrates.includes(bitrate)) {
          codecEntry.bitrates.push(bitrate);
        }
      } else {
        acc.push({
          codec: codec,
          bitrates: [bitrate],
        });
      }
      return acc;
    }, []);

    return {
      title: videoInfo.title,
      thumbnail: videoInfo.thumbnail,
      qualities: distinctQualities,
      audioQualities: audioQualities,
    };
  } catch (error) {
    throw new Error(
      "Invalid YouTube URL or unable to retrieve video information"
    );
  }
};

module.exports = { getVideoInfo };
