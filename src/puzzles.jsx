import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

function Puzzles() {
  const navigate = useNavigate();
  const [checkmates, setCheckmates] = useState([]);
  const [enprice, setEnprice] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("checkmate");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: cmData } = await supabase
      .from("checkmate")
      .select("*")
      .order("id", { ascending: true });
    setCheckmates(cmData || []);

    const { data: enData } = await supabase
      .from("enprice")
      .select("*")
      .order("id", { ascending: true });
    setEnprice(enData || []);

    setLoading(false);
  };

  if (loading) return <p>Loading Puzzles...</p>;

  const currentList = selected === "checkmate" ? checkmates : enprice;

  return (
    <div>
      <h1>Chess Puzzles</h1>

      {/* Dropdown */}
      <label><b>Select Puzzle Type: </b></label>
      <select value={selected} onChange={(e) => setSelected(e.target.value)}>
        <option value="checkmate">Checkmate Puzzles</option>
        <option value="enprice">Enprice Puzzles</option>
      </select>

      <h3 style={{ marginTop: "15px" }}>
        Total Puzzles: {currentList.length}
      </h3>

      {/* Display all puzzles */}
      <div style={{ marginTop: "15px" }}>
        {currentList.map((puzzle, i) => (
          <div
            key={puzzle.id}
            style={{
              border: "1px solid #aaa",
              padding: "12px",
              marginBottom: "12px",
              background: "#f9f9f9",
              borderRadius: "6px",
              width: "350px"
            }}
          >
            <p><b>ID:</b> {puzzle.id}</p>
            <p><b>FEN:</b> {puzzle.fen}</p>
            <p><b>Difficulty:</b> {puzzle.difficulty_level}</p>
            <p><b>Solution:</b> {puzzle.solution_moves}</p>

            <button
              onClick={() => navigate(`/${selected}/${puzzle.id}`)}
              style={{
                padding: "6px 12px",
                background: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              Play
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Puzzles;
