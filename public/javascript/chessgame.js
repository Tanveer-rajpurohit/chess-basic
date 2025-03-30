const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";

    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add("square", (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark");
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", square.color === 'w' ? "white" : "black");
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener('dragstart', (e) => {
                    draggedPiece = pieceElement;
                    sourceSquare = { row: rowIndex, col: squareIndex };
                    e.dataTransfer.setData("text/plain", "");
                });

                pieceElement.addEventListener('dragend', () => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                const target = e.target.closest('.square');
                if (draggedPiece && target) {
                    const targetSquare = {
                        row: parseInt(target.dataset.row),
                        col: parseInt(target.dataset.col)
                    };
                    handleMove(sourceSquare, targetSquare);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });

    if (playerRole === 'b') {
        boardElement.classList.add('flipped');
    } else {
        boardElement.classList.remove('flipped');
    }
};

const handleMove = (source, target) => {

    if (chess.in_checkmate() || chess.in_stalemate()) {
        console.log("Game over. Cannot make any moves.");
        return;
    }
    // Prevent moving to the same square
    if (source.row === target.row && source.col === target.col) {
        // console.log("Invalid move: Piece dropped in the same square");
        return;
    }

    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
    };

    // Check for pawn promotion
    if (chess.get(`${move.from}`).type === 'p' && (move.to.endsWith('8') || move.to.endsWith('1'))) {
        move.promotion = 'q'; // Promote to Queen
    }

    const result = chess.move(move);
    if (result) {
        socket.emit("move", move);
    } else {
        console.log("Invalid move:", move);
    }
};

const getPieceUnicode = (piece) => {
    const pieceUnicodeMap = {
        p: "♟", // Black Pawn
        r: "♜", // Black Rook
        n: "♞", // Black Knight
        b: "♝", // Black Bishop
        q: "♛", // Black Queen
        k: "♚", // Black King
        P: "♙", // White Pawn
        R: "♖", // White Rook
        N: "♘", // White Knight
        B: "♗", // White Bishop
        Q: "♕", // White Queen
        K: "♔"  // White King
    };
    return pieceUnicodeMap[piece.type] || '';
};

// Socket event listeners
socket.on('playerRole', (role) => {
    playerRole = role;
    renderBoard();
});

socket.on('spectatorRole', () => {
    playerRole = null;
    renderBoard();
});

socket.on("boardState", (fen) => {
    chess.load(fen);
    renderBoard();
});

socket.on("move", (move) => {
    chess.move(move);
    renderBoard();
});

// Initial render
renderBoard();
