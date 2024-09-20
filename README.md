# SocailSaver

## Features
- Download videos or audio by providing a media URL.
- Select quality, format, and codec before downloading.
- Backend uses **YouTube-DL** and **FFmpeg** for processing.

## Tech Stack
- **Frontend**: React, SCSS, Axios
- **Backend**: Node.js, Express, youtube-dl-exec, ffmpeg-static

## Installation

### 1. Clone the repository

### 2.Backend Setup

```bash
cd backend
```
```bash
npm install
```
```bash
npm start
```

Backend runs on http://localhost:5000.

Example .env for Backend:
```bash
PORT=5000
```

### 3. Frontend Setup
```bash
cd ../frontend
```
```bash
npm install
```
```bash
npm start
```

Frontend runs on http://localhost:3000.

Example .env for Frontend:
```bash
REACT_APP_API_URL=http://localhost:5000
```

## API Endpoints

- POST /download/init: Initialize a media download.
- GET /download/:filename: Download the file.
- POST /media/info: Fetch media metadata.
