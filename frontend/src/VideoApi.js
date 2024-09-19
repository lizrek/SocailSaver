import api from "./ApiClient";

export const videoApi = {
  initDownload: (videoUrl, quality, fps, bitrate) =>
    api.post("/download/init", { videoUrl, quality, fps, bitrate }),

  downloadFile: (filename) =>
    api.get(`/download/${filename}`, { responseType: "blob" }),

  getVideoInfo: (videoUrl) => api.post("/info", { videoUrl }),
};
