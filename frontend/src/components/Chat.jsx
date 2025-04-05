import React, { useState, useEffect, useRef } from 'react';

const Chat = ({ messages, sendMessage, username }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;
    sendMessage(newMessage);
    setNewMessage('');
  };
  
  return (
    <div className="w-64 bg-gray-800 border-l border-gray-700 flex flex-col">
      <div className="p-2 border-b border-gray-700 font-bold">Chat</div>
      <div className="flex-1 overflow-y-auto p-2">
        {messages.map((message, index) => (
          <div key={index} className="mb-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>{message.sender === username ? 'You' : message.sender}</span>
              <span>{message.time}</span>
            </div>
            <div className={`rounded-md p-2 mt-1 ${message.sender === username ? 'bg-blue-700' : 'bg-gray-700'}`}>
              {message.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-2 border-t border-gray-700 flex">
        <input
          type="text"
          className="flex-1 bg-gray-700 rounded-l-md px-2 py-1 text-sm focus:outline-none"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
        />
        <button
          className="bg-blue-500 rounded-r-md px-2 py-1"
          onClick={handleSendMessage}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Chat;