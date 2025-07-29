// import React, { useState, useRef, useEffect } from 'react';
// import { getChatbotResponse } from "../helpers/apiHelpers"; // ✅ Adjust path as per your project

// const botResponse = await getChatbotResponse(inputText);


// const Chat = () => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [inputText, setInputText] = useState('');

//   const [messages, setMessages] = useState([
//     { 
//       id: 1, 
//       text: "Hello! I'm QuickMart Assistant. How can I help you today?", 
//       sender: 'bot',
//       timestamp: new Date()
//     }
//   ]);
// //   const [inputText, setInputText] = useState("");

//   const [isTyping, setIsTyping] = useState(false);
//   const messagesEndRef = useRef(null);

//   useEffect(() => {
//     if (isOpen) scrollToBottom();
//   }, [messages, isOpen]);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   const toggleChatbot = () => {
//     setIsOpen(!isOpen);
//   };

// //   const handleSendMessage = (e) => {
// //     e.preventDefault();
// //     if (!inputText.trim()) return;

// //     const userMessage = {
// //       id: messages.length + 1,
// //       text: inputText,
// //       sender: 'user',
// //       timestamp: new Date()
// //     };

// //     setMessages([...messages, userMessage]);
// //     setInputText('');
// //     setIsTyping(true);

// //     setTimeout(() => {
// //       const botResponse = getChatbotResponse(inputText);
// //       setMessages(prevMessages => [...prevMessages, {
// //         id: prevMessages.length + 1,
// //         text: botResponse,
// //         sender: 'bot',
// //         timestamp: new Date()
// //       }]);
// //       setIsTyping(false);
// //     }, 1000);
// //   };
// const handleSendMessage = async () => {
//   if (!inputText.trim()) return;

//   const userMsg = {
//     id: messages.length + 1,
//     text: inputText,
//     sender: "user",
//     timestamp: new Date(),
//   };

//   setMessages((prev) => [...prev, userMsg]);
//   setInputText("");
//   setIsTyping(true);

// //   const botResponse = await getChatbotResponse(inputText);

//   const botMsg = {
//     id: userMsg.id + 1,
//     text: botReplyText,
//     sender: "bot",
//     timestamp: new Date(),
//   };

//   setMessages((prev) => [...prev, botMsg]);
//   setIsTyping(false);
// };

// //   const getBotResponse = (userInput) => {
// //     const input = userInput.toLowerCase();
// //     if (input.includes('hello') || input.includes('hi')) return "Hello! How can I assist you today?";
// //     if (input.includes('inventory')) return "You can check inventory levels in the Inventory Management section.";
// //     if (input.includes('sales')) return "Sales information is available in the Dashboard.";
// //     if (input.includes('order')) return "To create a new order, go to the Purchase section.";
// //     if (input.includes('forecast')) return "Visit Forecasting section to upload data and view predictions.";
// //     if (input.includes('help')) return "Ask about inventory, sales, or system navigation. For tech support, email support@nextgenretail.com";
// //     if (input.includes('thank')) return "You're welcome!";
// //     if (input.includes('bye')) return "Goodbye!";
// //     return "I'm not sure I understand. Try rephrasing your question.";
// //   };

//   const formatTime = (timestamp) => {
//     return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//   };

//   return (
//     <>
//       {/* Chat Icon */}
//       <button
//         className="btn btn-primary chatbot-button rounded-circle d-flex align-items-center justify-content-center"
//         onClick={toggleChatbot}
//       >
//         {isOpen ? '✕' : '💬'}
//       </button>

//       {/* Chatbox */}
//       <div className={`chatbot-box card ${isOpen ? 'show' : 'd-none'}`}>
//         <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
//           <div>
//             <strong>QuickMart Assistant</strong>
//             <div style={{ fontSize: '0.75rem' }}>Online</div>
//           </div>
//           <button type="button" className="btn-close btn-close-white" onClick={toggleChatbot}></button>
//         </div>

//         <div className="card-body overflow-auto" style={{ maxHeight: '300px' }}>
//           {messages.map((msg) => (
//             <div
//               key={msg.id}
//               className={`mb-2 d-flex ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
//             >
//               <div
//                 className={`p-2 rounded text-white ${msg.sender === 'user' ? 'bg-primary' : 'bg-secondary text-start'}`}
//                 style={{ maxWidth: '75%' }}
//               >
//                 <div>{msg.text}</div>
//                 <small className="d-block text-end text-light" style={{ fontSize: '0.7rem' }}>
//                   {formatTime(msg.timestamp)}
//                 </small>
//               </div>
//             </div>
//           ))}
//           {isTyping && (
//             <div className="d-flex justify-content-start mb-2">
//               <div className="bg-secondary text-white p-2 rounded">
//                 Typing<span className="dots">...</span>
//               </div>
//             </div>
//           )}
//           <div ref={messagesEndRef} />
//         </div>

//         <form onSubmit={handleSendMessage} className="card-footer d-flex p-2 border-top">
//           <input
//             type="text"
//             value={inputText}
//             onChange={(e) => setInputText(e.target.value)}
//             className="form-control me-2"
//             placeholder="Type your message..."
//           />
//           <button type="submit" className="btn btn-primary" disabled={!inputText.trim()}>
//             ➤
//           </button>
//         </form>

//         <div className="px-3 py-2 border-top d-flex flex-wrap gap-1">
//           {['Check inventory', 'Create purchase', 'Forecasting help'].map((txt, idx) => (
//             <button
//               key={idx}
//               className="btn btn-sm btn-light"
//               onClick={() => setInputText(txt)}
//             >
//               {txt}
//             </button>
//           ))}
//         </div>
//       </div>
//     </>
//   );
// };

// export default Chat;

import React, { useState, useRef, useEffect } from 'react';
import { getChatbotResponse } from "../helpers/apiHelpers"; // ✅ Adjust path if needed

const Chat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm QuickMart Assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleChatbot = () => setIsOpen(!isOpen);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const botReply = await getChatbotResponse(userMsg.text); // ✅ Call API properly

      const botMsg = {
        id: userMsg.id + 1,
        text: botReply || "Sorry, I couldn't get a response.",
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Error fetching chatbot response:", error);
      const errorMsg = {
        id: userMsg.id + 1,
        text: "There was an error. Please try again later.",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }

    setIsTyping(false);
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <button
        className="chatbot-button"
        onClick={toggleChatbot}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      <div className={`chatbot-box ${isOpen ? 'show' : 'd-none'}`}>
        <div className="chatbot-header">
          <div>
            <strong>QuickMart Assistant</strong>
            <div style={{ fontSize: '0.75rem' }}>Online</div>
          </div>
          <button className="close-btn" onClick={toggleChatbot}>✕</button>
        </div>

        <div className="chatbot-body">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-message ${msg.sender === 'user' ? 'user' : 'bot'}`}
            >
              <div className="chat-bubble">
                <div>{msg.text}</div>
                <small className="timestamp">{formatTime(msg.timestamp)}</small>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="chat-message bot">
              <div className="chat-bubble">Typing<span className="dots">...</span></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="chatbot-footer">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
          />
          <button type="submit" disabled={!inputText.trim()}>
            ➤
          </button>
        </form>

        <div className="chat-suggestions">
          {['pleace Order', 'product details',].map((txt, idx) => (
            <button key={idx} onClick={() => setInputText(txt)}>{txt}</button>
          ))}
        </div>
      </div>
    </>
  );
};

export default Chat;
