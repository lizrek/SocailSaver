import api from "./ApiClient";

export const videoApi = {
  initDownload: (
    videoUrl,
    quality = null,
    fps = null,
    videoFormat = null,
    isVideoOnly = false,
    audioCodec = null,
    bitrate = null
  ) => {
    const requestBody = {
      videoUrl,
      quality,
      fps,
      videoFormat,
      bitrate,
      isVideoOnly,
      audioCodec,
    };

    return api.post("/download/init", requestBody);
  },

  downloadFile: (filename) =>
    api.get(`/download/${filename}`, { responseType: "blob" }),

  getVideoInfo: (videoUrl) => api.post("/info", { videoUrl }),
};
