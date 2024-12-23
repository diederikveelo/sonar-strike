import { memo, useCallback } from 'react';
import styled from 'styled-components';

const ShipContainer = styled.div`
  width: ${props => props.$isVertical ? 30 : (props.$length * 30) + props.$length - 1}px;
  height: ${props => props.$isVertical ? (props.$length * 30) + props.$length - 1 : 30}px;
  background-color: rgba(255,0,0,0.5);
  border-radius: 4px;
  position: absolute;
  top: ${props => props.$top + 1}px; // Add 1px for grid padding
  left: ${props => props.$left + 1}px; // Add 1px for grid padding
  cursor: move;
  transition: transform 0.2s;
  z-index: 2;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const Ship = memo(function Ship({ ship, position, isVertical, onDragStart, onDragEnd }) {
  const handleDragStart = useCallback((e) => {
    const rect = e.target.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    e.dataTransfer.setData('shipData', JSON.stringify({
      shipId: ship.id,
      offsetX,
      offsetY
    }));
    
    onDragStart(offsetX, offsetY);
  }, [ship.id, onDragStart]);

  return (
    <ShipContainer 
      $length={ship.length} 
      $isVertical={isVertical}
      $top={position.row * 31}
      $left={position.col * 31}
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
    />
  );
});

export default Ship;