import React from 'react';
import styled from 'styled-components';

const StatusContainer = styled.div`
    padding: 10px;
    margin: 10px 0;
    border-radius: 4px;
    background-color: ${props => props.$isError ? '#ff9999' : '#99ff99'};
`;

export default function ConnectionStatus({ isInitialized, error }) {
    return (
        <StatusContainer $isError={!!error}>
            {error ? error : (isInitialized ? 'Connected and ready' : 'Initializing...')}
        </StatusContainer>
    );
}
