import { useState } from "react";
import { videoApi } from "../VideoApi";

function VideoDownloader() {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedQuality, setSelectedQuality] = useState("");

  const validateUrl = (url) => {
    const regex = /^(https?:\/\/)?(www\.youtube\.com|youtu\.be)\/.+$/;
    return regex.test(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResponseMessage("");
    setVideoInfo(null);

    if (!validateUrl(videoUrl)) {
      setError("Invalid YouTube URL.");
      return;
    }

    try {
      const response = await videoApi.getVideoInfo(videoUrl);
      setResponseMessage(JSON.stringify(response.data));
      setVideoInfo(response.data);
      if (response.data.formats && response.data.formats.length > 0) {
        setSelectedQuality(response.data.qualities[0]);
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setResponseMessage(JSON.stringify(err.response.data));
      }
      setError("Error processing the request.");
    }
  };

  const handleDownload = async () => {
    try {
      const numericQuality = selectedQuality.replace("p", "");
      const initResponse = await videoApi.initDownload(
        videoUrl,
        numericQuality
      );

      if (initResponse.data.filename) {
        const fileResponse = await videoApi.downloadFile(
          initResponse.data.filename
        );
        const blob = new Blob([fileResponse.data], { type: "video/mp4" });

        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = initResponse.data.filename;
        link.click();
      }
    } catch (error) {
      console.error("Error downloading the video:", error);
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
          {videoInfo.qualities && (
            <div>
              <label htmlFor="qualitySelect">Choose video quality:</label>
              <select
                id="qualitySelect"
                value={selectedQuality}
                onChange={(e) => setSelectedQuality(e.target.value)}
              >
                {videoInfo.qualities.map((quality) => (
                  <option key={quality} value={quality}>
                    {quality}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button onClick={handleDownload}>Download video</button>
        </div>
      )}
      {responseMessage && (
        <div>
          <h3>Server response:</h3>
          <pre>{responseMessage}</pre>
        </div>
      )}
    </div>
  );
}

export default VideoDownloader;
