import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ChessBoard from "./ChessBoard";

function ChessGame() {
  const { fen: urlFen } = useParams();
  const [fen, setFen] = useState("start");

  useEffect(() => {
    if (urlFen) {
      setFen(decodeURIComponent(urlFen));
    }
  }, [urlFen]);

  const handleStartPuzzle = () => {
    const fenInput = prompt("Enter FEN:");
    if (fenInput) setFen(fenInput);
  };

  const handlePlay = () => {
    const fenInput = prompt("Enter FEN for play:");
    if (fenInput) setFen(fenInput);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 20 }}>
      <ChessBoard initialFen={fen} />
    </div>
  );
}

export default ChessGame;
