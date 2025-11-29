let engine = null;

export function initEngine() {
  engine = new Worker("/stockfish.js");

  return engine;
}

export function getBestMove(fen, callback) {
  engine.postMessage("position fen " + fen);
  engine.postMessage("go depth 12");

  engine.onmessage = (e) => {
    const line = e.data;

    if (line.includes("bestmove")) {
      const move = line.split("bestmove ")[1].split(" ")[0];
      callback(move);
    }
  };
}
