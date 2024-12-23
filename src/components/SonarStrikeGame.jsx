import { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import Grid from './Grid';
import GameControls from './GameControls';
import MessageLog from './MessageLog';
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
  gap: 20px;
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
  const [messages, setMessages] = useState([]);

  const addMessage = useCallback((text, type = 'info') => {
    setMessages(prev => [...prev, { text, type, timestamp: Date.now() }]);
  }, []);
  
  const {
    gameState,
    gameId,
    initialize: initializeGame,
    startNewGame,
    joinGame,
    fireAt,
    opponentBoard,
    isGGWaveInitialized: isAudioInitialized,
    error,
    ships,
    updateShipPosition,
    isValidPosition,
    isMyTurn,
    shotsFired,
    shotsReceived
  } = useGameController({ 
      onMessage: addMessage 
    });
  
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
  
  const handleCellClick = useCallback((row, col) => {
    console.log("handleCellClick", gameState, isMyTurn);
    if (gameState === 'PLAYING' && isMyTurn) {
      fireAt(col, row);
    }
  }, [gameState, fireAt, isMyTurn]);

  // Monitor error changes
  useEffect(() => {
    if (error) {
      addMessage(error, 'error');
    }
  }, [error, addMessage]);

  // Monitor game state changes
  useEffect(() => {
    addMessage(`Game state changed to: ${gameState}`);
  }, [gameState, addMessage]);

  return (
    <GameContainer>
      <GameControls
        gameState={gameState}
        gameId={gameId}
        onStartGame={startNewGame}
        onJoinGame={joinGame}
        isAudioInitialized={isAudioInitialized}
        onInitializeAudio={handleInitializeAudio}
        error={error}
      />
      <BoardsContainer>
        <BoardSection>
          <Grid 
            board={opponentBoard || createEmptyBoard()}
            ships={[]}
            isPlayerBoard={false}
            onCellClick={handleCellClick}
            isMyTurn={isMyTurn}
            shots={shotsFired}
          />
        </BoardSection>

        <BoardSection>
          <Grid 
            board={playerBoard}
            ships={ships}
            onDrop={handleShipDrop}
            isPlayerBoard={true}
            isValidPosition={isValidPosition}
            shots={shotsReceived}
          />
        </BoardSection>
      </BoardsContainer>
      <MessageLog messages={messages} />
    </GameContainer>
  );
}