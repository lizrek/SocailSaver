import "./App.scss";
import VideoDownloader from "./components/MediaDownloader";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Video Uploader</h1>
      </header>
      <main>
        <VideoDownloader />
      </main>
    </div>
  );
}

export default App;
