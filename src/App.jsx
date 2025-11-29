import React, { useState } from "react";
import ChessBoard from "./ChessBoard";

function App() {
  const [fen, setFen] = useState("start");

  const handleStartPuzzle = () => {
    const fenInput = prompt("Enter FEN:");
    if (fenInput) setFen(fenInput);
  };

  const handlePlay = () => {
    const fenInput = prompt("Enter FEN for play:");
    if (fenInput) setFen(fenInput);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Chess vs Stockfish</h1>
      <button onClick={handleStartPuzzle} style={{ padding: 10 }}>
        Load FEN Puzzle
      </button>
      <button onClick={handlePlay} style={{ padding: 10, marginLeft: 10 }}>
        Play
      </button>

      <ChessBoard initialFen={fen} />

    </div>
  );
}

export default App;
