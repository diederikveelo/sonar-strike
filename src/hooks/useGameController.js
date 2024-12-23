import { useState, useCallback, useEffect } from 'react';
import { useGGWave } from './useGGWave';

const GameState = {
  SETUP: 'SETUP',
  READY: 'READY',
  JOINING: 'JOINING',
  WAITING_FOR_OPPONENT: 'WAITING_FOR_OPPONENT',
  SHARING_BOARD: 'SHARING_BOARD',
  WAITING_FOR_BOARD: 'WAITING_FOR_BOARD',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER'
};

const getRandomId = (count) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let id = '';
  for (let i = 0; i < count; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
};

export function useGameController() {
  const [gameState, setGameState] = useState(GameState.SETUP);
  const [gameId, setGameId] = useState(null);
  const [userId, setUserId] = useState(() => getRandomId(2));
  const [opponentBoard, setOpponentBoard] = useState(null);
  const [error, setError] = useState(null);
  const [broadcastInterval, setBroadcastInterval] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [shotsFired, setShotsFired] = useState(new Set());
  const [shotsReceived, setShotsReceived] = useState(new Set());

  const CellState = {
    EMPTY: null,
    SHIP: 'ship',
    HIT: 'hit',
    MISS: 'miss'
  };
  
  // GGWave hook
  const { 
    sendMessage, 
    startListening, 
    initialize, 
    isGGWaveInitialized,
    error: ggwaveError
  } = useGGWave();
  
  const [ships, setShips] = useState([
    { id: 1, name: 'Carrier', length: 5, position: null, isVertical: true },
    { id: 2, name: 'Battleship', length: 4, position: null, isVertical: true },
    { id: 3, name: 'Cruiser', length: 3, position: null, isVertical: true },
    { id: 4, name: 'Submarine', length: 3, position: null, isVertical: true },
    { id: 5, name: 'Destroyer', length: 2, position: null, isVertical: true }
  ]);

  const sendMessageWithUserId = useCallback((message) => {
    if (!userId) {
      console.error('No user ID set');
      return;
    }
    sendMessage(`U${userId}${message}`);
  }, [userId, sendMessage]);
  
  const isValidPosition = useCallback((allShips, ship, row, col, isVertical, movingShipId = null) => {
    // Check board boundaries
    if (isVertical) {
      if (row < 0 || row + ship.length > 10) return false;
      if (col < 0 || col >= 10) return false;
    } else {
      if (row < 0 || row >= 10) return false;
      if (col < 0 || col + ship.length > 10) return false;
    }
  
    // Check for overlaps with other ships
    const shipCells = new Set();
  
    // Add all cells the moving ship would occupy
    for (let i = 0; i < ship.length; i++) {
      const shipRow = isVertical ? row + i : row;
      const shipCol = isVertical ? col : col + i;
      shipCells.add(`${shipRow},${shipCol}`);
    }
  
    // Check against all other ships' positions
    for (const otherShip of allShips) {
      // Skip the ship being moved
      if (movingShipId && otherShip.id === movingShipId) continue;
      if (!otherShip.position) continue;
      
      // Check all cells this ship occupies
      for (let i = 0; i < otherShip.length; i++) {
        const otherRow = otherShip.isVertical ? 
          otherShip.position.row + i : 
          otherShip.position.row;
        const otherCol = otherShip.isVertical ? 
          otherShip.position.col : 
          otherShip.position.col + i;
        
        if (shipCells.has(`${otherRow},${otherCol}`)) {
          return false;
        }
      }
    }
  
    return true;
  }, []);
  
  // Get random position for a ship
  const getRandomPosition = useCallback((ship, allShips) => {
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      const isVertical = Math.random() < 0.5;
      const maxRow = isVertical ? 10 - ship.length : 10;
      const maxCol = isVertical ? 10 : 10 - ship.length;
      
      const row = Math.floor(Math.random() * maxRow);
      const col = Math.floor(Math.random() * maxCol);

      if (isValidPosition(allShips, ship, row, col, isVertical)) {
        return { row, col, isVertical };
      }

      attempts++;
    }

    return null;
  }, [isValidPosition]);
  
  // Encode board details into a string
  const encodeBoardDetails = useCallback(() => {
    return ships
      .map(ship => {
        if (ship.position) {  // Check if position exists within map instead of filter
          const orientation = ship.isVertical ? 'V' : 'H';
          return `${orientation}${ship.length}${ship.position.col}${ship.position.row}`;
        }
        return null;  // Return null for ships without positions
      })
      .filter(Boolean)  // Filter out null values
      .join('');
  }, [ships]);
  
  // Decode board details from a string
  const decodeBoardDetails = useCallback((boardString) => {
    // Create empty 10x10 board
    const board = Array(10).fill(null).map(() => Array(10).fill(null));
    
    let i = 0;
    while (i < boardString.length) {
      const isVertical = boardString[i] === 'V';
      const length = parseInt(boardString[i + 1]);
      const col = parseInt(boardString[i + 2]);
      const row = parseInt(boardString[i + 3]);
      
      // Place ship on board
      for (let j = 0; j < length; j++) {
        if (isVertical) {
          board[row + j][col] = 'ship';
        } else {
          board[row][col + j] = 'ship';
        }
      }
      
      i += 4;
    }
    
    return board;
  }, []);

  // update ship position
  const updateShipPosition = useCallback((shipId, position, isVertical) => {
    setShips(prevShips => 
      prevShips.map(ship => 
        ship.id === shipId 
          ? { ...ship, position, isVertical: isVertical } // Preserve the orientation
          : ship
      )
    );
  }, []);
  
  const checkValidPosition = useCallback((positions, orientations, ship, row, col, isVertical, movingShipId) => {
    return isValidPosition(positions, orientations, ship, row, col, isVertical, movingShipId, ships);
  }, [ships]);
  
  // Share board details
  const shareBoardDetails = useCallback(() => {
    try {
      // Verify all ships are placed
      const allShipsPlaced = ships.every(ship => ship.position !== null);
  
      if (!allShipsPlaced) {
        throw new Error('Please place all ships before starting');
      }
  
      const boardDetails = encodeBoardDetails();
      sendMessageWithUserId(`B${gameId}${boardDetails}`);
    } catch (err) {
      setError('Failed to share board details: ' + err.message);
    }
  }, [ships, gameId, sendMessageWithUserId, encodeBoardDetails]);
  
  // Handle incoming messages
  const handleMessage = useCallback((message) => {
    try {

      if (!message.startsWith('U')) return;
      const senderUserId = message.substring(1, 3);
      const messageContent = message.substring(3);

      // Ignore our own messages
      if (senderUserId === userId) return;

      const type = messageContent.charAt(0);
      console.log('Received message:', message, type, messageContent, gameState);

      switch (type) {
        case 'G': // game broadcast message received
          if (gameState === GameState.READY) {

            // clear our own broadcast
            if (broadcastInterval) {
              clearInterval(broadcastInterval);
              setBroadcastInterval(null);
            }

            // set the game id
            const receivedGameId = messageContent.substring(1, 3);
            setGameId(receivedGameId);

            // Send join confirmation
            sendMessageWithUserId(`J${receivedGameId}`);
            setGameState(GameState.JOINING);
            console.log('Joining game:', receivedGameId);
          }
          break;
  
        case 'J': // Join game received
          if (gameState === GameState.READY && 
              messageContent.substring(1, 3) === gameId) {

            // TODO: should we register the opponents userId?
                
            if (broadcastInterval) {
              clearInterval(broadcastInterval);
              setBroadcastInterval(null);
            }

            setGameState(GameState.SHARING_BOARD);
            shareBoardDetails();
            console.log('Player joined, ready to share board');
          }
          break;
  
        case 'B': // Board details received
          if (gameId === messageContent.substring(1, 3)) {
            const boardDetails = messageContent.substring(3);
            const decodedBoard = decodeBoardDetails(boardDetails);
            console.log("decoded board:", decodedBoard);
            setOpponentBoard(decodedBoard);

            // share our board in response
            if (gameState !== GameState.SHARING_BOARD) {
              shareBoardDetails();
            } else {
              setIsMyTurn(true);
            }
            
            setGameState(GameState.PLAYING);
             
            console.log('Received board details, starting game');
          }
          break;
  
        case 'F': // Fire command received
          if (gameState === GameState.PLAYING && 
              messageContent.substring(1, 3) === gameId) {
            const x = parseInt(messageContent.charAt(3));
            const y = parseInt(messageContent.charAt(4));

            const isHit = ships.some(ship => {
              if (!ship.position) return false;
              
              for (let i = 0; i < ship.length; i++) {
                const shipX = ship.isVertical ? ship.position.col : ship.position.col + i;
                const shipY = ship.isVertical ? ship.position.row + i : ship.position.row;
                if (shipX === x && shipY === y) return true;
              }
              return false;
            });
    
            console.log("isHit", x, y, isHit);
            
            // Add shot to received shots
            setShotsReceived(prev => new Set(prev).add(`${x},${y}`));
            
            // Send result back
            // sendMessageWithUserId(`R${gameId}${x}${y}${isHit ? 'H' : 'M'}`);
            
            // Set turn to player
            setIsMyTurn(true);
          }
          break;
      }
    } catch (err) {
      setError('Error processing message: ' + err.message);
    }
  }, [
    gameState,
    gameId,
    sendMessageWithUserId,
    decodeBoardDetails,
    broadcastInterval,
    shareBoardDetails,
    ships,
    userId
  ]);
  
  // Update local error state when ggwave error changes
  useEffect(() => {
    if (ggwaveError) {
      setError(ggwaveError);
    }
  }, [ggwaveError]);

  // Initialize message listening
  useEffect(() => {
    if (isGGWaveInitialized) {
      console.log("initialised, start listening...");
      return startListening(handleMessage);
    }
  }, [isGGWaveInitialized, startListening, handleMessage]);
  
  // Clean up the broadcast interval on unmount
  useEffect(() => {
    return () => {
      if (broadcastInterval) {
        clearInterval(broadcastInterval);
      }
    };
  }, [broadcastInterval]);
  
  // Initialize ship positions
  useEffect(() => {
    const newShips = [...ships];
    
    // Place ships in random order
    for (let i = 0; i < newShips.length; i++) {
      const position = getRandomPosition(newShips[i], newShips);
      if (position) {
        newShips[i] = {
          ...newShips[i],
          position: { row: position.row, col: position.col },
          isVertical: position.isVertical
        };
      }
    }

    setShips(newShips);
  }, []);
  
  // Start new game as host
  const startNewGame = useCallback(async () => {
    try {
      const newGameId = getRandomId(2);
      setGameId(newGameId);
      setGameState(GameState.READY);
      setError(null);
      
      // Start broadcasting game ID
      const intervalId = setInterval(() => {
        sendMessageWithUserId(`G${newGameId}`);
      }, 3000);
      
      setBroadcastInterval(intervalId);
    } catch (err) {
      setError('Failed to start game: ' + err.message);
    }
  }, [sendMessageWithUserId]);

  // Fire at coordinates
  const fireAt = useCallback((x, y) => {
    try {
      // Check if it's our turn and we haven't fired at this location
      if (!isMyTurn || shotsFired.has(`${x},${y}`)) {
        return;
      }
      sendMessageWithUserId(`F${gameId}${x}${y}`);
      setShotsFired(prev => new Set(prev).add(`${x},${y}`));
      setIsMyTurn(false);
    } catch (err) {
      setError('Failed to fire: ' + err.message);
    }
  }, [gameId, sendMessageWithUserId, isMyTurn, shotsFired]);

  return {
    gameState,
    gameId,
    initialize,
    startNewGame,
    fireAt,
    opponentBoard,
    isGGWaveInitialized,
    error,
    ships,
    updateShipPosition,
    isValidPosition: (ship, row, col, isVertical, movingShipId) => 
      isValidPosition(ships, ship, row, col, isVertical, movingShipId),
    isMyTurn,
    shotsFired,
    shotsReceived,
  };
}
