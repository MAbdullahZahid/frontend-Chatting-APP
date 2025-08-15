import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext"; 
import axios from "axios";
import { useNavigate } from "react-router-dom";
const BackendURL = import.meta.env.VITE_BACKEND_BASE_URL;



const Dashboard = () => {
  const { socket, userId, logout } = useAuth();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [allContacts, setAllContacts] = useState([]);



  const filteredContacts = Array.isArray(allContacts)
    ? allContacts.filter(contact =>
        contact.phoneNo && contact.phoneNo.toLowerCase().includes(filterText.toLowerCase())
      )
    : [];

  // Handle status updates
 useEffect(() => {
  if (!socket) return;

  const handleStatusUpdate = ({ userId: contactUserId, status }) => {
    console.log("Status update:", contactUserId, status);

    setContacts(prev =>
      prev.map(contact => {
        // Normalize both IDs to strings for comparison
        const id =
          contact.userId?._id ||
          contact.senderId?._id ||
          contact.receiverId?._id ||
          contact.userId ||
          contact.senderId ||
          contact.receiverId;

        return id?.toString() === contactUserId?.toString()
          ? { ...contact, status }
          : contact;
      })
    );
  };

  socket?.on("userStatusUpdate", handleStatusUpdate);
  socket?.emit("requestAllUserStatuses");

  return () => {
    socket?.off("userStatusUpdate", handleStatusUpdate);
  };
}, [socket]);


  // Fetch all contacts
  useEffect(() => {
    if (!userId) return;

    axios.get(`${BackendURL}/api/contacts/${userId}`)
      .then((res) => {
        if (Array.isArray(res.data)) {
          setAllContacts(res.data);
        }
      })
      .catch(console.error);
  }, [userId]);

  // Fetch chat contacts with status
  useEffect(() => {
    if (!userId || !socket) return;

    axios.get(`${BackendURL}/api/chats/contacts/${userId}`)
      .then((res) => {
        if (Array.isArray(res.data)) {
          const contactsWithStatus = res.data.map(contact => ({
  ...contact,
  status: "offline",
  userId: contact.userId?._id 
          || contact.senderId?._id 
          || contact.receiverId?._id 
          || contact.userId 
          || contact.senderId 
          || contact.receiverId
}));

          setContacts(contactsWithStatus);
          
          // Request status for each contact
          contactsWithStatus.forEach(contact => {
            if (contact.userId) {
              socket?.emit("requestUserStatus", contact.userId);
            }
          });
        }
      })
      .catch(console.error);
  }, [socket, userId]);
  
  // Handle unread messages updates
  useEffect(() => {
    if (!socket) return;

    const handleContactsUpdate = ({ chatId, unreadMessages }) => {
      setContacts(prevContacts =>
        prevContacts.map(contact =>
          contact.chatId === chatId ? { ...contact, unreadMessages } : contact
        )
      );
    };

    socket?.on("contactsUpdate", handleContactsUpdate);
    return () => socket?.off("contactsUpdate", handleContactsUpdate);
  }, [socket]);

  const handleContactClick = (chatId) => {
    navigate(`/user/chat?chatId=${encodeURIComponent(chatId)}`);
  };

  const handleNewChatClick = async (phoneNo) => {
    try {
      const res = await axios.post(`${BackendURL}/api/chats/find-or-create`, {
        userId,
        phoneNo
      });

      if (res.data?.chatId) {
        navigate(`/user/chat?chatId=${encodeURIComponent(res.data.chatId)}`);
      }
    } catch (err) {
      console.error("Error starting chat:", err);
    }
  };

  const handleLogout = () => {
    if (socket) socket?.off("userStatusUpdate");
    logout();              
    navigate("/auth/login");
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Chats</h1>
        <div className="dashboard-actions">
          <button className="btn new-chat-btn" onClick={() => setShowNewChat(prev => !prev)}>
            <i className="fas fa-plus"></i> New Chat
          </button>
          <button className="btn logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>

      {showNewChat && (
        <div className="new-chat-modal">
          <div className="search-container">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              placeholder="Search contacts..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="contacts-list">
            {filteredContacts.length > 0 ? (
              filteredContacts.map((contact, idx) => (
                <div
                  key={idx}
                  onClick={() => handleNewChatClick(contact.phoneNo)}
                  className="contact-item"
                >
                  <div className="contact-avatar">
                    <i className="fas fa-user"></i>
                  </div>
                  <div className="contact-info">
                    <span className="contact-name">{contact.phoneNo}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-contacts">
                <i className="fas fa-user-friends"></i>
                <p>No contacts found</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="chats-container">
        <h3 className="chats-title">Recent Chats</h3>
        {contacts.length === 0 ? (
          <div className="no-chats">
            <i className="fas fa-comment-alt"></i>
            <p>No chats yet</p>
            <button className="btn start-chat-btn" onClick={() => setShowNewChat(true)}>
              Start a new chat
            </button>
          </div>
        ) : (
          <div className="chats-list">
            {contacts.map((contact, idx) => (
              <div
                key={idx}
                onClick={() => handleContactClick(contact.chatId)}
                className="chat-item"
              >
                <div className="chat-avatar" style={{ position: 'relative' }}>
                  <i className="fas fa-user"></i>
                  {contact.status === "online" && (
                    <span style={{
                      position: 'absolute',
                      bottom: '2px',
                      right: '2px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: '#4ad504',
                      border: '2px solid white',
                      zIndex: 10
                    }}></span>
                  )}
                </div>
                <div className="chat-info">
                  <div className="chat-header">
                    <span className="chat-name">{contact.name || contact.phoneNo}</span>
                    <span className="chat-time">{contact.lastMessageTime || ""}</span>
                  </div>
                  <div className="chat-preview">
                    <p className="chat-last-message">
                      {contact.lastMessage || "No messages yet"}
                    </p>
                    {contact.unreadMessages > 0 && (
                      <span className="unread-badge">{contact.unreadMessages}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

// CSS (should be in a separate file or styled-components)
const styles = `
.dashboard-container {
  max-width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f5f5f5;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: #075e54;
  color: white;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.dashboard-title {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
}

.dashboard-actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 8px 15px;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s;
}

.new-chat-btn {
  background-color: #128c7e;
  color: white;
}

.logout-btn {
  background-color: #ece5dd;
  color: #075e54;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.new-chat-modal {
  background-color: white;
  margin: 10px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
}

.search-container {
  position: relative;
  padding: 10px 15px;
  background-color: #f0f2f5;
}

.search-icon {
  position: absolute;
  left: 25px;
  top: 50%;
  transform: translateY(-50%);
  color: #667781;
}

.search-input {
  width: 100%;
  padding: 8px 15px 8px 35px;
  border: none;
  border-radius: 20px;
  background-color: white;
  font-size: 14px;
}

.contacts-list {
  max-height: 300px;
  overflow-y: auto;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.contact-item:hover {
  background-color: #f5f5f5;
}

.contact-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #dfe6e9;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  color: #555;
}

.contact-info {
  flex: 1;
}

.contact-name {
  font-weight: 500;
}

.no-contacts, .no-chats {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
  color: #667781;
}

.no-contacts i, .no-chats i {
  font-size: 50px;
  margin-bottom: 15px;
  color: #ddd;
}

.chats-container {
  flex: 1;
  background-color: white;
  margin: 10px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
}

.chats-title {
  padding: 15px;
  margin: 0;
  font-size: 18px;
  color: #075e54;
  border-bottom: 1px solid #f0f2f5;
}

.chats-list {
  overflow-y: auto;
  max-height: calc(100vh - 200px);
}

.chat-item {
  display: flex;
  padding: 12px 15px;
  border-bottom: 1px solid #f0f2f5;
  cursor: pointer;
  transition: background-color 0.2s;
}

.chat-item:hover {
  background-color: #f5f5f5;
}

.chat-avatar {
  position: relative;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #dfe6e9;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: #555;
}

.chat-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.chat-name {
  font-weight: 500;
}

.chat-time {
  font-size: 12px;
  color: #667781;
}

.chat-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-last-message {
  margin: 0;
  font-size: 14px;
  color: #667781;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.unread-badge {
  background-color: #25d366;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.start-chat-btn {
  margin-top: 15px;
  background-color: #075e54;
  color: white;
  padding: 10px 20px;
}

@media (max-width: 768px) {
  .dashboard-header {
    padding: 10px 15px;
  }
  
  .dashboard-title {
    font-size: 20px;
  }
  
  .btn {
    padding: 6px 12px;
    font-size: 14px;
  border-radius: 18px;
  }
  
  .chat-last-message {
    max-width: 150px;
  }
}

@media (max-width: 480px) {
  .dashboard-header {
    padding: 8px 10px;
  }
  
  .dashboard-title {
    font-size: 18px;
  }
  
  .btn {
    padding: 5px 10px;
    font-size: 12px;
  }
  
  .chat-item {
    padding: 10px;
  }
  
  .chat-avatar {
    width: 40px;
    height: 40px;
    margin-right: 8px;
  }
  
  .chat-last-message {
    max-width: 120px;
    font-size: 13px;
  }
}
`;

// Add styles to the document
const styleElement = document.createElement("style");
styleElement.innerHTML = styles;
document.head.appendChild(styleElement);