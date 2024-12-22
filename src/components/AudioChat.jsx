import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useGGWave } from '../hooks/useGGWave';
import ConnectionStatus from './ConnectionStatus';

const Container = styled.div`
    padding: 20px;
    max-width: 600px;
    margin: 0 auto;
`;

const MessageInput = styled.textarea`
    width: 100%;
    height: 100px;
    margin: 10px 0;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    resize: vertical;
`;

const SendButton = styled.button`
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-bottom: 20px;

    &:disabled {
        background-color: #cccccc;
    }
`;

const InitializeButton = styled.button`
    padding: 10px 20px;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-bottom: 20px;

    &:disabled {
        background-color: #cccccc;
    }
`;

const MessagesContainer = styled.div`
    margin-top: 20px;
    border: 1px solid #ccc;
    padding: 10px;
    height: 300px;
    overflow-y: auto;
    border-radius: 4px;
`;

const Message = styled.div`
    margin: 5px 0;
    padding: 5px;
    background-color: #f0f0f0;
    border-radius: 4px;
`;

export default function AudioChat() {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const { sendMessage, startListening, isInitialized, error, initialize } = useGGWave();

    useEffect(() => {
        if (isInitialized) {
            startListening((receivedMessage) => {
                setMessages(prev => [...prev, receivedMessage]);
            });
        }
    }, [isInitialized, startListening]);

    const handleSend = async () => {
        if (message.trim()) {
            await sendMessage(message);
            setMessages(prev => [...prev, `(You): ${message}`]);
            setMessage('');
        }
    };

    return (
        <Container>
            <h1>Audio Chat</h1>
            
            {!isInitialized && (
                <InitializeButton 
                    onClick={initialize}
                    disabled={isInitialized}
                >
                    Initialize Audio Connection
                </InitializeButton>
            )}

            <ConnectionStatus isInitialized={isInitialized} error={error} />
            
            <MessageInput
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={!isInitialized}
            />
            
            <SendButton 
                onClick={handleSend}
                disabled={!isInitialized || !message.trim()}
            >
                Send Message
            </SendButton>

            <MessagesContainer>
                {messages.map((msg, index) => (
                    <Message key={index}>{msg}</Message>
                ))}
            </MessagesContainer>
        </Container>
    );
}