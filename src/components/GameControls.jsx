import styled from 'styled-components';

const ControlsContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
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
`;

export default function GameControls({ 
  gameState, 
  gameId, 
  onStartGame, 
  onJoinGame, 
  onReadyToPlay 
}) {
  return (
    <div>
      <GameStatus>
        Status: {gameState}
        {gameId && <span> | Game ID: {gameId}</span>}
      </GameStatus>
      
      <ControlsContainer>
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
      </ControlsContainer>
    </div>
  );
}
