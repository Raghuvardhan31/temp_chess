import React, { useEffect, useState, useRef } from "react";
import { Chess } from "chess.js";
import { initEngine, getBestMove } from "./stockfishEngine";
import "./ChessBoard.css";

/* -----------------------------------------------
   ⭐ Extract only BOARD PART of FEN (before " w ")
   Example:
     "8/8/1k6/... b KQkq - 0 1"
   → "8/8/1k6/..."
------------------------------------------------- */
function extractBoard(fen) {
  if (!fen) return "";
  return fen.split(" ")[0]; // only board layout
}

export default function ChessBoard({
  id,
  initialFen,
  difficulty_level,
  solution_moves,
  p_moves,
}) {
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
  const puzzleSolvedRef = useRef(false);

  // ⭐ Stores user's last-move FEN
  const [currFen, setCurrFen] = useState(initialFen);
  if (userMoveCountRef.current == p_moves && !puzzleSolvedRef.current) (
          <div style={{ color: "green", fontWeight: "bold" }}> - Boards Match!</div>
        ) 
  /* -----------------------------------------------------------
     ⭐ Update Game Status — NOW uses board-only FEN comparison
  ------------------------------------------------------------ */
  const updateGameStatus = () => {
    const boardUser = extractBoard(currFen);
    const boardSolution = extractBoard(solution_moves);

    console.log("Comparing Board:", boardUser, "VS", boardSolution);

    // ⭐ Puzzle solved check (board only, case insensitive)
    if (
      userMoveCountRef.current == p_moves && !puzzleSolvedRef.current
    ) {
      setGameStatus("Puzzle solved!");
      alert("🎉 Congratulations! You solved the puzzle.");
      setPuzzleSolved(true);
      puzzleSolvedRef.current = true;
      setTimer(0);
      setUserMoveCount(0);
    }

    // Stockfish checkmate detection
    if (game.current.isCheckmate()) {
      const winnerColor = game.current.turn() === "w" ? "b" : "w";
      const winner = winnerColor === userColor ? "You" : "Stockfish";
      setGameStatus(`${winner} won by checkmate!`);
      setTimer(0);
      return;
    }

    if (game.current.isCheck()) {
      const inCheckColor = game.current.turn() === "w" ? "White" : "Black";
      setGameStatus(`${inCheckColor} is in check!`);
      return;
    }

    setGameStatus("");
  };

  /* -----------------------------------------------
     Initialize puzzle
  ----------------------------------------------- */
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

    // Reset currFen for new puzzle
    setCurrFen(initialFen);
  }, [initialFen]);

  /* -----------------------------------------------
     Timer logic
  ----------------------------------------------- */
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  /* -----------------------------------------------
     Helpers
  ----------------------------------------------- */
  const squareFromCoords = (r, c) => {
    const file = "abcdefgh"[c];
    const rank = 8 - r;
    return file + rank;
  };

  /* -----------------------------------------------
     ENGINE MOVE
  ----------------------------------------------- */
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

          setMovesHistory((prev) => [
            ...prev,
            { player: "Stockfish", move: move.san, fen: game.current.fen() },
          ]);

          setIsTimerRunning(true);
        }
      } catch (err) {
        console.error("Stockfish move error:", err);
      }
    });
  };

  /* -----------------------------------------------
     HANDLE USER CLICK
  ----------------------------------------------- */
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
      userMoveCountRef.current += 1;

      setMovesHistory((prev) => [
        ...prev,
        { player: "User", move: move.san, fen: game.current.fen() },
      ]);

      // ⭐ Store new user FEN
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

  /* -----------------------------------------------
     Helpers
  ----------------------------------------------- */
  const getPieceImage = (piece) => {
    if (!piece) return null;
    return `${import.meta.env.BASE_URL}pieces/${piece.color}${piece.type.toUpperCase()}.png`;
  };

  const copyMovesHistory = () => {
    const historyText = `Total User Moves: ${userMoveCount}\n\nMoves:\n${movesHistory
      .map((h) => `${h.player}: ${h.move} (${h.fen})`)
      .join("\n")}`;

    navigator.clipboard.writeText(historyText).then(() => {
      alert("Moves copied!");
    });
  };

  /* -----------------------------------------------
     RENDER
  ----------------------------------------------- */
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
              key={`${r}-${c}`}
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
       
      {/* Moves History */}
      <div className="moves-box">
        <button
          onClick={copyMovesHistory}
          style={{ position: "absolute", top: 5, right: 5, fontSize: 12 }}
        >
          Copy
        </button>

        <div>
          <b>Total User Moves:</b> {userMoveCount}
        </div>

        <div style={{ marginTop: 10 }}>
          <b>Moves History:</b>
        </div>
        <ul style={{ listStyleType: "none", padding: 0 }}>
          {movesHistory.map((entry, index) => (
            <li key={index} style={{ marginBottom: 5 }}>
              {entry.player}: {entry.move} ({entry.fen})
            </li>
          ))}
        </ul>
      </div>

      {/* ⭐ Debug: Show FEN Comparison */}
      <div style={{ marginTop: 20, fontSize: 16 }}>
        <b>Current User Board:</b> {extractBoard(currFen)} <br />
        <b>Solution Board:</b> {extractBoard(solution_moves)}
        
      </div>
      
    </div>
  );
}
