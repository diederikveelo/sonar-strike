import styled from 'styled-components';

const ControlsContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-direction: column;
  align-items: center;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  background-color: ${props => props.$primary ? '#007bff' : '#28a745'};
  color: white;
  cursor: pointer;
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const GameStatus = styled.div`
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 10px;
  text-align: center;
`;

const ConnectionStatus = styled.div`
  padding: 10px;
  background-color: ${props => props.$isConnected ? '#d4edda' : '#f8d7da'};
  color: ${props => props.$isConnected ? '#155724' : '#721c24'};
  border-radius: 4px;
  margin-bottom: 10px;
  text-align: center;
`;

export default function GameControls({ 
  gameState, 
  gameId, 
  onStartGame, 
  isAudioInitialized,
  onInitializeAudio,
  error
}) {
  const getStatusMessage = () => {
    switch (gameState) {
      case 'SETUP': return 'Place your ships and choose to host or join';
      case 'READY': return 'Looking for players...';
      case 'JOINING': return 'Joining game...'
      case 'SHARING_BOARD': return 'Sharing game details...';
      case 'WAITING_FOR_BOARD': return 'Waiting for game details...';
      case 'PLAYING': return 'Game started';
      default: return gameState;
    }
  };
  
  return (
    <ControlsContainer>
      <ConnectionStatus $isConnected={isAudioInitialized}>
        {isAudioInitialized 
          ? "Audio Connection Ready" 
          : "Audio Connection Not Initialized"}
      </ConnectionStatus>

      {error && (
        <ConnectionStatus $isConnected={false}>
          Error: {error}
        </ConnectionStatus>
      )}

      <GameStatus>
        {getStatusMessage()}
        {gameId && <span> | Game: {gameId}</span>}
      </GameStatus>
      
      <ButtonGroup>
        {!isAudioInitialized ? (
          <Button 
            $primary 
            onClick={onInitializeAudio}
          >
            Initialize Audio Connection
          </Button>
        ) : (
          gameState === 'SETUP' &&
            <>
              <Button onClick={onStartGame}>Ready!</Button>
            </>
        )}
      </ButtonGroup>
    </ControlsContainer>
  );
}