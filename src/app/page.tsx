'use client';
import { useState, useEffect } from 'react';

const BOARD_SIZE = 50; // 25x25 grid

const generateEmptyBoard = () =>
  Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(false));

  export default function Home() {

  const [board, setBoard] = useState(generateEmptyBoard);
  const [running, setRunning] = useState(false);

  const toggleCell = (row, col) => {
    const newBoard = board.map((r, i) =>
      r.map((cell, j) => (i === row && j === col ? !cell : cell))
    );
    setBoard(newBoard);
  };

  const getNextGeneration = () => {
    const newBoard = generateEmptyBoard();
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const neighbors = getAliveNeighbors(row, col);
        if (board[row][col]) {
          newBoard[row][col] = neighbors === 2 || neighbors === 3;
        } else {
          newBoard[row][col] = neighbors === 3;
        }
      }
    }
    return newBoard;
  };

  const getAliveNeighbors = (row, col) => {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        const newRow = row + i;
        const newCol = col + j;
        if (
          newRow >= 0 &&
          newRow < BOARD_SIZE &&
          newCol >= 0 &&
          newCol < BOARD_SIZE &&
          board[newRow][newCol]
        ) {
          count++;
        }
      }
    }
    return count;
  };

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setBoard(getNextGeneration());
    }, 500);

    return () => clearInterval(interval);
  }, [running, board]);

    return (
      <main className="container mx-auto min-h-screen p-4">
      <div>
      <div className="grid grid-cols-50 gap-0.5">
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                onClick={() => toggleCell(rowIndex, colIndex)}
                className={`w-4 h-4 ${
                  cell ? 'bg-green-500' : 'bg-gray-300'
                } border border-gray-400`}
              />
            ))
          )}
        </div>
        <div className="mt-4">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded"
            onClick={() => setRunning(!running)}
          >
            {running ? 'Stop' : 'Start'}
          </button>
          <button
            className="ml-2 bg-red-500 hover:bg-red-700 text-white py-2 px-4 rounded"
            onClick={() => setBoard(generateEmptyBoard())}
          >
            Reset
          </button>
        </div>
      </div>
      </main>
    );
  }