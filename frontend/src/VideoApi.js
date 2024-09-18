import api from "./ApiClient";

export const videoApi = {
  initDownload: (videoUrl, quality) =>
    api.post("/download/init", { videoUrl, quality }),
  downloadFile: (filename) =>
    api.get(`/download/${filename}`, { responseType: "blob" }),
  getVideoInfo: (videoUrl) => api.post("/info", { videoUrl }),
};
