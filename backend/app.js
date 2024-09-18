const express = require("express");
const cors = require("cors");
const mediaInfoRoute = require("./routes/mediaInfoRoute");
const mediaDownloadRotes = require("./routes/mediaDownloadRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", mediaInfoRoute);
app.use("/api", mediaDownloadRotes);

module.exports = app;
