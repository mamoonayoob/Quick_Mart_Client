// import React, { useState } from "react";
// import Chat from "./Chat"; // Already made by you

// const FloatingChat = () => {
//   const [isOpen, setIsOpen] = useState(false);

//   return (
//     <>
//       {/* Floating Chat Toggle Button */}
//       <button
//         className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white text-2xl rounded-full shadow-lg z-50"
//         onClick={() => setIsOpen(!isOpen)}
//         title="Chat with us"
//       >
//         {isOpen ? "✖" : "💬"}
//       </button>

//       {/* Slide-in Chat Panel */}
//       <div
//         className={`fixed bottom-24 right-6 w-80 h-[500px] bg-white rounded-xl shadow-xl z-50 overflow-hidden transition-transform duration-300 ${
//           isOpen ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"
//         }`}
//       >
//         {/* Optional header */}
//         <div className="bg-blue-600 text-white px-4 py-2 text-sm font-semibold">
//           QuickMart Assistant
//         </div>

//         {/* Render your existing Chat component */}
//         <Chat />
//       </div>
//     </>
//   );
// };

// export default FloatingChat;
