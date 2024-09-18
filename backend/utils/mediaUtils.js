const youtubedl = require("youtube-dl-exec");

const qualityRegex = /^(\d{3,4}p)(60)?$/;

const getVideoInfo = async (videoUrl) => {
  try {
    const videoInfo = await youtubedl(videoUrl, {
      dumpSingleJson: true,
    });

    if (!videoInfo) {
      throw new Error("Unable to retrieve video information");
    }

    const filteredFormats = videoInfo.formats.filter((format) => {
      const formatNote = format.format_note;
      return qualityRegex.test(formatNote);
    });

    const distinctQualities = Array.from(
      new Set(filteredFormats.map((format) => format.format_note))
    );

    return {
      title: videoInfo.title,
      thumbnail: videoInfo.thumbnail,
      qualities: distinctQualities,
    };
  } catch (error) {
    throw new Error(
      "Invalid YouTube URL or unable to retrieve video information"
    );
  }
};

module.exports = { getVideoInfo };
