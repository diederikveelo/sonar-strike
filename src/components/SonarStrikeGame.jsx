import { useState, useCallback } from 'react';
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

const createEmptyBoard = () => Array(10).fill(null).map(() => Array(10).fill(null));

export default function SonarStrikeGame() {
  const [playerBoard, setPlayerBoard] = useState(createEmptyBoard());

  const {
    gameState,
    gameId,
    initialize: initializeGame,
    startNewGame,
    joinGame,
    fireAt,
    opponentBoard,
    isInitialized: isAudioInitialized,
    error,
    ships,
    shipPositions,
    shipOrientations,
    updateShipPosition,
    isValidPosition
  } = useGameController();
  
  const handleInitializeAudio = useCallback(async () => {
    try {
      await initializeGame();
    } catch (err) {
      console.error('Failed to initialize audio:', err);
    }
  }, [initializeGame]);
  
  const handleShipDrop = useCallback((shipId, row, col, isVertical) => {
    updateShipPosition(shipId, { row, col }, isVertical);
  }, [updateShipPosition]);
  
  const handleReadyToPlay = useCallback(() => {
    try {
      // Verify all ships are placed
      const allShipsPlaced = ships.every(ship => 
        shipPositions[ship.id] && shipOrientations[ship.id] !== undefined
      );
  
      if (!allShipsPlaced) {
        throw new Error('Please place all ships before starting');
      }
  
    } catch (err) {
      console.error('Ready to play error:', err);
    }
  }, [ships, shipPositions, shipOrientations]);

  const handleCellClick = useCallback((row, col) => {
    if (gameState === 'PLAYING') {
      fireAt(col, row);
    }
  }, [gameState, fireAt]);
  
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
            isValidPosition={isValidPosition}
          />
        </BoardSection>
      </BoardsContainer>
    </GameContainer>
  );
}