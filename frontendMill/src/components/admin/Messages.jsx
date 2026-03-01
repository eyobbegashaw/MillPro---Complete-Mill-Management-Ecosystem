import React, { useState, useEffect } from 'react';
import { FaSearch, FaPlus, FaBullhorn, FaPaperPlane } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { getUsers, saveUsers } from '../../utils/storage';
import { formatTime } from '../../utils/helpers';
import Modal from '../common/Modal';

const Messages = () => {
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTo, setBroadcastTo] = useState('all');

  const { user } = useAuth();
  const { showToast } = useNotification();

  useEffect(() => {
    loadMessagesData();
  }, []);

  const loadMessagesData = () => {
    const usersData = getUsers();
    setMessages(usersData.messages || []);
    loadContacts(usersData);
  };

  const loadContacts = (usersData) => {
    const customers = usersData.customers || [];
    const operators = usersData.operators || [];
    
    const allContacts = [
      ...customers.map(c => ({ ...c, type: 'customer' })),
      ...operators.map(o => ({ ...o, type: 'operator' }))
    ];

    // Add admin to contacts if not already there
    if (!allContacts.find(c => c.type === 'admin')) {
      const admin = usersData.admin?.[0];
      if (admin) {
        allContacts.push({ ...admin, type: 'admin' });
      }
    }

    setContacts(allContacts);
  };

  const getUnreadCount = (contactId) => {
    return messages.filter(msg => 
      msg.senderId === contactId && 
      msg.receiverId === user.id && 
      !msg.read
    ).length;
  };

  const getLastMessage = (contactId) => {
    const contactMessages = messages.filter(msg => 
      (msg.senderId === contactId && msg.receiverId === user.id) ||
      (msg.senderId === user.id && msg.receiverId === contactId)
    ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return contactMessages[0];
  };

  const filteredContacts = contacts.filter(contact => {
    const lastMessage = getLastMessage(contact.id);
    return contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (lastMessage?.content || '').toLowerCase().includes(searchTerm.toLowerCase());
  }).sort((a, b) => {
    const aLast = getLastMessage(a.id)?.timestamp || 0;
    const bLast = getLastMessage(b.id)?.timestamp || 0;
    return new Date(bLast) - new Date(aLast);
  });

  const selectContact = (contact) => {
    setSelectedContact(contact);
    markMessagesAsRead(contact.id);
  };

  const markMessagesAsRead = (contactId) => {
    const usersData = getUsers();
    let updated = false;

    usersData.messages = usersData.messages.map(msg => {
      if (msg.senderId === contactId && msg.receiverId === user.id && !msg.read) {
        updated = true;
        return { ...msg, read: true, readAt: new Date().toISOString() };
      }
      return msg;
    });

    if (updated) {
      saveUsers(usersData);
      setMessages(usersData.messages);
    }
  };

  const sendMessage = () => {
    if (!messageInput.trim() || !selectedContact) return;

    const usersData = getUsers();
    
    const newMessage = {
      id: Date.now(),
      senderId: user.id,
      receiverId: selectedContact.id,
      content: messageInput,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'text'
    };

    usersData.messages.push(newMessage);
    saveUsers(usersData);

    setMessages(usersData.messages);
    setMessageInput('');
    showToast('Message sent', 'success');
  };

  const sendBroadcast = () => {
    if (!broadcastMessage.trim()) return;

    const usersData = getUsers();
    let recipients = [];

    if (broadcastTo === 'all') {
      recipients = [...(usersData.customers || []), ...(usersData.operators || [])];
    } else if (broadcastTo === 'customers') {
      recipients = usersData.customers || [];
    } else if (broadcastTo === 'operators') {
      recipients = usersData.operators || [];
    }

    recipients.forEach(recipient => {
      usersData.messages.push({
        id: Date.now() + Math.random(),
        senderId: user.id,
        receiverId: recipient.id,
        content: broadcastMessage,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'broadcast'
      });
    });

    saveUsers(usersData);
    setMessages(usersData.messages);
    setBroadcastMessage('');
    showToast(`Broadcast sent to ${recipients.length} recipients`, 'success');
  };

  const getContactMessages = () => {
    if (!selectedContact) return [];
    
    return messages.filter(msg => 
      (msg.senderId === selectedContact.id && msg.receiverId === user.id) ||
      (msg.senderId === user.id && msg.receiverId === selectedContact.id)
    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  };

  const contactMessages = getContactMessages();

  return (
    <>
      <div className="section-header">
        <h2>Messages</h2>
        <div className="section-actions">
          <button className="btn btn-primary" onClick={() => setShowNewMessageModal(true)}>
            <FaPlus /> New Message
          </button>
        </div>
      </div>

      <div className="messages-container">
        {/* Contacts List */}
        <div className="contacts-list-panel">
          <div className="contacts-header">
            <div className="search-box">
              <FaSearch />
              <input 
                type="text" 
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="contacts-list">
            {filteredContacts.map(contact => {
              const unreadCount = getUnreadCount(contact.id);
              const lastMessage = getLastMessage(contact.id);

              return (
                <div
                  key={contact.id}
                  className={`contact-item ${selectedContact?.id === contact.id ? 'active' : ''}`}
                  onClick={() => selectContact(contact)}
                >
                  <div className="contact-avatar">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=${contact.type === 'admin' ? '4CAF50' : contact.type === 'operator' ? '2196F3' : 'FF9800'}&color=fff`} 
                      alt={contact.name} 
                    />
                  </div>
                  <div className="contact-info">
                    <h4>{contact.name}</h4>
                    <p>{lastMessage?.content || 'No messages yet'}</p>
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
        <div className="chat-area">
          {selectedContact ? (
            <>
              <div className="chat-header">
                <div className="chat-user">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedContact.name)}&background=${selectedContact.type === 'admin' ? '4CAF50' : selectedContact.type === 'operator' ? '2196F3' : 'FF9800'}&color=fff`} 
                    alt={selectedContact.name} 
                  />
                  <div>
                    <h4>{selectedContact.name}</h4>
                    <p>{selectedContact.type === 'admin' ? 'System Admin' : selectedContact.type === 'operator' ? 'Operator' : 'Customer'}</p>
                  </div>
                </div>
              </div>

              <div className="chat-messages">
                {contactMessages.map(msg => (
                  <div key={msg.id} className={`message ${msg.senderId === user.id ? 'sent' : 'received'}`}>
                    <div className="message-content">{msg.content}</div>
                    <div className="message-time">{formatTime(msg.timestamp)}</div>
                  </div>
                ))}
              </div>

              <div className="chat-input">
                <textarea 
                  placeholder="Type your message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                />
                <button 
                  className="btn btn-primary" 
                  onClick={sendMessage}
                  disabled={!messageInput.trim()}
                >
                  <FaPaperPlane />
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <FaSearch />
              <h3>Select a contact to start messaging</h3>
            </div>
          )}
        </div>

        {/* Broadcast Panel */}
        <div className="broadcast-panel">
          <h4>Broadcast Message</h4>
          <div className="broadcast-form">
            <select 
              value={broadcastTo} 
              onChange={(e) => setBroadcastTo(e.target.value)}
            >
              <option value="all">All Users</option>
              <option value="customers">All Customers</option>
              <option value="operators">All Operators</option>
            </select>
            <textarea 
              placeholder="Type broadcast message..."
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              rows="4"
            />
            <button 
              className="btn btn-primary btn-block" 
              onClick={sendBroadcast}
              disabled={!broadcastMessage.trim()}
            >
              <FaBullhorn /> Send Broadcast
            </button>
          </div>
        </div>
      </div>

      {/* New Message Modal */}
      <Modal 
        isOpen={showNewMessageModal} 
        onClose={() => setShowNewMessageModal(false)}
        title="New Message"
      >
        <form onSubmit={(e) => { e.preventDefault(); setShowNewMessageModal(false); }}>
          <div className="form-group">
            <label htmlFor="recipient">To</label>
            <select id="recipient" required>
              <option value="">Select Recipient</option>
              {contacts.map(contact => (
                <option key={contact.id} value={contact.id}>
                  {contact.name} ({contact.type})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="subject">Subject</label>
            <input type="text" id="subject" required />
          </div>
          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea id="message" rows="5" required></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="type">Message Type</label>
            <select id="type">
              <option value="general">General Inquiry</option>
              <option value="order">Order Related</option>
              <option value="complaint">Complaint</option>
              <option value="suggestion">Suggestion</option>
              <option value="feedback">Feedback</option>
            </select>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => setShowNewMessageModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Send Message</button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default Messages;