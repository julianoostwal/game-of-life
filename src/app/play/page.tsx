'use client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { VariableSizeGrid as Grid } from 'react-window';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

const DEFAULT_BOARD_SIZE = 200;

const generateEmptyBoard = () => new Map();

export default function Home() {
  const [board, setBoard] = useState(generateEmptyBoard);
  const [running, setRunning] = useState(false);
  const [BOARD_SIZE, setBoardSize] = useState(DEFAULT_BOARD_SIZE);
  const [speed, setSpeed] = useState(100);
  // const [blockColor, setBlockColor] = useState<string>('#00ff00');
  // const [boardGridColor, setBoardGridColor] = useState<string>('#ffffff');
  // const [boardBackgroundColor, setBoardBackgroundColor] = useState<string>('#000000');  

  const [BOARD_SIZEEdit, setBoardSizeEdit] = useState(BOARD_SIZE);
  const [speedEdit, setSpeedEdit] = useState(speed);
  // const [blockColorEdit, setBlockColorEdit] = useState(blockColor);
  // const [boardGridColorEdit, setBoardGridColorEdit] = useState(boardGridColor);
  // const [boardBackgroundColorEdit, setBoardBackgroundColorEdit] = useState(boardBackgroundColor);

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

  const randomizeBoard = (density = 0.1) => {
    const newBoard = new Map();
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (Math.random() < density) {
          newBoard.set(`${row},${col}`, true);
        }
      }
    }
    setBoard(newBoard);
  };

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setBoard(getNextGeneration());
    }, speed);

    return () => clearInterval(interval);
  }, [running, board]);

  return (
    <main className="bg-gradient-to-r from-sky-700 to-purple-900  mx-auto min-h-screen p-4">

      <Link href="/">
      <Button>Exit</Button>
      </Link>

      <div className='flex justify-center'>
        <TransformWrapper>
          <TransformComponent>
            <Grid
              columnCount={BOARD_SIZE}
              rowCount={BOARD_SIZE}
              columnWidth={() => 15}
              rowHeight={() => 15}
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
      <div className="mt-4 flex gap-3 justify-center text-white">
        <Button onClick={() => setRunning(!running)} variant="outline">
          {running ? 'Stop' : 'Start'}
        </Button>
        <Button onClick={() => setBoard(generateEmptyBoard())} variant="destructive">
          Reset
        </Button>
        <Button onClick={() => randomizeBoard()} variant="outline" className='text-white'>
          Randomize
        </Button>
        <Link href="/play/3d">
          <Button variant="outline" className='text-white'>3D</Button>
        </Link>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="text-white">
              Settings
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-white">
            <DialogHeader>
              <DialogTitle>Settings</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="speed" className="text-right">
                  Speed
                </Label>
                <Slider
                  defaultValue={[speed]}
                  max={1000}
                  min={1}
                  step={1}
                  className="w-96"
                  onValueChange={(value) => setSpeedEdit(value[0])}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="boardSize" className="text-right">
                  Board Size
                </Label>
                <Slider
                  defaultValue={[BOARD_SIZE]}
                  max={1000}
                  min={1}
                  step={1}
                  className="w-96"
                  onValueChange={(value) => setBoardSizeEdit(value[0])}
                />
              </div>
              {/* <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="bgcolor" className="text-right">
                  Background color
                </Label>
                <input
                  type="color"
                  id="bgcolor"
                  value={boardBackgroundColorEdit}
                  onChange={(e) => setBoardBackgroundColorEdit(e.target.value)}
                />
                <Label htmlFor="blockcolor" className="text-right">
                  Block color
                </Label>
                <input
                  type="color"
                  id="blockcolor"
                  value={blockColorEdit}
                  onChange={(e) => setBlockColorEdit(e.target.value)}
                />
                  <Label htmlFor="blockcolor" className="text-right">Grid color</Label>
                <input
                  type="color"
                  id="gridcolor"
                  value={boardGridColorEdit}
                  onChange={(e) => setBoardGridColorEdit(e.target.value)}
                />
              </div> */}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="submit" onClick={() => {
                  setSpeed(speedEdit);
                  setBoardSize(BOARD_SIZEEdit);
                  // setBlockColor(blockColorEdit);
                  // setBoardGridColor(boardGridColorEdit);
                  // setBoardBackgroundColor(boardBackgroundColorEdit);
                }}>Save changes</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}