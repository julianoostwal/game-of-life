/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { Button } from "@/components/ui/button";
import {
  DialogHeader,
  DialogFooter,
  DialogClose,
  DialogContent,
  Dialog,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const CELL_SIZE = 20;

const generateEmptyBoard = () => new Map();

export default function Home() {
  const [board, setBoard] = useState(generateEmptyBoard);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(100);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({
    width: 800, // Default values before client-side rendering
    height: 600,
  });

  const [blockColor, setBlockColor] = useState<string>("#00ff00");
  const [boardGridColor, setBoardGridColor] = useState<string>("#000000");
  const [randomizedensity, setRandomizedensity] = useState(0.1);

  const [speedEdit, setSpeedEdit] = useState(speed);
  const [blockColorEdit, setBlockColorEdit] = useState(blockColor);
  const [boardGridColorEdit, setBoardGridColorEdit] = useState(boardGridColor);
  const [randomizedensityEdit, setRandomizedensityEdit] =
    useState(randomizedensity);

  useEffect(() => {
    // Check if window is defined
    if (typeof window !== "undefined") {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight - 100, // Reserve space for buttons
      });

      const handleResize = () => {
        setCanvasSize({
          width: window.innerWidth,
          height: window.innerHeight - 100, // Reserve space for buttons
        });
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

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
      const [row, col] = key.split(",").map(Number);
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (i === 0 && j === 0) continue;
          const neighborKey = `${row + i},${col + j}`;
          neighborCount.set(
            neighborKey,
            (neighborCount.get(neighborKey) || 0) + 1
          );
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

  const randomizeBoard = (density = randomizedensity) => {
    const newBoard = new Map();
    for (let row = -100; row < 100; row++) {
      for (let col = -100; col < 100; col++) {
        if (Math.random() < density) {
          newBoard.set(`${row},${col}`, true);
        }
      }
    }
    setBoard(newBoard);
  };

  const drawBoard = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Get visible area of the canvas
    const cols = Math.ceil(canvas.width / CELL_SIZE);
    const rows = Math.ceil(canvas.height / CELL_SIZE);

    // Draw the grid and cells
    board.forEach((_, key) => {
      const [row, col] = key.split(",").map(Number);
      const x = col * CELL_SIZE;
      const y = row * CELL_SIZE;
      context.fillStyle = blockColor;
      context.fillRect(x, y, CELL_SIZE, CELL_SIZE);
    });

    context.strokeStyle = boardGridColor;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        context.strokeRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  };

  useEffect(() => {
    drawBoard();
  }, [board, canvasSize, blockColor, boardGridColor]);

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setBoard(getNextGeneration());
    }, speed);

    return () => clearInterval(interval);
  }, [running, board, speed]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const row = Math.floor(y / CELL_SIZE);
    const col = Math.floor(x / CELL_SIZE);

    toggleCell(row, col);
  };

  return (
    <main className="bg-gradient-to-r from-sky-700 to-purple-900 mx-auto min-h-screen p-4 relative">
      <Link href="/">
        <Button className="absolute top-4 left-4 z-10">Exit</Button>
      </Link>

      <div className="flex justify-center">
        <TransformWrapper>
          <TransformComponent>
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              onClick={handleCanvasClick}
              className="border-2 border-gray-500"
            />
          </TransformComponent>
        </TransformWrapper>
      </div>

      {/* Control Buttons */}
      <div className="absolute bottom-0 left-0 w-full p-4 bg-opacity-75 bg-black flex justify-center gap-4">
        <Button onClick={() => setRunning(!running)} variant="secondary">
          {running ? "Stop" : "Start"}
        </Button>
        <Button onClick={() => setBoard(generateEmptyBoard())} variant="destructive">
          Reset
        </Button>
        <Button onClick={() => randomizeBoard()} variant="outline" className="text-white">
          Randomize
        </Button>
        <Link href="/play/2d">
          <Button variant="outline" className="text-white">
            2d
          </Button>
        </Link>
        <Link href="/play/3d">
          <Button variant="outline" className="text-white">
            3d
          </Button>
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
                  Delay
                </Label>
                <Slider
                  defaultValue={[speedEdit]}
                  max={1000}
                  min={1}
                  step={1}
                  className="w-64"
                  onValueChange={(value) => setSpeedEdit(value[0])}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="boardSize" className="text-right">
                  Randomize Density
                </Label>
                <Slider
                  defaultValue={[randomizedensityEdit]}
                  max={1}
                  min={0.001}
                  step={0.001}
                  className="w-64"
                  onValueChange={(value) => setRandomizedensityEdit(value[0])}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="blockcolor" className="text-right">
                  Block color
                </Label>
                <input
                  type="color"
                  id="blockcolor"
                  value={blockColorEdit}
                  onChange={(e) => setBlockColorEdit(e.target.value)}
                />
                <Label htmlFor="blockcolor" className="text-right">
                  Grid color
                </Label>
                <input
                  type="color"
                  id="gridcolor"
                  value={boardGridColorEdit}
                  onChange={(e) => setBoardGridColorEdit(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="submit"
                  onClick={() => {
                    setSpeed(speedEdit);
                    setRandomizedensity(randomizedensityEdit);
                    setBlockColor(blockColorEdit);
                    setBoardGridColor(boardGridColorEdit);
                  }}
                >
                  Save changes
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
