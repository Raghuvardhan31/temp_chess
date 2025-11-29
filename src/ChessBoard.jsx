import React, { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { initEngine, getBestMove } from "./stockfishEngine";
import "./index.css";

export default function ChessBoard({ initialFen }) {
  const [game, setGame] = useState(new Chess());
  const [selected, setSelected] = useState(null);
  const [board, setBoard] = useState([]);
  const [engine] = useState(initEngine());

  useEffect(() => {
    const newGame = new Chess();
    if (initialFen !== "start") newGame.load(initialFen);

    setGame(newGame);
    setBoard(newGame.board());
  }, [initialFen]);

  const handleMove = (from, to) => {
    const newGame = new Chess(game.fen());
    const move = newGame.move({ from, to, promotion: "q" });

    if (move) {
      setGame(newGame);
      setBoard(newGame.board());
      stockfishMove(newGame.fen());
    }
  };

  const stockfishMove = (fen) => {
    getBestMove(fen, (bestMove) => {
      if (!bestMove) return;

      const newGame = new Chess(fen);
      newGame.move({
        from: bestMove.substring(0, 2),
        to: bestMove.substring(2, 4),
        promotion: "q",
      });

      setGame(newGame);
      setBoard(newGame.board());
    });
  };

  const handleSquareClick = (r, c) => {
    const square = file(c) + rank(r);

    if (!selected) {
      const piece = game.get(square);
      if (piece) setSelected(square);
    } else {
      handleMove(selected, square);
      setSelected(null);
    }
  };

  const file = (c) => "abcdefgh"[c];
  const rank = (r) => 8 - r;

  const getPieceImage = (piece) => {
    if (!piece) return null;
    // Use Vite's base URL so the path works both in dev ("/") and when deployed
    // with a non-root base (e.g. "/temp_chess/"). import.meta.env.BASE_URL is
    // set by Vite at build time.
    return `${import.meta.env.BASE_URL}pieces/${piece.color}${piece.type.toUpperCase()}.jpg`;
  };

  return (
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
  );
}
