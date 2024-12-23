import { useState, useCallback, memo } from 'react';
import styled from 'styled-components';
import Ship from './Ship';

const GridContainer = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: repeat(10, 30px);
  grid-template-rows: repeat(10, 30px);
  gap: 1px;
  background-color: #ddd;
  padding: 1px;
  outline: 1px solid #999;
  width: fit-content;
  height: fit-content;
  cursor: ${props => (!props.$isPlayerBoard && props.$isMyTurn) ? 'crosshair' : 'default'};
`;

const Cell = styled.div`
  width: 30px;
  height: 30px;
  background-color: ${props => {
    if (props.$isHighlighted) return '#90EE90';
    if (props.content === 'ship') return '#EEE';
    if (props.content === 'hit') return '#FF6B6B';
    if (props.content === 'miss') return '#A8D8EA';
    return '#fff';
  }};
  outline: 1px solid #ccc;
`;

const Grid = memo(function Grid({
  board,
  ships,
  onDrop,
  isPlayerBoard,
  isValidPosition,
  onCellClick,
  isMyTurn
}) {
  const [highlightedCells, setHighlightedCells] = useState([]);
  const [draggedShipId, setDraggedShipId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleCellClick = useCallback((row, col) => {
    if (!isPlayerBoard && isMyTurn && onCellClick) {
      onCellClick(row, col);
    }
  }, [isPlayerBoard, isMyTurn, onCellClick]);
  
  const getGridPosition = useCallback((e, offsetX = 0, offsetY = 0) => {
    const gridRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    const adjustedX = mouseX - offsetX;
    const adjustedY = mouseY - offsetY;
    const relativeX = adjustedX - gridRect.left;
    const relativeY = adjustedY - gridRect.top;
    
    return {
      row: Math.round(relativeY / 31),
      col: Math.round(relativeX / 31)
    };
  }, []);
  
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    if (!isPlayerBoard || !draggedShipId) return;
  
    const ship = ships.find(s => s.id === draggedShipId);
    const { row, col } = getGridPosition(e, dragOffset.x, dragOffset.y);
  
    // Updated isValidPosition call
    if (isValidPosition(ship, row, col, ship.isVertical, draggedShipId)) {
      const newHighlightedCells = [];
      for (let i = 0; i < ship.length; i++) {
        const highlightRow = ship.isVertical ? row + i : row;
        const highlightCol = ship.isVertical ? col : col + i;
        newHighlightedCells.push({ row: highlightRow, col: highlightCol });
      }
      setHighlightedCells(newHighlightedCells);
    } else {
      setHighlightedCells([]); // Clear highlights if position is invalid
    }
  }, [isPlayerBoard, draggedShipId, ships, dragOffset, isValidPosition, getGridPosition]);

  const handleDragStart = useCallback((shipId, offsetX, offsetY) => {
    setDraggedShipId(shipId);
    setDragOffset({ x: offsetX, y: offsetY });
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedShipId(null);
    setHighlightedCells([]);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    if (!isPlayerBoard) return;
  
    const shipData = JSON.parse(e.dataTransfer.getData('shipData'));
    const { offsetX, offsetY } = shipData;
    
    const { row, col } = getGridPosition(e, offsetX, offsetY);
    
    // Find the ship to get its current orientation
    const ship = ships.find(s => s.id === shipData.shipId);
    
    // Pass the current orientation along with the position
    onDrop(shipData.shipId, row, col, ship.isVertical);
    setHighlightedCells([]);
    setDraggedShipId(null);
    setDragOffset({ x: 0, y: 0 });
  }, [isPlayerBoard, onDrop, getGridPosition, ships]);
  
  return (
    <GridContainer
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={() => setHighlightedCells([])}
      $isPlayerBoard={isPlayerBoard}
      $isMyTurn={isMyTurn}
    >
      {Array.isArray(board) && board.map((row, i) =>
        Array.isArray(row) && row.map((cell, j) => (
          <Cell
            key={`${i}-${j}`}
            content={cell}
            $isHighlighted={highlightedCells.some(cell => cell.row === i && cell.col === j)}
            onClick={() => handleCellClick(i, j)}
          />
        ))
      )}
      {isPlayerBoard && ships.map(ship => (
        ship.position && 
        <Ship
          key={ship.id}
          ship={ship}
          position={ship.position}
          isVertical={ship.isVertical}
          onDragStart={(offsetX, offsetY) => handleDragStart(ship.id, offsetX, offsetY)}
          onDragEnd={handleDragEnd}
        />
      ))}
    </GridContainer>
  );
});

export default Grid;
