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
  onJoinGame, 
  onReadyToPlay,
  isAudioInitialized,
  onInitializeAudio,
  error
}) {
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
        Status: {gameState}
        {gameId && <span> | Game ID: {gameId}</span>}
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
          <>
            <Button 
              onClick={onStartGame}
              disabled={gameState !== 'SETUP'}
            >
              Host Game
            </Button>
            
            <Button 
              onClick={onJoinGame}
              disabled={gameState !== 'SETUP'}
            >
              Join Game
            </Button>
            
            <Button 
              onClick={onReadyToPlay}
              disabled={gameState !== 'SETUP'}
            >
              Ready
            </Button>
          </>
        )}
      </ButtonGroup>
    </ControlsContainer>
  );
}