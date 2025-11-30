import React from 'react'
import { Routes, Route } from 'react-router-dom'
import ChessGame from './ChessGame.jsx'
import Puzzles from './Puzzles.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Puzzles />} />
      <Route path="/game/:fen" element={<ChessGame />} />
    </Routes>
  )
}

export default App
