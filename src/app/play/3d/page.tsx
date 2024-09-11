/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from '../OrbitControls';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';

// Standaardgrootte van het speelbord
const DEFAULT_BOARD_SIZE = 15;

// Functie om een leeg 3D-bord te genereren als een Map
const generateEmptyBoard = () => new Map<string, boolean>();

export default function Home() {
  // State voor het speelbord, de running status, de bordgrootte, de snelheid en kleuren
  const [board, setBoard] = useState(generateEmptyBoard);
  const [running, setRunning] = useState(false);
  const [BOARD_SIZE, setBoardSize] = useState(DEFAULT_BOARD_SIZE);
  const [speed, setSpeed] = useState(100);
  const [blockColor, setBlockColor] = useState<string>('#00ff00');
  const [boardBackgroundColor, setBoardBackgroundColor] = useState<string>('#000000');
  const [randomizedensity, setRandomizedensity] = useState(0.1);
  const [blockEdges, setBlockEdges] = useState(false);

  const [BOARD_SIZEEdit, setBoardSizeEdit] = useState(BOARD_SIZE);
  const [speedEdit, setSpeedEdit] = useState(speed);
  const [blockColorEdit, setBlockColorEdit] = useState(blockColor);
  const [boardBackgroundColorEdit, setBoardBackgroundColorEdit] = useState(boardBackgroundColor);
  const [blockEdgesEdit, setBlockEdgesEdit] = useState(blockEdges);
  const [randomizedensityEdit, setRandomizedensityEdit] = useState(randomizedensity)

  // Referenties voor de Three.js objecten
  const sceneContainerRef = useRef(null);
  const sceneRef = useRef<any>();
  const cameraRef = useRef<any>();
  const rendererRef = useRef<any>();
  const controlsRef = useRef<any>();
  const boardGroupRef = useRef<any>(new THREE.Group());

  // Initialiseer de Three.js scène en renderer
  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(boardBackgroundColor); // Stel de achtergrondkleur in
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, BOARD_SIZE); // Stel de camerastandpunt in

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    if (sceneContainerRef.current) {
      (sceneContainerRef.current as HTMLElement).appendChild(renderer.domElement);
    }

    // Voeg verlichting toe aan de scène
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.6);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Voeg orbit controls toe om rond de scène te bewegen
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Voeg de groep voor de blokken toe aan de scène
    scene.add(boardGroupRef.current);

    // Voeg sterren toe aan de scène voor een achtergrondeffect
    const stars = new Array(0);
    for (let i = 0; i < 10000; i++) {
      const x = THREE.MathUtils.randFloatSpread(1200);
      const y = THREE.MathUtils.randFloatSpread(1200);
      const z = THREE.MathUtils.randFloatSpread(1200);
      stars.push(x, y, z);
    }
    const starsGeometry = new THREE.BufferGeometry();
    starsGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(stars, 3)
    );
    const starsMaterial = new THREE.PointsMaterial({ color: 0x888888 });
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);

    // Bewaar referenties van de gemaakte objecten
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;

    // Animatielus om de scène continu te renderen
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Opruimen bij het afbreken van het component
    return () => {
      renderer.dispose();
      controls.dispose();
      if (sceneContainerRef.current) {
        sceneContainerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [BOARD_SIZE, boardBackgroundColor]);

  // Reset het bord wanneer de grootte van het bord verandert
  useEffect(() => {
    setRunning(false);
    setBoard(generateEmptyBoard());
  }, [BOARD_SIZE]);

  const createEdges = (geometry: THREE.BoxGeometry) => {
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 }); // Black color
    return new THREE.LineSegments(edges, lineMaterial);
  };


  // Functie om het speelbord bij te werken met blokken in 3D
  const updateBoardVisualization = (newBoard: any) => {
    const boardGroup = boardGroupRef.current;
    boardGroup.clear(); // Verwijder alle huidige blokken

    newBoard.forEach((_: any, key: string) => {
      const [x, y, z] = key.split(',').map(Number); // Voeg de derde dimensie toe

      // Controleer of het blok binnen de grenzen van het bord ligt
      if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE || z < 0 || z >= BOARD_SIZE) {
        return; // Sla blokken over die buiten het bord vallen
      }

      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshStandardMaterial({ color: new THREE.Color(blockColor) });
      const cube = new THREE.Mesh(geometry, material);

      // Voeg edges toe aan de cube
      if (blockEdges) {
        const edges = createEdges(geometry);
        cube.add(edges);
      }

      // Stel de positie van de blokken in zodat ze uitgelijnd zijn met het grid
      cube.position.set(x - BOARD_SIZE / 2 + 0.5, y - BOARD_SIZE / 2 - 0.5, z - BOARD_SIZE / 2 + 0.5);
      boardGroup.add(cube);
    });
  };


// Functie om de volgende generatie van het bord te berekenen in 3D
const getNextGeneration = () => {
  const newBoard = new Map();
  const neighborCount = new Map();

  // Tel het aantal buren voor elke cel
  board.forEach((_, key) => {
    const [x, y, z] = key.split(',').map(Number);
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        for (let k = -1; k <= 1; k++) {
          if (i === 0 && j === 0 && k === 0) continue;
          const neighborKey = `${x + i},${y + j},${z + k}`;
          neighborCount.set(neighborKey, (neighborCount.get(neighborKey) || 0) + 1);
        }
      }
    }
  });

  // Bepaal of een cel blijft bestaan of een nieuwe cel wordt toegevoegd
  neighborCount.forEach((count, key) => {
    if (count === 3 || (count === 2 && board.has(key))) {
      newBoard.set(key, true);
    }
  });

  return newBoard;
};


// Functie om het bord willekeurig te vullen met blokken in 3D
const randomizeBoard = (density = randomizedensity) => {
  const newBoard = new Map();
  for (let x = 0; x < BOARD_SIZE; x++) {
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let z = 0; z < BOARD_SIZE; z++) {
        if (Math.random() < density) {
          newBoard.set(`${x},${y},${z}`, true); // Voeg de Z-coördinaat toe
        }
      }
    }
  }
  setBoard(newBoard);
};


  // Start of stop de simulatie op basis van de "running" status
  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setBoard(getNextGeneration());
    }, speed);

    return () => clearInterval(interval);
  }, [running, board, speed]);

  // Werk de visualisatie bij wanneer het bord verandert
  useEffect(() => {
    updateBoardVisualization(board);
  }, [board, blockColor, blockEdges]);

  return (
    <main className="mx-auto min-h-screen p-4" style={{backgroundColor: boardBackgroundColor}}>
      {/* Scene container waar de Three.js scène wordt weergegeven */}
      <div
        ref={sceneContainerRef}
        className="flex justify-center"
        style={{ width: '100%', height: '80vh' }}
      />

      {/* Bedieningselementen voor de simulatie */}
      <div className="mt-12 flex gap-3 justify-center">
        <Button onClick={() => setRunning(!running)} variant="secondary">
          {running ? 'Stop' : 'Start'}
        </Button>
        <Button onClick={() => setBoard(generateEmptyBoard())} variant="destructive">
          Reset
        </Button>
        <Button onClick={() => randomizeBoard()} variant="outline" className="text-white">
          Randomize
        </Button>
        <Link href="/play">
          <Button variant="outline" className='text-white'>Casual</Button>
        </Link>
        <Link href="/play/2d">
          <Button variant="outline" className='text-white'>2d</Button>
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
                  Board Size
                </Label>
                <Slider
                  defaultValue={[BOARD_SIZEEdit]}
                  max={100}
                  min={5}
                  step={1}
                  className="w-64"
                  onValueChange={(value) => setBoardSizeEdit(value[0])}
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
              </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="edges" checked={blockEdgesEdit} onCheckedChange={(e) => setBlockEdgesEdit(e as boolean)} />
              <label
                htmlFor="edges"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Enable edges
              </label>
            </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="submit" onClick={() => {
                  setSpeed(speedEdit);
                  setBoardSize(BOARD_SIZEEdit);
                  setBlockColor(blockColorEdit);
                  setBoardBackgroundColor(boardBackgroundColorEdit);
                  setRandomizedensity(randomizedensityEdit);
                  setBlockEdges(blockEdgesEdit);
                }}>Save changes</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
