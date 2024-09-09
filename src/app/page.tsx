'use client';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { VariableSizeGrid as Grid } from 'react-window';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

const BOARD_SIZE = 1000;

const generateEmptyBoard = () => new Map();

export default function Home() {
  const [board, setBoard] = useState(generateEmptyBoard);
  const [running, setRunning] = useState(false);

  const toggleCell = (row: number, col: number) => {
    const newBoard = new Map(board);
    const cellKey = `${row},${col}`;
    if (newBoard.has(cellKey)) {
      newBoard.delete(cellKey);
    } else {
      newBoard.set(cellKey, true);
    }
    setBoard(newBoard);
  };

  const getNextGeneration = () => {
    const newBoard = new Map();
    const neighborCount = new Map();

    board.forEach((_, key) => {
      const [row, col] = key.split(',').map(Number);
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (i === 0 && j === 0) continue;
          const neighborKey = `${row + i},${col + j}`;
          neighborCount.set(neighborKey, (neighborCount.get(neighborKey) || 0) + 1);
        }
      }
    });

    neighborCount.forEach((count, key) => {
      if (count === 3 || (count === 2 && board.has(key))) {
        newBoard.set(key, true);
      }
    });

    return newBoard;
  };

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setBoard(getNextGeneration());
    }, 100);

    return () => clearInterval(interval);
  }, [running, board]);

  return (
    <main className="container mx-auto min-h-screen p-4">
      <div className='flex justify-center'>
        <TransformWrapper>
          <TransformComponent>
            <Grid
              columnCount={BOARD_SIZE}
              rowCount={BOARD_SIZE}
              columnWidth={() => 18}
              rowHeight={() => 18}
              width={1200}
              height={700}
            >
              {({ columnIndex, rowIndex, style }) => (
                <div
                  style={style}
                  onClick={() => toggleCell(rowIndex, columnIndex)}
                  className={`border ${
                    board.has(`${rowIndex},${columnIndex}`) ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              )}
            </Grid>
          </TransformComponent>
        </TransformWrapper>
        </div>
        <div className="mt-4 flex gap-3">
          <Button onClick={() => setRunning(!running)} variant="outline">
            {running ? 'Stop' : 'Start'}
          </Button>
          <Button
            onClick={() => setBoard(generateEmptyBoard())}
            variant='destructive'
          >
            Reset
          </Button>
        </div>
    </main>
  );
}
