import { useState, useCallback, useEffect } from 'react';
import { useGGWave } from './useGGWave';

const GameState = {
  SETUP: 'SETUP',
  WAITING_FOR_OPPONENT: 'WAITING_FOR_OPPONENT',
  SHARING_BOARD: 'SHARING_BOARD',
  WAITING_FOR_BOARD: 'WAITING_FOR_BOARD',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER'
};

export function useGameController() {
  const [gameState, setGameState] = useState(GameState.SETUP);
  const [gameId, setGameId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [opponentBoard, setOpponentBoard] = useState(null);
  const { sendMessage, startListening, initialize, isInitialized } = useGGWave();

  // Generate a random 2-character game ID
  const generateGameId = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return chars[Math.floor(Math.random() * chars.length)] + 
           chars[Math.floor(Math.random() * chars.length)];
  }, []);

  // Encode board details into a string
  const encodeBoardDetails = useCallback((ships) => {
    return ships.map(ship => {
      const isVertical = ship.isVertical ? 'V' : 'H';
      return `${isVertical}${ship.length}${ship.position.col}${ship.position.row}`;
    }).join('');
  }, []);

  // Decode board details from a string
  const decodeBoardDetails = useCallback((boardString) => {
    const ships = [];
    let i = 0;
    while (i < boardString.length) {
      const isVertical = boardString[i] === 'V';
      const length = parseInt(boardString[i + 1]);
      const col = parseInt(boardString[i + 2]);
      const row = parseInt(boardString[i + 3]);
      ships.push({
        isVertical,
        length,
        position: { col, row }
      });
      i += 4;
    }
    return ships;
  }, []);

  // Handle incoming messages
  const handleMessage = useCallback((message) => {
    const type = message.charAt(0);
    
    switch (type) {
      case 'G': // Game broadcast
        if (gameState === GameState.WAITING_FOR_OPPONENT) {
          const receivedGameId = message.substring(1, 3);
          setGameId(receivedGameId);
          sendMessage(`J${receivedGameId}`); // Join the game
          setGameState(GameState.WAITING_FOR_BOARD);
        }
        break;

      case 'J': // Join game
        if (gameState === GameState.WAITING_FOR_OPPONENT && 
            message.substring(1, 3) === gameId) {
          setGameState(GameState.SHARING_BOARD);
        }
        break;

      case 'B': // Board details
        const receivedGameId = message.substring(1, 3);
        if (gameId === receivedGameId) {
          const boardDetails = message.substring(3);
          setOpponentBoard(decodeBoardDetails(boardDetails));
          setGameState(GameState.PLAYING);
        }
        break;

      case 'F': // Fire command
        // Handle fire command
        break;
    }
  }, [gameState, gameId, sendMessage, decodeBoardDetails]);

  // Start new game as host
  const startNewGame = useCallback(async () => {
    const newGameId = generateGameId();
    setGameId(newGameId);
    setIsHost(true);
    setGameState(GameState.WAITING_FOR_OPPONENT);
    
    // Start broadcasting game ID
    const broadcastInterval = setInterval(() => {
      sendMessage(`G${newGameId}`);
    }, 1000);

    return () => clearInterval(broadcastInterval);
  }, [generateGameId, sendMessage]);

  // Join existing game
  const joinGame = useCallback(() => {
    setIsHost(false);
    setGameState(GameState.WAITING_FOR_OPPONENT);
  }, []);

  // Share board details
  const shareBoardDetails = useCallback((ships) => {
    if (gameId) {
      const boardString = encodeBoardDetails(ships);
      sendMessage(`B${gameId}${boardString}`);
    }
  }, [gameId, sendMessage, encodeBoardDetails]);

  // Fire at coordinates
  const fireAt = useCallback((x, y) => {
    if (gameId) {
      sendMessage(`F${gameId}${x}${y}`);
    }
  }, [gameId, sendMessage]);

  // Initialize message listening
  useEffect(() => {
    if (isInitialized) {
      return startListening(handleMessage);
    }
  }, [isInitialized, startListening, handleMessage]);

  return {
    gameState,
    gameId,
    isHost,
    initialize,
    startNewGame,
    joinGame,
    shareBoardDetails,
    fireAt,
    opponentBoard
  };
}
