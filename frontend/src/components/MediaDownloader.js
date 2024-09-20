import { useState, useEffect, useCallback } from "react";
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

const codecTranslationMap = {
  "mp4a.40.1": "AAC-LC (Low Complexity)",
  "mp4a.40.2": "AAC Main",
  "mp4a.40.3": "AAC SSR (Scalable Sample Rate)",
  "mp4a.40.4": "AAC LTP (Long Term Prediction)",
  "mp4a.40.5": "HE-AAC (High Efficiency AAC)",
  "mp4a.40.17": "AAC ELD (Enhanced Low Delay)",
  "mp4a.40.29": "HE-AACv2 (AAC+ SBR+PS)",
  mp3: "MP3 (MPEG Layer 3)",
  opus: "Opus",
};

function VideoDownloader() {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedQuality, setSelectedQuality] = useState("");
  const [availableFpsOptions, setAvailableFpsOptions] = useState([]);
  const [selectedFps, setSelectedFps] = useState(30);
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [isVideoOnly, setIsVideoOnly] = useState(false);
  const [audioBitrates, setAudioBitrates] = useState([]);
  const [selectedBitrate, setSelectedBitrate] = useState("");
  const [advancedOptions, setAdvancedOptions] = useState(false);
  const [audioCodecs, setAudioCodecs] = useState([]);
  const [videoFormats, setVideoFormats] = useState([]);
  const [selectedAudioCodec, setSelectedAudioCodec] = useState("");
  const [selectedVideoFormat, setSelectedVideoFormat] = useState("");

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

  const updateBitratesForCodec = useCallback(
    (codec) => {
      if (videoInfo) {
        const selectedAudioQuality = videoInfo.audioQualities.find(
          (quality) => quality.codec === codec
        );

        if (selectedAudioQuality && selectedAudioQuality.bitrates.length > 0) {
          const sortedBitrates = selectedAudioQuality.bitrates
            .filter((bitrate) => !isNaN(bitrate))
            .sort((a, b) => b - a);
          setAudioBitrates(sortedBitrates);
          setSelectedBitrate(sortedBitrates[0]);
        } else {
          setAudioBitrates([]);
          setSelectedBitrate("");
        }
      }
    },
    [videoInfo]
  );

  useEffect(() => {
    if (selectedAudioCodec) {
      updateBitratesForCodec(selectedAudioCodec);
    }
  }, [selectedAudioCodec, updateBitratesForCodec]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResponseMessage("");
    setVideoInfo(null);
    setSelectedFps(30);
    setIsAudioOnly(false);
    setIsVideoOnly(false);

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

      if (!advancedOptions) {
        const audioCodecsCodenames = Object.keys(codecTranslationMap);
        const audioQualities = response.data.audioQualities
          .filter((quality) => audioCodecsCodenames.includes(quality.codec))
          .map((quality) => ({
            codec: quality.codec,
            bitrates: quality.bitrates.filter(
              (bitrate) => !isNaN(parseFloat(bitrate))
            ),
          }));

        const bitrates = audioQualities
          .flatMap((quality) => quality.bitrates)
          .sort((a, b) => b - a);
        setAudioBitrates(bitrates);
        setSelectedBitrate(bitrates[0] || "");
      } else {
        setAudioCodecs(response.data.audioQualities.map((q) => q.codec));

        setVideoFormats(response.data.qualities[0].formats);

        if (response.data.qualities[0].formats.length > 0) {
          setSelectedVideoFormat(response.data.qualities[0].formats[0]);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Error processing the request.");
    }
  };

  const handleAdvancedOptionsChange = () => {
    if (!advancedOptions) {
      setSelectedAudioCodec("");
      setAudioBitrates([]);
      setSelectedVideoFormat("");

      if (videoInfo) {
        const availableAudioCodecs = videoInfo.audioQualities.map(
          (quality) => quality.codec
        );

        if (selectedVideoFormat === "webm") {
          setAudioCodecs(["opus"]);
          setSelectedAudioCodec("opus");
          updateBitratesForCodec("opus");
        } else {
          setAudioCodecs(availableAudioCodecs);

          if (availableAudioCodecs.length > 0) {
            const initialAudioCodec = availableAudioCodecs[0];
            setSelectedAudioCodec(initialAudioCodec);
            updateBitratesForCodec(initialAudioCodec);
          }
        }

        const availableVideoFormats = videoInfo.qualities[0].formats;
        setVideoFormats(availableVideoFormats);
        setSelectedVideoFormat(availableVideoFormats[0]);
      }

      setAdvancedOptions(true);
    } else {
      setAdvancedOptions(false);
      setAudioCodecs([]);
      setAudioBitrates([]);
    }
  };

  const handleVideoFormatSelect = (e) => {
    const selectedFormat = e.target.value;
    setSelectedVideoFormat(selectedFormat);

    if (selectedFormat === "webm") {
      setAudioCodecs(["opus"]);
      setSelectedAudioCodec("opus");
      updateBitratesForCodec("opus");
    } else {
      const availableAudioCodecs = videoInfo.audioQualities.map(
        (quality) => quality.codec
      );
      setAudioCodecs(availableAudioCodecs);

      if (availableAudioCodecs.length > 0) {
        const initialAudioCodec = availableAudioCodecs[0];
        setSelectedAudioCodec(initialAudioCodec);
        updateBitratesForCodec(initialAudioCodec);
      }
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

      setVideoFormats(qualityInfo.formats);
      if (qualityInfo.formats.length > 0) {
        setSelectedVideoFormat(qualityInfo.formats[0]);
      }
    }
  };

  const handleAudioOnlyChange = (e) => {
    setIsAudioOnly(e.target.checked);

    if (e.target.checked) {
      setIsVideoOnly(false);

      if (videoInfo && !advancedOptions) {
        const audioQualities = videoInfo.audioQualities
          .filter(
            (quality) =>
              quality.codec.startsWith("mp4a") || quality.codec === "mp3"
          )
          .map((quality) => ({
            codec: quality.codec,
            bitrates: quality.bitrates.filter(
              (bitrate) => !isNaN(parseFloat(bitrate))
            ),
          }));

        const bitrates = audioQualities
          .flatMap((quality) => quality.bitrates)
          .sort((a, b) => b - a);

        setAudioBitrates(bitrates);

        if (bitrates.length > 0) {
          setSelectedBitrate(bitrates[0]);
        } else {
          setSelectedBitrate("");
        }
      }
    }
  };

  const handleVideoOnlyChange = (e) => {
    setIsVideoOnly(e.target.checked);
    if (e.target.checked) {
      setIsAudioOnly(false);
    }
  };

  const handleAudioCodecChange = (e) => {
    const selectedCodec = e.target.value;
    setSelectedAudioCodec(selectedCodec);

    updateBitratesForCodec(selectedCodec);
  };

  const handleDownload = async () => {
    try {
      let initResponse;

      if (!isAudioOnly && !isVideoOnly && !advancedOptions) {
        const numericQuality = selectedQuality.replace("p", "");
        initResponse = await videoApi.initDownload(
          videoUrl,
          numericQuality,
          selectedFps,
          null,
          false
        );
      } else if (isAudioOnly && !advancedOptions) {
        initResponse = await videoApi.initDownload(
          videoUrl,
          null,
          null,
          null,
          null,
          null,
          selectedBitrate
        );
      } else if (isVideoOnly && !advancedOptions) {
        const numericQuality = selectedQuality.replace("p", "");
        initResponse = await videoApi.initDownload(
          videoUrl,
          numericQuality,
          selectedFps,
          null,
          true
        );
      } else if (!isAudioOnly && !isVideoOnly && advancedOptions) {
        initResponse = await videoApi.initDownload(
          videoUrl,
          selectedQuality.replace("p", ""),
          selectedFps,
          selectedVideoFormat,
          false,
          selectedAudioCodec,
          selectedBitrate
        );
      } else if (isAudioOnly && advancedOptions) {
        initResponse = await videoApi.initDownload(
          videoUrl,
          null,
          null,
          null,
          null,
          selectedAudioCodec,
          selectedBitrate
        );
      } else if (isVideoOnly && advancedOptions) {
        initResponse = await videoApi.initDownload(
          videoUrl,
          selectedQuality.replace("p", ""),
          selectedFps,
          selectedVideoFormat,
          true
        );
      }

      if (initResponse.data.filename) {
        const fileResponse = await videoApi.downloadFile(
          initResponse.data.filename
        );

        const fileExtension = initResponse.data.filename.split(".").pop();

        const mimeTypes = {
          mp4: "video/mp4",
          webm: "video/webm",
          mkv: "video/x-matroska",
          mp3: "audio/mpeg",
          m4a: "audio/m4a",
          opus: "audio/opus",
          ogg: "audio/ogg",
        };

        const mimeType = mimeTypes[fileExtension] || "application/octet-stream";

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
            {!isVideoOnly && (
              <div>
                <input
                  type="checkbox"
                  id="audioOnlyCheckbox"
                  checked={isAudioOnly}
                  onChange={handleAudioOnlyChange}
                />
                <label htmlFor="audioOnlyCheckbox">Audio only</label>
              </div>
            )}

            {!isAudioOnly && (
              <div>
                <input
                  type="checkbox"
                  id="videoOnlyCheckbox"
                  checked={isVideoOnly}
                  onChange={handleVideoOnlyChange}
                />
                <label htmlFor="videoOnlyCheckbox">
                  Download without sound
                </label>
              </div>
            )}

            <div>
              <input
                type="checkbox"
                id="advancedOptionsCheckbox"
                checked={advancedOptions}
                onChange={handleAdvancedOptionsChange}
              />
              <label htmlFor="advancedOptionsCheckbox">Advanced options</label>
            </div>

            {advancedOptions && (
              <div>
                {!isVideoOnly && (
                  <>
                    <div>
                      <label htmlFor="audioCodecSelect">
                        Choose audio codec:
                      </label>
                      <select
                        id="audioCodecSelect"
                        value={selectedAudioCodec}
                        onChange={handleAudioCodecChange}
                      >
                        {audioCodecs.map((codec) => (
                          <option key={codec} value={codec}>
                            {codecTranslationMap[codec] || codec}{" "}
                          </option>
                        ))}
                      </select>
                    </div>

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
                  </>
                )}

                {!isAudioOnly && (
                  <div>
                    <label htmlFor="videoFormatSelect">
                      Choose video format:
                    </label>
                    <select
                      id="videoFormatSelect"
                      value={selectedVideoFormat}
                      onChange={handleVideoFormatSelect}
                    >
                      {videoFormats.map((format) => (
                        <option key={format} value={format}>
                          {format}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {!advancedOptions && isAudioOnly && (
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
            )}

            {!isAudioOnly && (
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
              Download{" "}
              {isAudioOnly
                ? "audio"
                : isVideoOnly
                ? "video without sound"
                : "video"}
            </button>
          </div>
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
