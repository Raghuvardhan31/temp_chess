import React, { useEffect, useState, useRef } from "react";
import { Chess } from "chess.js";
import { initEngine, getBestMove } from "./stockfishEngine";
import "./ChessBoard.css";

export default function ChessBoard({ initialFen }) {
  const game = useRef(new Chess());
  const [selected, setSelected] = useState(null);
  const [board, setBoard] = useState([]);
  const [gameStatus, setGameStatus] = useState("");
  const [userColor, setUserColor] = useState('w'); // Assume user is white by default
  const [engineReady, setEngineReady] = useState(false);

  // Function to update game status
  const updateGameStatus = () => {
    if (game.current.isCheckmate()) {
      const winnerColor = game.current.turn() === 'w' ? 'b' : 'w';
      const winner = winnerColor === userColor ? 'You' : 'Stockfish';
      setGameStatus(`${winner} won by checkmate!`);
    } else if (game.current.isDraw()) {
      setGameStatus("Game is a draw!");
    } else if (game.current.isCheck()) {
      const inCheckColor = game.current.turn() === 'w' ? 'White' : 'Black';
      setGameStatus(`${inCheckColor} is in check!`);
    } else {
      setGameStatus("");
    }
  };

  // Initialize engine and load initial FEN
  useEffect(() => {
    initEngine().then(() => {
      setEngineReady(true);
    });

    const newGame = new Chess();

    if (initialFen !== "start") {
      newGame.load(initialFen);
    }

    game.current = newGame;
    setBoard(game.current.board());
    setSelected(null);
    setGameStatus("");
    updateGameStatus();
  }, [initialFen]);

  // Convert UI row/column to chess square
  const squareFromCoords = (r, c) => {
    const file = "abcdefgh"[c];
    const rank = 8 - r;
    return file + rank;
  };

  // Handle user click
  const handleSquareClick = (r, c) => {
    const square = squareFromCoords(r, c);

    if (!selected) {
      const piece = game.current.get(square);
      if (piece && piece.color === game.current.turn()) setSelected(square);
      return;
    }

    // Try move
    try {
      const move = game.current.move({
        from: selected,
        to: square,
        promotion: "q",
      });

      setSelected(null);

      if (!move) return; // illegal

      setBoard(game.current.board());
      updateGameStatus();

      // Check if game is over
      if (game.current.isGameOver()) return;

      // Stockfish plays opposite color (only if engine is ready)
      if (engineReady) {
        setTimeout(() => stockfishMove(game.current.fen()), 250);
      }
    } catch (error) {
      console.error("Invalid move:", error);
      setSelected(null);
    }
  };

  // Engine move
  const stockfishMove = (fen) => {
    getBestMove(fen, (best) => {
      if (!best || best === "(none)") return;

      console.log("Stockfish move:", best);

      const from = best.substring(0, 2);
      const to = best.substring(2, 4);
      const promotion = best.length > 4 ? best[4] : undefined;

      try {
        const move = game.current.move({
          from,
          to,
          promotion,
        });

        if (move) {
          setBoard(game.current.board());
          updateGameStatus();
        }
      } catch (error) {
        console.error("Stockfish invalid move:", error);
      }
    });
  };

  const getPieceImage = (piece) => {
    if (!piece) return null;
    return `${import.meta.env.BASE_URL}pieces/${piece.color}${piece.type.toUpperCase()}.png`;
  };

  return (
    <div>
      {!engineReady && <div style={{ marginBottom: 20, fontSize: 18 }}>Initializing Stockfish...</div>}
      <div className="board">
        {board.map((row, r) =>
          row.map((piece, c) => (
            <div
              key={r + "-" + c}
              className={`square ${(r + c) % 2 === 0 ? "white" : "black"}`}
              onClick={() => handleSquareClick(r, c)}
            >
              {piece && (
                <img src={getPieceImage(piece)} alt="" className="piece" />
              )}
            </div>
          ))
        )}
      </div>
      {gameStatus && <div style={{ marginTop: 20, fontSize: 18, fontWeight: 'bold' }}>{gameStatus}</div>}
    </div>
  );
}
