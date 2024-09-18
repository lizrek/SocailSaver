import "./App.css";
import VideoDownloader from "./components/MediaDownloader";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Video Uploader</h1>
      </header>
      <body>
        <VideoDownloader />
      </body>
    </div>
  );
}

export default App;
