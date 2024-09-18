import api from "./ApiClient";

export const videoApi = {
  initDownload: (videoUrl) => api.post("/download/init", { videoUrl }),
  downloadFile: (filename) =>
    api.get(`/download/${filename}`, { responseType: "blob" }),
  getVideoInfo: (videoUrl) => api.post("/info", { videoUrl }),
};
