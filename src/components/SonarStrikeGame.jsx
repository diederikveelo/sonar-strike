import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import Grid from './Grid';
import GameControls from './GameControls';
import { useGameController } from '../hooks/useGameController';

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
`;

const BoardsContainer = styled.div`
  display: flex;
  gap: 40px;
  align-items: flex-start;
  flex-direction: column;
`;

const BoardSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ships = [
  { id: 1, name: 'Carrier', length: 5 },
  { id: 2, name: 'Battleship', length: 4 },
  { id: 3, name: 'Cruiser', length: 3 },
  { id: 4, name: 'Submarine', length: 3 },
  { id: 5, name: 'Destroyer', length: 2 }
];

const createEmptyBoard = () => Array(10).fill(null).map(() => Array(10).fill(null));

const isValidPosition = (positions, shipOrientations, ship, row, col, isVertical, movingShipId = null) => {
  // Check board boundaries
  if (isVertical) {
    if (row < 0 || row + ship.length > 10) return false;
    if (col < 0 || col >= 10) return false;
  } else {
    if (row < 0 || row >= 10) return false;
    if (col < 0 || col + ship.length > 10) return false;
  }

  // Check for overlaps with other ships
  const shipCells = new Set(); // Track all cells the new ship would occupy

  // Add all cells the moving ship would occupy
  for (let i = 0; i < ship.length; i++) {
    const shipRow = isVertical ? row + i : row;
    const shipCol = isVertical ? col : col + i;
    shipCells.add(`${shipRow},${shipCol}`);
  }

  // Check against all other ships' positions
  for (const [shipId, position] of Object.entries(positions)) {
    // Skip the ship being moved
    if (movingShipId && shipId === movingShipId.toString()) continue;
    
    // Get the ship object for length and check its cells
    const otherShip = ships.find(s => s.id.toString() === shipId);
    const isOtherVertical = shipOrientations[shipId];

    // Check all cells this ship occupies
    for (let i = 0; i < otherShip.length; i++) {
      const otherRow = isOtherVertical ? position.row + i : position.row;
      const otherCol = isOtherVertical ? position.col : position.col + i;
      
      // If any cell overlaps, position is invalid
      if (shipCells.has(`${otherRow},${otherCol}`)) {
        return false;
      }
    }
  }

  return true;
};

const getRandomPosition = (ship, positions, orientations) => {
  let attempts = 0;
  const maxAttempts = 100; // Prevent infinite loops

  while (attempts < maxAttempts) {
    const isVertical = Math.random() < 0.5;
    const maxRow = isVertical ? 10 - ship.length : 10;
    const maxCol = isVertical ? 10 : 10 - ship.length;
    
    const row = Math.floor(Math.random() * maxRow);
    const col = Math.floor(Math.random() * maxCol);

    if (isValidPosition(positions, orientations, ship, row, col, isVertical)) {
      return { row, col, isVertical };
    }

    attempts++;
  }

  // If we couldn't find a valid position, try again with opposite orientation
  const isVertical = attempts % 2 === 0;
  const maxRow = isVertical ? 10 - ship.length : 10;
  const maxCol = isVertical ? 10 : 10 - ship.length;
  
  return {
    row: Math.floor(Math.random() * maxRow),
    col: Math.floor(Math.random() * maxCol),
    isVertical
  };
};

export default function SonarStrikeGame() {
  const [playerBoard, setPlayerBoard] = useState(createEmptyBoard());
  const [shipPositions, setShipPositions] = useState({});
  const [shipOrientations, setShipOrientations] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    gameState,
    gameId,
    isHost,
    initialize: initializeGame,
    startNewGame,
    joinGame,
    shareBoardDetails,
    fireAt,
    opponentBoard,
    isInitialized: isAudioInitialized,
    error
  } = useGameController();
  
  const handleInitializeAudio = useCallback(async () => {
    try {
      await initializeGame();
    } catch (err) {
      console.error('Failed to initialize audio:', err);
    }
  }, [initializeGame]);
  
  const handleShipDrop = useCallback((shipId, row, col) => {
    setShipPositions(prev => {
      const newPositions = { ...prev };
      const ship = ships.find(s => s.id === shipId);
      const isVertical = shipOrientations[shipId];
  
      if (isValidPosition(newPositions, shipOrientations, ship, row, col, isVertical, shipId)) {
        newPositions[shipId] = { row, col };
      }
      return newPositions;
    });
  }, [shipOrientations]);
  
  const handleReadyToPlay = useCallback(() => {
    // Convert ship positions to the format expected by the game controller
    const formattedShips = ships.map(ship => ({
      length: ship.length,
      isVertical: shipOrientations[ship.id],
      position: shipPositions[ship.id]
    }));
    
    shareBoardDetails(formattedShips);
  }, [shipPositions, shipOrientations, shareBoardDetails]);

  const handleCellClick = useCallback((row, col) => {
    if (gameState === 'PLAYING') {
      fireAt(col, row);
    }
  }, [gameState, fireAt]);
  
  // Initialize ship positions
  useEffect(() => {
    const newPositions = {};
    const newOrientations = {};

    // Place ships in random order
    const shuffledShips = [...ships].sort(() => Math.random() - 0.5);

    shuffledShips.forEach(ship => {
      const { row, col, isVertical } = getRandomPosition(ship, newPositions, newOrientations);
      newPositions[ship.id] = { row, col };
      newOrientations[ship.id] = isVertical;
    });
  
    setShipPositions(newPositions);
    setShipOrientations(newOrientations);
    setIsInitialized(true);
  }, []);
  
  if (!isInitialized) {
    return <div>Loading...</div>;
  }
  
  return (
    <GameContainer>
      <GameControls
        gameState={gameState}
        gameId={gameId}
        onStartGame={startNewGame}
        onJoinGame={joinGame}
        onReadyToPlay={handleReadyToPlay}
        isAudioInitialized={isAudioInitialized}
        onInitializeAudio={handleInitializeAudio}
        error={error}
      />
      <BoardsContainer>
        <BoardSection>
          <Grid 
            board={opponentBoard || createEmptyBoard()}
            ships={[]}
            shipPositions={{}}
            isPlayerBoard={false}
            onCellClick={handleCellClick}
          />
        </BoardSection>

        <BoardSection>
          <Grid 
            board={playerBoard}
            ships={ships}
            shipPositions={shipPositions}
            shipOrientations={shipOrientations}
            onDrop={handleShipDrop}
            isPlayerBoard={true}
            isValidPosition={(positions, ship, row, col, isVertical, movingShipId) => 
              isValidPosition(positions, shipOrientations, ship, row, col, isVertical, movingShipId)}
          />
        </BoardSection>
      </BoardsContainer>
    </GameContainer>
  );
}