/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
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
// import { gsap } from "gsap";
import FPSStats from 'react-fps-stats';


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
  const [boardOutline, setBoardOutline] = useState(true);
  const [boardOutlineColor, setBoardOutlineColor] = useState<string>('#ffffff');

  // State voor de bewerkbare instelling
  const [BOARD_SIZEEdit, setBoardSizeEdit] = useState(BOARD_SIZE);
  const [speedEdit, setSpeedEdit] = useState(speed);
  const [blockColorEdit, setBlockColorEdit] = useState(blockColor);
  const [boardBackgroundColorEdit, setBoardBackgroundColorEdit] = useState(boardBackgroundColor);
  const [blockEdgesEdit, setBlockEdgesEdit] = useState(blockEdges);
  const [randomizedensityEdit, setRandomizedensityEdit] = useState(randomizedensity)
  const [boardOutlineEdit, setBoardOutlineEdit] = useState(boardOutline);
  const [boardOutlineColorEdit, setBoardOutlineColorEdit] = useState(boardOutlineColor);

  // Referenties voor de Three.js objecten
  const sceneContainerRef = useRef<any>(null);
  const sceneRef = useRef<any>();
  const cameraRef = useRef<any>();
  const rendererRef = useRef<any>();
  const controlsRef = useRef<any>();
  const boardGroupRef = useRef<any>(new THREE.Group());

  // Initialiseer de Three.js scène en renderer
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(boardBackgroundColor); // Stel de achtergrondkleur in
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, BOARD_SIZE * 1.5); // Stel de camerastandpunt in

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
    const controls = new OrbitControls(camera, renderer.domElement as any);
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

  // Functie om randen rond het hele bord te maken
  const createBoardOutline = () => {
    const outlineGeometry = new THREE.BoxGeometry(BOARD_SIZE, BOARD_SIZE, BOARD_SIZE);
    const outlineEdges = new THREE.EdgesGeometry(outlineGeometry);
    const outlineMaterial = new THREE.LineBasicMaterial({ color: boardOutlineColor});
    const outline = new THREE.LineSegments(outlineEdges, outlineMaterial);
    outline.position.set(0, 0, 0);

    return outline;
  };


  // Functie om het speelbord bij te werken met blokken in 3D
  const updateBoardVisualization = (
    newBoard: any,
    disappearingBlocks: string[]
  ) => {
    const boardGroup = boardGroupRef.current;
    boardGroup.clear(); // Verwijder alle huidige blokken

    // Voeg de bordomtrek toe als deze is ingeschakeld
    if (boardOutline) {
      const boardOutline2 = createBoardOutline();
      boardGroup.add(boardOutline2);
    }

    newBoard.forEach((_: any, key: string) => {
      const [x, y, z] = key.split(',').map(Number);

      // Controleer of het blok binnen de grenzen van het bord ligt
      if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE || z < 0 || z >= BOARD_SIZE) {
        return  newBoard.delete(key);
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
      cube.position.set(x - BOARD_SIZE / 2 + 0.5, y - BOARD_SIZE / 2 + 0.5, z - BOARD_SIZE / 2 + 0.5);
      boardGroup.add(cube);

      // Als dit blok in de lijst van verdwijnende blokken staat, voer dan de animatie uit
      // if (disappearingBlocks.includes(key)) {
      //   gsap.to(cube.rotation, {
      //     y: "-4", // Draai 4 radianen over de y-as
      //     duration: speed / 1000 / 2, // Duur van de animatie in seconden
      //     delay: speed / 1000 / 2,
      //     repeat: -1, // Oneindig herhalen
      //     ease: "none", // Geen vertraging of versnelling
      //     yoyo: true,
      //   });

      //   gsap.to(cube.scale, {
      //     x: 0, // Schaal op de x-as naar 0
      //     y: 0, // Schaal op de y-as naar 0
      //     z: 0, // Schaal op de z-as naar 0
      //     duration: speed / 1000 / 2, // Duur van de krimp-animatie
      //     delay: speed / 1000 / 2, // Wacht totdat de animatie klaar is
      //     onComplete: () => {
      //       // Verwijder het blok uit de scene als de animatie klaar is
      //       // boardGroupRef.current.remove(cube);
      //     },
      //   });
      // }
    });
  };


  // Functie om de volgende generatie van het bord te berekenen in 3D
  const getNextGeneration = () => {
    const newBoard = new Map();
    const disappearingBlocks: string[] = [];
    const neighborCount = new Map();

    // Tel het aantal buren voor elke cel
    board.forEach((_, key) => {
      const [x, y, z] = key.split(",").map(Number);
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          for (let k = -1; k <= 1; k++) {
            if (i === 0 && j === 0 && k === 0) continue;
            const neighborKey = `${x + i},${y + j},${z + k}`;
            neighborCount.set(
              neighborKey,
              (neighborCount.get(neighborKey) || 0) + 1
            );
          }
        }
    }
  });

  // Bepaal of een cel blijft bestaan of een nieuwe cel wordt toegevoegd
  neighborCount.forEach((count, key) => {
    if (count === 3 || (count === 2 && board.has(key))) {
      newBoard.set(key, true);
    } else if (board.has(key)) {
      disappearingBlocks.push(key); // Dit blok verdwijnt
    }
  });



  return { newBoard, disappearingBlocks };
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
    updateBoardVisualization(newBoard, []);
  };

  // Start of stop de simulatie op basis van de "running" status
  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      const { newBoard, disappearingBlocks } = getNextGeneration();
      setBoard(newBoard);
      updateBoardVisualization(newBoard, disappearingBlocks);
    }, speed);

    return () => clearInterval(interval);
  }, [running, board, speed]);

  // Effect om het bord visueel bij te werken wanneer de staat verandert
  useEffect(() => {
    updateBoardVisualization(board, []);
  }, [blockColor, boardOutline, blockEdges, boardOutlineColor]);

  return (
    <main className="mx-auto min-h-screen p-4" style={{backgroundColor: boardBackgroundColor}}>
      <div
        ref={sceneContainerRef}
        className="flex justify-center"
        style={{ width: '100%', height: '80vh' }}
      />
      <div>
        <FPSStats top={0} right={0} left="auto" />
      </div>

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
            <Label htmlFor="board-size">Board Size: {BOARD_SIZEEdit}</Label>
            <Slider
              value={[BOARD_SIZEEdit]}
              onValueChange={(value) => setBoardSizeEdit(value[0])}
              min={10}
              max={30}
              step={1}
            />

            <Label htmlFor="speed">Speed: {speedEdit} ms</Label>
            <Slider
              value={[speedEdit]}
              onValueChange={(value) => setSpeedEdit(value[0])}
              min={5}
              max={1000}
              step={10}
            />

            <Label htmlFor="block-color">Block Color</Label>
            <input
              type="color"
              value={blockColorEdit}
              onChange={(e) => setBlockColorEdit(e.target.value)}
            />

            <Label htmlFor="board-background-color">Board Background Color</Label>
            <input
              type="color"
              value={boardBackgroundColorEdit}
              onChange={(e) => setBoardBackgroundColorEdit(e.target.value)}
            />

            <Label>Block Edges</Label>
            <Checkbox
              checked={blockEdgesEdit}
              onCheckedChange={(checked) => setBlockEdgesEdit(checked as boolean)}
            />

            <Label htmlFor="randomize-density">Randomize Density: {randomizedensityEdit}</Label>
            <Slider
              value={[randomizedensityEdit]}
              onValueChange={(value) => setRandomizedensityEdit(value[0])}
              min={0.1}
              max={1}
              step={0.1}
            />

            <Label>Board Outline</Label>
            <Checkbox
              checked={boardOutlineEdit}
              onCheckedChange={(checked) => setBoardOutlineEdit(checked as boolean)}
            />

            <Label htmlFor="board-outline-color">Board Outline Color</Label>
            <input
              type="color"
              value={boardOutlineColorEdit}
              onChange={(e) => setBoardOutlineColorEdit(e.target.value)}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="submit" onClick={() => {
                  setSpeed(speedEdit);
                  setBoardSize(BOARD_SIZEEdit);
                  setBlockColor(blockColorEdit);
                  setBoardBackgroundColor(boardBackgroundColorEdit);
                  setRandomizedensity(randomizedensityEdit);
                  setBlockEdges(blockEdgesEdit);
                  setBoardOutline(boardOutlineEdit);
                  setBoardOutlineColor(boardOutlineColorEdit);
                }}>Save changes</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
