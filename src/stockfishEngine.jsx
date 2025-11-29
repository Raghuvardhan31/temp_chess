let engine = null;
let isReady = false;
let initPromise = null;

export function initEngine() {
  if (initPromise) return initPromise;

  initPromise = new Promise((resolve) => {
    if (engine && isReady) {
      resolve(engine);
      return;
    }

    // FIX: Vite-safe worker loading
    engine = new Worker(new URL("/stockfish.js", import.meta.url));

    engine.addEventListener("message", function handler(e) {
      const msg = e.data;
      console.log("ENGINE:", msg);

      if (msg.includes("uciok")) {
        engine.postMessage("isready");
      } else if (msg.includes("readyok")) {
        isReady = true;
        engine.removeEventListener("message", handler);
        resolve(engine);
      }
    });

    engine.postMessage("uci");
  });

  return initPromise;
}

export function getBestMove(fen, callback) {
  initEngine().then(() => {
    engine.postMessage(`position fen ${fen}`);
    engine.postMessage("go depth 12");

    function handler(e) {
      const msg = e.data;

      if (msg.includes("bestmove")) {
        const best = msg.split("bestmove ")[1].split(" ")[0];
        engine.removeEventListener("message", handler);
        callback(best);
      }
    }

    engine.addEventListener("message", handler);
  });
}
