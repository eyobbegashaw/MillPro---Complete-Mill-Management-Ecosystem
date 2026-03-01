import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import api from '../../services/api';
import { formatTime } from '../../utils/formatters';
import Spinner from '../common/Spinner';
import { toast } from 'react-toastify';
import './DriverDashboard.css';

const DriverMessages = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typing, setTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('new-message', handleNewMessage);
      socket.on('user-typing', handleUserTyping);
      
      return () => {
        socket.off('new-message');
        socket.off('user-typing');
      };
    }
  }, [socket, currentConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/messages/conversations');
      setConversations(response.data.data);
      
      if (response.data.data.length > 0) {
        loadMessages(response.data.data[0]._id);
      }
    } catch (error) {
      console.error('Load conversations error:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const response = await api.get(`/messages/conversations/${conversationId}/messages`);
      setMessages(response.data.data);
      setCurrentConversation(
        conversations.find(c => c._id === conversationId)
      );
      
      // Mark messages as read
      await api.put(`/messages/conversations/${conversationId}/read`);
    } catch (error) {
      console.error('Load messages error:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleNewMessage = (data) => {
    if (data.conversationId === currentConversation?._id) {
      setMessages(prev => [...prev, data.message]);
    }
    
    // Update conversation list
    setConversations(prev =>
      prev.map(conv =>
        conv._id === data.conversationId
          ? { ...conv, lastMessage: data.message, lastMessageAt: new Date() }
          : conv
      )
    );
  };

  const handleUserTyping = (data) => {
    if (data.userId !== user.id && data.conversationId === currentConversation?._id) {
      setTyping(data.isTyping);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentConversation) return;

    try {
      const response = await api.post(
        `/messages/conversations/${currentConversation._id}/messages`,
        { content: newMessage }
      );

      setNewMessage('');
      socket?.emit('stop-typing', {
        conversationId: currentConversation._id,
        recipientId: currentConversation.participants.find(p => p._id !== user.id)?._id
      });
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!currentConversation) return;

    if (typingTimeout) clearTimeout(typingTimeout);

    socket?.emit('typing', {
      conversationId: currentConversation._id,
      recipientId: currentConversation.participants.find(p => p._id !== user.id)?._id,
      isTyping: true
    });

    setTypingTimeout(
      setTimeout(() => {
        socket?.emit('typing', {
          conversationId: currentConversation._id,
          recipientId: currentConversation.participants.find(p => p._id !== user.id)?._id,
          isTyping: false
        });
      }, 1000)
    );
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !currentConversation) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post(
        `/messages/conversations/${currentConversation._id}/upload`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setMessages(prev => [...prev, response.data]);
    } catch (error) {
      console.error('Upload file error:', error);
      toast.error('Failed to upload file');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) return <Spinner fullPage />;

  return (
    <div className="driver-dashboard">
      <DriverSidebar />
      
      <div className="driver-main">
        <DriverHeader />
        
        <div className="dashboard-content">
          <div className="messages-container">
            {/* Conversations List */}
            <div className="conversations-panel">
              <div className="panel-header">
                <h3>Messages</h3>
                <button className="btn btn-sm btn-primary">
                  <i className="fas fa-plus"></i>
                </button>
              </div>
              
              <div className="conversations-list">
                {conversations.map(conv => {
                  const otherUser = conv.participants.find(p => p._id !== user.id);
                  const unreadCount = conv.unreadCount?.[user.id] || 0;
                  
                  return (
                    <div
                      key={conv._id}
                      className={`conversation-item ${currentConversation?._id === conv._id ? 'active' : ''}`}
                      onClick={() => loadMessages(conv._id)}
                    >
                      <div className="conversation-avatar">
                        <img
                          src={otherUser?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser?.name || 'User')}&background=2196F3&color=fff`}
                          alt={otherUser?.name}
                        />
                      </div>
                      <div className="conversation-info">
                        <h4>{otherUser?.name}</h4>
                        <p className="last-message">
                          {conv.lastMessage?.content?.substring(0, 30)}
                          {conv.lastMessage?.content?.length > 30 ? '...' : ''}
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <span className="unread-badge">{unreadCount}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chat Area */}
            <div className="chat-panel">
              {currentConversation ? (
                <>
                  <div className="chat-header">
                    <div className="chat-user">
                      <img
                        src={currentConversation.participants.find(p => p._id !== user.id)?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentConversation.participants.find(p => p._id !== user.id)?.name || 'User')}&background=2196F3&color=fff`}
                        alt="User"
                      />
                      <div className="user-info">
                        <h4>{currentConversation.participants.find(p => p._id !== user.id)?.name}</h4>
                        <p>{typing ? 'Typing...' : 'Online'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="chat-messages">
                    {messages.map(msg => (
                      <div
                        key={msg._id}
                        className={`message ${msg.sender._id === user.id ? 'sent' : 'received'}`}
                      >
                        <div className="message-content">{msg.content}</div>
                        {msg.attachments?.map((att, idx) => (
                          <div key={idx} className="message-attachment">
                            {att.type === 'image' ? (
                              <img src={att.url} alt="attachment" />
                            ) : (
                              <a href={att.url} target="_blank" rel="noopener noreferrer">
                                <i className="fas fa-file"></i> {att.filename}
                              </a>
                            )}
                          </div>
                        ))}
                        <div className="message-time">
                          {formatTime(msg.createdAt)}
                          {msg.sender._id === user.id && (
                            <span className="read-status">
                              {msg.readBy?.length > 0 ? (
                                <i className="fas fa-check-double"></i>
                              ) : (
                                <i className="fas fa-check"></i>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="chat-input-area">
                    <div className="input-tools">
                      <button
                        className="btn btn-icon"
                        onClick={() => fileInputRef.current.click()}
                      >
                        <i className="fas fa-paperclip"></i>
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                      />
                    </div>
                    <div className="message-input-wrapper">
                      <textarea
                        value={newMessage}
                        onChange={handleTyping}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        rows="1"
                      />
                      <button
                        className="btn btn-primary"
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                      >
                        <i className="fas fa-paper-plane"></i>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="no-conversation">
                  <i className="fas fa-comments"></i>
                  <h3>No Conversation Selected</h3>
                  <p>Choose a conversation to start messaging</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverMessages;