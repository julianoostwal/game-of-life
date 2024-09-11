/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from './OrbitControls';
import { Slider } from "@/components/ui/slider"
import { Label } from '@/components/ui/label';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import Link from 'next/link';

// Standaardgrootte van het speelbord
const DEFAULT_BOARD_SIZE = 80;

// Functie om een leeg bord te genereren als een Map
const generateEmptyBoard = () => new Map();

export default function Home() {
  // State voor het speelbord, de running status, de bordgrootte, de snelheid en kleuren
  const [board, setBoard] = useState(generateEmptyBoard);
  const [running, setRunning] = useState(false);
  const [BOARD_SIZE, setBoardSize] = useState(DEFAULT_BOARD_SIZE);
  const [speed, setSpeed] = useState(100);
  const [blockColor, setBlockColor] = useState(0x00ff00);
  const [boardGridColor, setBoardGridColor] = useState(0xffffff);
  const [boardBackgroundColor, setBoardBackgroundColor] = useState(0x000000);

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
    renderer.setSize(window.innerWidth, window.innerHeight); // Stel de grootte van de renderer in
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
  
    // Voeg een grid-helper toe om het speelbord weer te geven
    const gridHelper = new THREE.GridHelper(BOARD_SIZE, BOARD_SIZE);
    gridHelper.position.set(0, 0, 0);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.material.color.set(boardGridColor);

    scene.add(gridHelper);
  
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
  }, [BOARD_SIZE, boardBackgroundColor, boardGridColor]);
  
  // Reset het bord wanneer de grootte van het bord verandert
  useEffect(() => {
    setRunning(false);
    setBoard(generateEmptyBoard());
  }, [BOARD_SIZE]);
  
  // Functie om het speelbord bij te werken met blokken
  const updateBoardVisualization = (newBoard: any) => {
    const boardGroup = boardGroupRef.current;
    boardGroup.clear(); // Verwijder alle huidige blokken
  
    newBoard.forEach((_: any, key: { split: (arg0: string) => { (): any; new(): any; map: { (arg0: NumberConstructor): [any, any]; new(): any; }; }; }) => {
      const [row, col] = key.split(',').map(Number);
  
      // Controleer of het blok binnen de grenzen van het bord ligt
      if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
        return; // Sla blokken over die buiten het bord vallen
      }

      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshStandardMaterial({ color: blockColor });
      const cube = new THREE.Mesh(geometry, material);
  
      // Stel de positie van de blokken in zodat ze uitgelijnd zijn met het grid
      cube.position.set(col - BOARD_SIZE / 2 + 0.5, BOARD_SIZE / 2 - row - 0.5, 0);
      boardGroup.add(cube);
    });
  };

  // Functie om de volgende generatie van het bord te berekenen
  const getNextGeneration = () => {
    const newBoard = new Map();
    const neighborCount = new Map();

    // Tel het aantal buren voor elke cel
    board.forEach((_, key) => {
      const [row, col] = key.split(',').map(Number);
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

    // Bepaal of een cel blijft bestaan of een nieuwe cel wordt toegevoegd
    neighborCount.forEach((count, key) => {
      if (count === 3 || (count === 2 && board.has(key))) {
        newBoard.set(key, true);
      }
    });

    return newBoard;
  };

  // Functie om het bord willekeurig te vullen met blokken
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

  // Start of stop de simulatie op basis van de "running" status
  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setBoard(getNextGeneration());
    }, speed);

    return () => clearInterval(interval);
  }, [running, board]);

  // Werk de visualisatie bij wanneer het bord verandert
  useEffect(() => {
    updateBoardVisualization(board);
  }, [board]);

  return (
      <main className="container mx-auto min-h-screen p-4">
          {/* Scene container waar de Three.js scène wordt weergegeven */}
          <div ref={sceneContainerRef} className="flex justify-center" style={{ width: "100%", height: "80vh" }} />

          {/* Bedieningselementen voor de simulatie */}
          <div className="mt-12 flex gap-3 justify-center">
              <Button onClick={() => setRunning(!running)} variant="secondary">
                  {running ? "Stop" : "Start"}
              </Button>
              <Button onClick={() => setBoard(generateEmptyBoard())} variant="destructive">
                  Reset
              </Button>
              <Button onClick={() => randomizeBoard()} variant="outline" className="text-white">
                  Randomize
              </Button>
              <Dialog>
                  <DialogTrigger asChild>
                      <Button variant="outline" color="white" className="text-white">
                          Settings
                      </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-white">
                      <DialogHeader>
                          <DialogTitle>Settings</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="name" className="text-right">
                                  Delay
                              </Label>
                              <Slider
                                  defaultValue={[speed]}
                                  max={1000}
                                  min={1}
                                  step={1}
                                  className="w-96"
                                  onValueChange={(value) => setSpeed(value[0])}
                              />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="name" className="text-right">
                                  Grid size
                              </Label>
                              <Slider
                                  defaultValue={[BOARD_SIZE]}
                                  max={1000}
                                  min={1}
                                  step={1}
                                  className="w-96"
                                  onValueChange={(value) => setBoardSize(value[0])}
                              />
                          </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button type="submit">Save changes</Button>
                        </DialogClose>
                      </DialogFooter>
                  </DialogContent>
              </Dialog>
              <Link href="/play">
                <Button variant="outline" className="text-white">
                    2D
                </Button>
              </Link>
          </div>
      </main>
  );
}

