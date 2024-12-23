import styled from 'styled-components';

const LogContainer = styled.div`
  width: 100%;
  max-width: 600px;
  height: 100px;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 10px;
  margin-top: 20px;
  overflow-y: auto;
  background-color: #f8f9fa;
  font-family: monospace;
`;

const LogMessage = styled.div`
  color: ${props => props.$isError ? '#dc3545' : '#212529'};
  margin-bottom: 4px;
`;

export default function MessageLog({ messages }) {
  return (
    <LogContainer>
      {messages.map((msg, index) => (
        <LogMessage key={index} $isError={msg.type === 'error'}>
          {msg.text}
        </LogMessage>
      ))}
    </LogContainer>
  );
}
