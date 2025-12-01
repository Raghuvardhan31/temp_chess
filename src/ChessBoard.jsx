import React, { useEffect, useState, useRef } from "react";
import { Chess } from "chess.js";
import { initEngine, getBestMove } from "./stockfishEngine";
import "./ChessBoard.css";

export default function ChessBoard({ id, initialFen, difficulty_level, solution_moves, p_moves }) {
  const game = useRef(new Chess());
  const [selected, setSelected] = useState(null);
  const [board, setBoard] = useState([]);
  const [gameStatus, setGameStatus] = useState("");
  const [userColor, setUserColor] = useState("w");
  const [engineReady, setEngineReady] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [userMoveCount, setUserMoveCount] = useState(0);
  const userMoveCountRef = useRef(0);
  const [movesHistory, setMovesHistory] = useState([]);
  const [puzzleSolved, setPuzzleSolved] = useState(false);

  // ⭐ NEW: currFen state → stores ONLY user's latest move FEN
  const [currFen, setCurrFen] = useState(initialFen);

  // Function to update game status
  const updateGameStatus = () => {
    console.log("Checking solved: userMoveCount =", userMoveCountRef.current, "p_moves =", p_moves, "currFen =", currFen, "solution_moves =", solution_moves, "puzzleSolved =", puzzleSolved);
    if (userMoveCountRef.current == p_moves && currFen === solution_moves && !puzzleSolved) {
      setGameStatus("Puzzle solved!");
      alert("Congratulations! You have solved the puzzle.");
      setTimer(0);
      setPuzzleSolved(true);
    }
    else if (game.current.isCheckmate()) {
      const winnerColor = game.current.turn() === "w" ? "b" : "w";
      const winner = winnerColor === userColor ? "You" : "Stockfish";
      setGameStatus(`${winner} won by checkmate!`);
      console.log(id, initialFen, difficulty_level, solution_moves, p_moves);
      setTimer(0);
    } else if (game.current.isCheck()) {
      const inCheckColor = game.current.turn() === "w" ? "White" : "Black";
      setGameStatus(`${inCheckColor} is in check!`);
    } else {
      setGameStatus("");
    }
    console.log("Fennnnnnnnnnnnnn :", currFen );
  };

  // Initialize engine + load FEN
  useEffect(() => {
    initEngine().then(() => {
      setEngineReady(true);
    });

    const newGame = new Chess();
    if (initialFen !== "start") newGame.load(initialFen);

    game.current = newGame;

    setBoard(newGame.board());
    setSelected(null);
    setGameStatus("");
    updateGameStatus();
    setIsTimerRunning(true);
    setUserMoveCount(0);
    userMoveCountRef.current = 0;
    setMovesHistory([{ player: "Initial", move: "Start", fen: initialFen }]);
    setPuzzleSolved(false);

    // ⭐ Reset currFen when a new puzzle loads
    setCurrFen(initialFen);
  }, [initialFen]);

  // Timer logic
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const squareFromCoords = (r, c) => {
    const file = "abcdefgh"[c];
    const rank = 8 - r;
    return file + rank;
  };

  // Engine move
  const stockfishMove = (fen) => {
    getBestMove(fen, (best) => {
      if (!best || best === "(none)") return;

      const from = best.substring(0, 2);
      const to = best.substring(2, 4);
      const promotion = best.length > 4 ? best[4] : undefined;

      try {
        const move = game.current.move({ from, to, promotion });
        if (move) {
          setBoard(game.current.board());
          updateGameStatus();

          setMovesHistory((prev) => [...prev, { player: "Stockfish", move: move.san, fen: game.current.fen() }]);

          setIsTimerRunning(true);
        }
      } catch (err) {
        console.error("Stockfish move error:", err);
      }
    });
  };

  // Handle user click
  const handleSquareClick = (r, c) => {
    const square = squareFromCoords(r, c);

    if (!selected) {
      const piece = game.current.get(square);
      if (piece && piece.color === game.current.turn()) {
        setSelected(square);
        setIsTimerRunning(true);
      }
      return;
    }

    // User move
    try {
      const move = game.current.move({
        from: selected,
        to: square,
        promotion: "q",
      });

      setSelected(null);
      if (!move) return;

      setBoard(game.current.board());
      setUserMoveCount((prev) => prev + 1);

      setMovesHistory((prev) => [
        ...prev,
        { player: "User", move: move.san, fen: game.current.fen() },
      ]);

      // ⭐ UPDATE currFen ONLY on user's move
      setCurrFen(game.current.fen());

      updateGameStatus();

      if (game.current.isGameOver() || puzzleSolved) {
        setIsTimerRunning(false);
        return;
      }

      setIsTimerRunning(false);

      if (engineReady) {
        setTimeout(() => stockfishMove(game.current.fen()), 250);
      }
    } catch (err) {
      console.error("Invalid move:", err);
      setSelected(null);
    }
  };

  const getPieceImage = (piece) => {
    if (!piece) return null;
    return `${import.meta.env.BASE_URL}pieces/${piece.color}${piece.type.toUpperCase()}.png`;
  };

  const copyMovesHistory = () => {
    const historyText = `Total User Moves: ${userMoveCount}\n\nMoves History:\n${movesHistory
      .map((entry) => `${entry.player}: ${entry.move} (${entry.fen})`)
      .join("\n")}`;

    navigator.clipboard.writeText(historyText).then(() => {
      alert("Moves copied!");
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>

      {/* Timer */}
      <div style={{ marginBottom: 20, fontSize: 24 }}>
        Time: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}
      </div>

      {/* Board */}
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

      {/* Status */}
      {gameStatus && (
        <div style={{ marginTop: 20, fontSize: 18, fontWeight: "bold" }}>
          {gameStatus}
        </div>
      )}

      {/* Moves */}
      <div className="moves-box">
        <button onClick={copyMovesHistory} style={{ position: "absolute", top: 5, right: 5, fontSize: 12 }}>
          Copy
        </button>

        <div><b>Total User Moves:</b> {userMoveCount}</div>

        <div style={{ marginTop: 10 }}><b>Moves History:</b></div>
        <ul style={{ listStyleType: "none", padding: 0 }}>
          {movesHistory.map((entry, index) => (
            <li key={index} style={{ marginBottom: 5 }}>
              {entry.player}: {entry.move} ({entry.fen})
            </li>
          ))}
        </ul>
      </div>

      {/* ⭐ SHOW currFen */}
      <div style={{ marginTop: 20, fontSize: 16 }}>
        <b>Current User FEN:</b> {currFen} <br/>
        <b>Solution    move:</b> {solution_moves}
      </div>
    </div>
  );
}
