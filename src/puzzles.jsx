import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

function Puzzles() {
  const [checkmates, setCheckmates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCheckmates();
  }, []);

  const fetchCheckmates = async () => {
    // Fetch from public.checkmate
    const { data, error } = await supabase
      .from("checkmate") // no need for schema, defaults to public
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching checkmates:", error);
    } else {
      setCheckmates(data);
    }
    setLoading(false);
  };

  if (loading) return <p>Loading checkmates...</p>;

  return (
    <div>
      <h1>Chess Checkmates</h1>
      {checkmates.length === 0 && <p>No checkmates found.</p>}

      {checkmates.map((item) => (
        <div
          key={item.id}
          style={{ margin: "10px", padding: "10px", border: "1px solid #ccc" }}
        >
          <p><b>ID:</b> {item.id}</p>
          <p><b>FEN:</b> {item.fen}</p>
          <p><b>Type:</b> {item.type}</p>
          <p><b>Difficulty:</b> {item.difficulty_level}</p>
          <p><b>Solution:</b> {item.solution_moves}</p>
          
        </div>
      ))}
    </div>
  );
}

export default Puzzles;
