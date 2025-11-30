# TODO for Enabling Play Button in Puzzles

- [x] Update src/App.jsx to manage selectedFen state and pass it to ChessGame
- [x] Update src/ChessGame.jsx to accept initialFen as prop and remove prompts
- [x] Update src/Puzzles.jsx to add Play button that sets selectedFen in App
- [x] Install react-router-dom
- [x] Set up routing in src/main.jsx with BrowserRouter
- [x] Update src/App.jsx to use Routes and Route for / and /game/:fen
- [x] Update src/Puzzles.jsx to use useNavigate for navigation
- [x] Update src/ChessGame.jsx to get fen from URL params
- [x] Add timer to ChessBoard that runs only when user is playing
- [x] Improve mobile UI: center board, remove buttons, make responsive
