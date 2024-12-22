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
`;

const Cell = styled.div`
  width: 30px;
  height: 30px;
  background-color: ${props => props.$isHighlighted ? '#90EE90' : '#fff'};
  outline: 1px solid #ccc;
`;

const Grid = memo(function Grid({ board, ships, shipPositions, shipOrientations, onDrop, isPlayerBoard, isValidPosition }) {
  const [highlightedCells, setHighlightedCells] = useState([]);
  const [draggedShipId, setDraggedShipId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

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
    const isVertical = shipOrientations[draggedShipId];
    
    const { row, col } = getGridPosition(e, dragOffset.x, dragOffset.y);

    // Only highlight cells if the position is valid
    if (isValidPosition(shipPositions, shipOrientations, ship, row, col, isVertical, draggedShipId)) {
      const newHighlightedCells = [];
      for (let i = 0; i < ship.length; i++) {
        const highlightRow = isVertical ? row + i : row;
        const highlightCol = isVertical ? col : col + i;
        newHighlightedCells.push({ row: highlightRow, col: highlightCol });
      }
      setHighlightedCells(newHighlightedCells);
    } else {
      setHighlightedCells([]); // Clear highlights if position is invalid
    }
  }, [isPlayerBoard, draggedShipId, ships, shipPositions, shipOrientations, dragOffset, isValidPosition, getGridPosition]);
  
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
    
    onDrop(shipData.shipId, row, col);
    setHighlightedCells([]);
    setDraggedShipId(null);
    setDragOffset({ x: 0, y: 0 });
  }, [isPlayerBoard, onDrop, getGridPosition]);
  
  return (
    <GridContainer
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={() => setHighlightedCells([])}
    >
      {board.map((row, i) =>
        row.map((cell, j) => (
          <Cell
            key={`${i}-${j}`}
            $isHighlighted={highlightedCells.some(cell => cell.row === i && cell.col === j)}
          />
        ))
      )}
      {isPlayerBoard && ships.map(ship => (
        <Ship
          key={ship.id}
          ship={ship}
          position={shipPositions[ship.id]}
          isVertical={shipOrientations[ship.id]}
          onDragStart={(offsetX, offsetY) => handleDragStart(ship.id, offsetX, offsetY)}
          onDragEnd={handleDragEnd}
        />
      ))}
    </GridContainer>
  );
});

export default Grid;
