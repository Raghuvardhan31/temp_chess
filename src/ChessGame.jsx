import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "./supabaseClient";
import ChessBoard from "./ChessBoard";

function ChessGame() {
  const { id: urlId } = useParams();
  const location = useLocation();
  const [fen, setFen] = useState("start");
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Determine puzzle type from URL path
  const puzzleType = location.pathname.startsWith("/checkmate") ? "checkmate" : "enprice";

  useEffect(() => {
    if (urlId) {
      fetchPuzzleById(urlId, puzzleType);
    }
  }, [urlId, puzzleType]);

  const fetchPuzzleById = async (id, type) => {
    setLoading(true);
    const { data, error } = await supabase
      .from(type)
      .select("*")
      .eq("id", parseInt(id))
      .single();

    if (error) {
      console.error("Error fetching puzzle:", error);
      setLoading(false);
      return;
    }

    setCurrentPuzzle(data);
    setFen(data.fen);
    setLoading(false);
  };

  const handleNext = () => {
    if (currentPuzzle) {
      const nextId = parseInt(currentPuzzle.id) + 1;
      navigate(`/${puzzleType}/${nextId}`);
    }
  };

  const handleBack = () => {
    navigate("/", { replace: true });
  };

  return (
    <div 
      style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh', 
        padding: 20,
        position: "relative"
      }}
    >

      {/* 🔵 BACK BUTTON */}
      <button
        onClick={handleBack}
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: 5,
          cursor: 'pointer',
          zIndex: 1000
        }}
      >
        Back
      </button>

      {/* 🟢 NEXT BUTTON */}
      <button
        onClick={handleNext}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          padding: '10px 20px',
          backgroundColor: 'green',
          color: 'white',
          border: 'none',
          borderRadius: 5,
          cursor: 'pointer',
          zIndex: 1000
        }}
      >
        Next
      </button>

      <ChessBoard initialFen={fen} />
    </div>
  );
}

export default ChessGame;
