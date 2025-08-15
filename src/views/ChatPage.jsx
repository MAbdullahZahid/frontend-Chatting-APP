import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Swal from "sweetalert2";
import { FiMic, FiSend, FiTrash2, FiChevronLeft } from "react-icons/fi";
import { BsCheck2All } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
const BackendURL = import.meta.env.VITE_BACKEND_BASE_URL;

const ChatPage = () => {
    const { socket, userId, logout } = useAuth();
    const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState("");
  const [messageText, setMessageText] = useState("");
  const [chatPartner, setChatPartner] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result.split(",")[1];
          socket?.emit("sendVoiceMessage", { chatId, senderId: userId, voiceMessage: base64Audio });
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      Swal.fire({
        title: "Microphone Access Error",
        text: "Please allow microphone access to record voice messages",
        icon: "error"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Stop all tracks in the stream
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleDeleteMessage = (messageId) => {
    Swal.fire({
      title: "Delete Message?",
      text: "This will delete your message for everyone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        socket?.emit("deleteMessage", { messageId, chatId });
      }
    });
  };

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleVM = (vm) => {
      if (vm.chatId === chatId) {
        setMessages((prev) => [...prev, vm]);
      }
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    };

    const handleStatusUpdate = ({ userId: partnerId, status }) => {
      if (partnerId === chatPartner?.userId) {
        setIsOnline(status === "online");
      }
    };

    socket?.on("newVoiceMessage", handleVM);
    socket?.on("messageDeleted", handleMessageDeleted);
    socket?.on("userStatusUpdate", handleStatusUpdate);

    return () => {
      socket?.off("newVoiceMessage", handleVM);
      socket?.off("messageDeleted", handleMessageDeleted);
      socket?.off("userStatusUpdate", handleStatusUpdate);
    };
  }, [socket, chatId, chatPartner]);

  // Fetch chat data
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const chatIdFromUrl = params.get("chatId");
    setChatId(chatIdFromUrl);

    if (chatIdFromUrl) {
      // Fetch messages
      axios
        .get(`${BackendURL}/api/messages/chat-by-chatid`, {
          params: { chatId: chatIdFromUrl },
        })  
        .then((res) => {
          setMessages(res.data);
          
          if (res.data.length > 0) {
            const otherMsg = res.data.find((m) => m.senderId !== userId);
            if (otherMsg) {
              setChatPartner({
                name: otherMsg.senderName,
                userId: otherMsg.senderId
              });
              // Request status for this user
              socket?.emit("requestUserStatus", { userId: otherMsg.senderId });
            } else {
              setChatPartner({
                name: res.data[0].senderName,
                userId: res.data[0].senderId
              });
            }
          }
        })
        .catch((err) => {
          console.error("Error fetching chat:", err);
        });

      // Mark messages as read
      socket?.emit("markMessagesRead", { chatId: chatIdFromUrl, userId });
    }

    // Socket listeners
    const handleNewMessage = (newMessage) => {
      if (newMessage.chatId === chatIdFromUrl) {
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const handleMessagesRead = ({ chatId: updatedChatId }) => {
      if (updatedChatId === chatIdFromUrl) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.senderId === userId ? { ...msg, isRead: true } : msg
          )
        );
      }
    };

    socket?.on("newMessage", handleNewMessage);
    socket?.on("messagesRead", handleMessagesRead);

    return () => {
      socket?.off("newMessage", handleNewMessage);
      socket?.off("messagesRead", handleMessagesRead);
    };
  }, [socket, userId]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    if (!chatId) return;

    socket?.emit("sendMessage", {
      chatId,
      messageText,
      senderId: userId,
    });

    setMessageText("");
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-container">
      {/* Chat header */}
      <div className="chat-header">
        <button className="back-button" onClick={() => navigate(`/user/dashboard`)}>
          <FiChevronLeft size={24} />
        </button>
        <div className="partner-info">
          <div className="partner-avatar">
            {chatPartner.name ? chatPartner.name.charAt(0).toUpperCase() : "?"}
          </div>
          <div>
            <h3>{chatPartner.name || "..."}</h3>
            <p className="status">
              {isOnline ? (
                <span className="online">Online</span>
              ) : (
                <span className="offline">Offline</span>
              )}
            </p>
          </div>
        </div>
        <button className="logout-button" onClick={logout}>
          Logout
        </button>
      </div>

      {/* Messages container */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`message ${msg.senderId === userId ? "sent" : "received"}`}
            >
              <div className="message-content">
                {msg.messageText && (
                  <div className="text-message">{msg.messageText}</div>
                )}
                {msg.voiceMessage && (
                  <div className="voice-message">
                    <audio controls src={`data:audio/webm;base64,${msg.voiceMessage}`} />
                  </div>
                )}
                <div className="message-meta">
                  <span className="time">{formatTime(msg.timestamp)}</span>
                  {msg.senderId === userId && (
                    <span className={`read-status ${msg.isRead ? "read" : "delivered"}`}>
                      <BsCheck2All />
                    </span>
                  )}
                </div>
              </div>
              {msg.senderId === userId && (
                <button
                  className="delete-button"
                  onClick={() => handleDeleteMessage(msg._id)}
                  title="Delete message"
                >
                  <FiTrash2 size={14} />
                </button>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form className="message-input-container" onSubmit={handleSend}>
        <button
          type="button"
          className={`record-button ${isRecording ? "recording" : ""}`}
          onClick={isRecording ? stopRecording : startRecording}
          title={isRecording ? "Stop recording" : "Record voice message"}
        >
          <FiMic size={24} />
          {isRecording && <span className="recording-indicator"></span>}
        </button>
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type a message..."
          className="message-input"
        />
        <button
          type="submit"
          className="send-button"
          disabled={!messageText.trim()}
        >
          <FiSend size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatPage;

// CSS Styles
const styles = `
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 100%;
  margin: 0 auto;
  background-color: #e5ddd5;
  position: relative;
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  background-color: #075e54;
  color: white;
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-button {
  background: none;
  border: none;
  color: white;
  margin-right: 15px;
  cursor: pointer;
}

.partner-info {
  display: flex;
  align-items: center;
  flex-grow: 1;
}

.partner-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #128c7e;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  color: white;
  font-weight: bold;
  font-size: 18px;
}

.partner-info h3 {
  margin: 0;
  font-size: 16px;
}

.status {
  margin: 0;
  font-size: 12px;
  display: flex;
  align-items: center;
}

.status .online {
  color: #00e676;
}

.status .offline {
  color: #9e9e9e;
}

.logout-button {
  background: none;
  border: 1px solid white;
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.messages-container {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  background-image: url('https://web.whatsapp.com/img/bg-chat-tile-light_a4be512e7195b6b733d9110b408f075d.png');
  background-repeat: repeat;
  display: flex;
  flex-direction: column;
}

.no-messages {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #757575;
}

.message {
  display: flex;
  margin-bottom: 15px;
  max-width: 80%;
}

.message.sent {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message.received {
  align-self: flex-start;
}

.message-content {
  position: relative;
  padding: 8px 12px;
  border-radius: 8px;
  word-wrap: break-word;
  max-width: 100%;
}

.message.sent .message-content {
  background-color: #dcf8c6;
  border-top-right-radius: 0;
}

.message.received .message-content {
  background-color: white;
  border-top-left-radius: 0;
}

.text-message {
  margin-bottom: 5px;
}

.voice-message audio {
  width: 200px;
  height: 40px;
  outline: none;
}

.message-meta {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  font-size: 11px;
  color: #666;
  margin-top: 5px;
}

.time {
  margin-right: 5px;
}

.read-status {
  color: #666;
}

.read-status.read {
  color: #4fc3f7;
}

.delete-button {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  align-self: center;
  margin: 0 5px;
}

.message:hover .delete-button {
  opacity: 1;
}

.message-input-container {
  display: flex;
  padding: 10px;
  background-color: #f0f0f0;
  position: sticky;
  bottom: 0;
  align-items: center;
}

.message-input {
  flex: 1;
  padding: 10px 15px;
  border: none;
  border-radius: 20px;
  margin: 0 10px;
  outline: none;
  font-size: 14px;
}

.record-button, .send-button {
  background: none;
  border: none;
  cursor: pointer;
  color: #075e54;
  position: relative;
}

.record-button.recording {
  color: #d32f2f;
}

.recording-indicator {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background-color: #d32f2f;
  border-radius: 50%;
}

.send-button:disabled {
  color: #9e9e9e;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .message {
    max-width: 90%;
  }
  
  .voice-message audio {
    width: 160px;
  }
}

@media (max-width: 480px) {
  .chat-header {
    padding: 8px 10px;
  }
  
  .partner-avatar {
    width: 35px;
    height: 35px;
    margin-right: 10px;
  }
  
  .message-input {
    padding: 8px 12px;
  }
}
`;

// Add styles to the document
const styleElement = document.createElement("style");
styleElement.innerHTML = styles;
document.head.appendChild(styleElement);