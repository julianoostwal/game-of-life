'use client';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from './OrbitControls';

const DEFAULT_BOARD_SIZE = 80;

const generateEmptyBoard = () => new Map();

export default function Home() {
  const [board, setBoard] = useState(generateEmptyBoard);
  const [running, setRunning] = useState(false);
  const [BOARD_SIZE, setBoardSize] = useState(DEFAULT_BOARD_SIZE);
  const [speed, setSpeed] = useState(100); // speed in milliseconds
  const sceneContainerRef = useRef(null); // Ref for the scene container

  // Refs to hold Three.js objects
  const sceneRef = useRef();
  const cameraRef = useRef();
  const rendererRef = useRef();
  const controlsRef = useRef();
  const boardGroupRef = useRef(new THREE.Group());

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 30);
  
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    sceneContainerRef.current.appendChild(renderer.domElement);
  
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
  
    const pointLight = new THREE.PointLight(0xffffff, 0.6);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);
  
    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
  
    // Add the board group to the scene
    scene.add(boardGroupRef.current);
  
    // Add a grid helper
    const gridHelper = new THREE.GridHelper(BOARD_SIZE, BOARD_SIZE);
    gridHelper.position.set(0, 0, 0); // Center the grid
    gridHelper.rotation.x = Math.PI / 2; // Rotate 90 degrees around the x-axis

    scene.add(gridHelper);
  
    // Save references
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;
  
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
  
    // Cleanup on unmount
    return () => {
      renderer.dispose();
      controls.dispose();
      if (sceneContainerRef.current) {
        sceneContainerRef.current.removeChild(renderer.domElement);
      }
    };
    
  }, []);
  
  

  const updateBoardVisualization = (newBoard) => {
    const boardGroup = boardGroupRef.current;
    boardGroup.clear(); // Clear previous cubes
  
    newBoard.forEach((_, key) => {
      const [row, col] = key.split(',').map(Number);
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
      const cube = new THREE.Mesh(geometry, material);
      
      // Align blocks with the grid
      cube.position.set(col - BOARD_SIZE / 2 + 0.5, BOARD_SIZE / 2 - row - 0.5, 0);
      boardGroup.add(cube);
    });
  };
  

  const toggleCell = (row, col) => {
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

  // Update board visualization whenever the board state changes
  useEffect(() => {
    updateBoardVisualization(board);
  }, [board]);

  return (
    <main className="container mx-auto min-h-screen p-4">
      <div
        ref={sceneContainerRef}
        className="flex justify-center"
        style={{ width: '100%', height: '80vh' }}
      />

      <div className="mt-4 flex gap-3 justify-center">
        <Button onClick={() => setRunning(!running)} variant="outline">
          {running ? 'Stop' : 'Start'}
        </Button>
        <Button onClick={() => setBoard(generateEmptyBoard())} variant="destructive">
          Reset
        </Button>
        <Button onClick={() => randomizeBoard()}>Randomize</Button>
      </div>
    </main>
  );
}
