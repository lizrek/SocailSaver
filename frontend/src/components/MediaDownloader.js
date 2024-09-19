import { useState } from "react";
import { videoApi } from "../VideoApi";
import "./MediaDownloader.scss";

const qualityOrder = [
  "1080p",
  "720p",
  "480p",
  "360p",
  "240p",
  "144p",
  "1440p",
  "2160p",
  "4320p",
];

function VideoDownloader() {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedQuality, setSelectedQuality] = useState("");
  const [availableFpsOptions, setAvailableFpsOptions] = useState([]);
  const [selectedFps, setSelectedFps] = useState(30);
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [audioBitrates, setAudioBitrates] = useState([]);
  const [selectedBitrate, setSelectedBitrate] = useState("");

  const validateUrl = (url) => {
    const regex = /^(https?:\/\/)?(www\.youtube\.com|youtu\.be)\/.+$/;
    return regex.test(url);
  };

  const sortQualitiesByPopularity = (qualities) => {
    return qualities.sort((a, b) => {
      const indexA = qualityOrder.indexOf(a.resolution);
      const indexB = qualityOrder.indexOf(b.resolution);

      return (
        (indexA === -1 ? Infinity : indexA) -
        (indexB === -1 ? Infinity : indexB)
      );
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResponseMessage("");
    setVideoInfo(null);
    setSelectedFps(30);
    setIsAudioOnly(false);

    if (!validateUrl(videoUrl)) {
      setError("Invalid YouTube URL.");
      return;
    }

    try {
      const response = await videoApi.getVideoInfo(videoUrl);
      setResponseMessage(JSON.stringify(response.data));

      const sortedQualities = sortQualitiesByPopularity(
        response.data.qualities
      );
      setVideoInfo({ ...response.data, qualities: sortedQualities });

      if (sortedQualities && sortedQualities.length > 0) {
        setSelectedQuality(sortedQualities[0].resolution);
        setAvailableFpsOptions(sortedQualities[0].fps);

        if (sortedQualities[0].fps.includes(30)) {
          setSelectedFps(30);
        } else {
          setSelectedFps(sortedQualities[0].fps[0]);
        }
      }

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

      const audioQualities = response.data.audioQualities
        .filter((quality) => acceptableCodecs.includes(quality.codec))
        .map((quality) => ({
          codec: quality.codec,
          bitrates: quality.bitrates
            .filter((bitrate) => !isNaN(parseFloat(bitrate)))
            .map((bitrate) => parseFloat(bitrate)),
        }));

      const bitrates = audioQualities.flatMap((quality) => quality.bitrates);
      const sortedBitrates = bitrates.sort((a, b) => b - a);
      setAudioBitrates(sortedBitrates);

      if (sortedBitrates.length > 0) {
        setSelectedBitrate(sortedBitrates[0]);
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setResponseMessage(JSON.stringify(err.response.data));
      }
      setError("Error processing the request.");
    }
  };

  const handleQualityChange = (e) => {
    const selected = e.target.value;
    setSelectedQuality(selected);

    const qualityInfo = videoInfo.qualities.find(
      (q) => q.resolution === selected
    );
    if (qualityInfo) {
      setAvailableFpsOptions(qualityInfo.fps);

      if (qualityInfo.fps.includes(30)) {
        setSelectedFps(30);
      } else {
        setSelectedFps(qualityInfo.fps[0]);
      }
    }
  };

  const handleDownload = async () => {
    try {
      let initResponse;
      if (isAudioOnly) {
        initResponse = await videoApi.initDownload(
          videoUrl,
          null,
          null,
          selectedBitrate
        );
      } else {
        const numericQuality = selectedQuality.replace("p", "");
        initResponse = await videoApi.initDownload(
          videoUrl,
          numericQuality,
          selectedFps
        );
      }

      if (initResponse.data.filename) {
        const fileResponse = await videoApi.downloadFile(
          initResponse.data.filename
        );
        const mimeType = isAudioOnly
          ? initResponse.data.filename.endsWith("mp3")
            ? "audio/mp3"
            : "audio/mp4"
          : "video/mp4";
        const blob = new Blob([fileResponse.data], { type: mimeType });
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = initResponse.data.filename;
        link.click();
      }
    } catch (error) {
      console.error("Error downloading the file:", error);
    }
  };

  return (
    <div>
      <h1>Download YouTube Video</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="Enter YouTube video URL"
        />
        <button type="submit">Submit</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {videoInfo && (
        <div>
          <h2>{videoInfo.title}</h2>
          <img
            src={videoInfo.thumbnail}
            alt="Video thumbnail"
            style={{ width: "300px" }}
          />

          <div>
            <input
              type="checkbox"
              id="audioOnlyCheckbox"
              checked={isAudioOnly}
              onChange={(e) => {
                setIsAudioOnly(e.target.checked);
              }}
            />
            <label htmlFor="audioOnlyCheckbox">Audio only</label>
          </div>

          {isAudioOnly ? (
            <div>
              <label htmlFor="bitrateSelect">
                Choose audio quality (bitrate):
              </label>
              <select
                id="bitrateSelect"
                value={selectedBitrate}
                onChange={(e) => setSelectedBitrate(e.target.value)}
              >
                {audioBitrates.map((bitrate) => (
                  <option key={bitrate} value={bitrate}>
                    {bitrate} kbps
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label htmlFor="qualitySelect">Choose video quality:</label>
              <select
                id="qualitySelect"
                value={selectedQuality}
                onChange={handleQualityChange}
              >
                {videoInfo.qualities.map((quality) => (
                  <option key={quality.resolution} value={quality.resolution}>
                    {quality.resolution}
                  </option>
                ))}
              </select>

              <div>
                <label htmlFor="fpsSelect">Choose frame rate (FPS):</label>
                <select
                  id="fpsSelect"
                  value={selectedFps}
                  onChange={(e) => setSelectedFps(parseInt(e.target.value))}
                  disabled={isAudioOnly}
                >
                  {availableFpsOptions.map((fps) => (
                    <option key={fps} value={fps}>
                      {fps} fps
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button onClick={handleDownload}>
            Download {isAudioOnly ? "audio" : "video"}
          </button>
        </div>
      )}
      {responseMessage && (
        <div>
          <h3>Server response:</h3>
          <pre className="server-response-text">{responseMessage}</pre>
        </div>
      )}
    </div>
  );
}

export default VideoDownloader;
