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
  const [timer, setTimer] = useState(0); // Timer in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [userMoveCount, setUserMoveCount] = useState(0);
  const [movesHistory, setMovesHistory] = useState([]);

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
    setIsTimerRunning(true); // Start timer at the beginning of the game
    setUserMoveCount(0);
    setMovesHistory([{ player: 'Initial', move: 'Start', fen: initialFen }]);
  }, [initialFen]);

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    } else if (!isTimerRunning && timer !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  // Convert UI row/column to chess square
  const squareFromCoords = (r, c) => {
    const file = "abcdefgh"[c];
    const rank = 8 - r;
    return file + rank;
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
          setMovesHistory((prev) => [...prev, { player: 'Stockfish', move: move.san, fen: game.current.fen() }]);
          setIsTimerRunning(true); // Start timer for user's turn after Stockfish moves
        }
      } catch (error) {
        console.error("Stockfish invalid move:", error);
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
        setIsTimerRunning(true); // Start timer when user selects a piece
      }
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
      setUserMoveCount((prev) => prev + 1);
      setMovesHistory((prev) => [...prev, { player: 'User', move: move.san, fen: game.current.fen() }]);

      // Check if game is over
      if (game.current.isGameOver()) {
        setIsTimerRunning(false);
        return;
      }

      // Pause timer during Stockfish's turn
      setIsTimerRunning(false);

      // Stockfish plays opposite color (only if engine is ready)
      if (engineReady) {
        setTimeout(() => stockfishMove(game.current.fen()), 250);
      }
    } catch (error) {
      console.error("Invalid move:", error);
      setSelected(null);
    }
  };

  const getPieceImage = (piece) => {
    if (!piece) return null;
    return `${import.meta.env.BASE_URL}pieces/${piece.color}${piece.type.toUpperCase()}.png`;
  };

  const copyMovesHistory = () => {
    const historyText = `Total User Moves: ${userMoveCount}\n\nMoves History:\n${movesHistory.map(entry => `${entry.player}: ${entry.move} (${entry.fen})`).join('\n')}`;
    navigator.clipboard.writeText(historyText).then(() => {
      alert('Moves history copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {!engineReady && <div style={{ marginBottom: 20, fontSize: 18 }}>Initializing Stockfish...</div>}
      <div style={{ marginBottom: 20, fontSize: 24, fontWeight: 'bold' }}>
        Time: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
      </div>
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
      {game.current.isGameOver() && (
        <div style={{ marginTop: 20, fontSize: 18, fontWeight: 'bold' }}>
          Total Time: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
        </div>
      )}
      <div className="moves-box">
        <button onClick={copyMovesHistory} style={{ position: 'absolute', top: 5, right: 5, fontSize: 12 }}>Copy</button>
        <div style={{ fontWeight: 'bold' }}>Total User Moves: {userMoveCount}</div>
        <div style={{ marginTop: 10, fontWeight: 'bold' }}>Moves History:</div>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {movesHistory.map((entry, index) => (
            <li key={index} style={{ marginBottom: 5 }}>
              {entry.player}: {entry.move} ({entry.fen})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
