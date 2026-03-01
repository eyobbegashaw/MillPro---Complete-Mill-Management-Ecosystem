import React, { useState, useEffect } from 'react';
import { FaSearch, FaPlus, FaPaperPlane, FaImage, FaPaperclip, FaCheckDouble } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { getUsers, saveUsers } from '../../utils/storage';
import { formatTime } from '../../utils/helpers';
import Modal from '../common/Modal';

const CustomerMessages = () => {
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [newMessageData, setNewMessageData] = useState({
    to: '',
    subject: '',
    content: '',
    type: 'general'
  });

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
    const admin = usersData.admin?.[0];
    const operators = usersData.operators || [];
    
    const contacts = [];

    // Add admin
    if (admin) {
      contacts.push({ ...admin, type: 'admin' });
    }

    // Add operators that have interacted with this customer
    const customerOrders = (usersData.orders || []).filter(o => o.customerId === user?.id);
    const operatorIds = [...new Set(customerOrders.map(o => o.assignedTo).filter(id => id))];
    
    operators.forEach(operator => {
      if (operatorIds.includes(operator.id)) {
        contacts.push({ ...operator, type: 'operator' });
      }
    });

    setContacts(contacts);
  };

  const getUnreadCount = (contactId) => {
    return messages.filter(msg => 
      msg.senderId === contactId && 
      msg.receiverId === user?.id && 
      !msg.read
    ).length;
  };

  const getLastMessage = (contactId) => {
    const contactMessages = messages.filter(msg => 
      (msg.senderId === contactId && msg.receiverId === user?.id) ||
      (msg.senderId === user?.id && msg.receiverId === contactId)
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
      if (msg.senderId === contactId && msg.receiverId === user?.id && !msg.read) {
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

  const markAllAsRead = () => {
    const usersData = getUsers();
    
    usersData.messages = usersData.messages.map(msg => {
      if (msg.receiverId === user?.id && !msg.read) {
        return { ...msg, read: true, readAt: new Date().toISOString() };
      }
      return msg;
    });

    saveUsers(usersData);
    setMessages(usersData.messages);
    showToast('All messages marked as read', 'success');
  };

  const sendMessage = () => {
    if (!messageInput.trim() || !selectedContact) return;

    const usersData = getUsers();
    
    const newMessage = {
      id: Date.now(),
      senderId: user?.id,
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

  const handleNewMessage = (e) => {
    e.preventDefault();

    if (!newMessageData.to || !newMessageData.subject || !newMessageData.content) {
      showToast('Please fill in all fields', 'warning');
      return;
    }

    const usersData = getUsers();
    
    const newMessage = {
      id: Date.now(),
      senderId: user?.id,
      receiverId: newMessageData.to,
      subject: newMessageData.subject,
      content: newMessageData.content,
      type: newMessageData.type,
      timestamp: new Date().toISOString(),
      read: false
    };

    usersData.messages.push(newMessage);
    saveUsers(usersData);

    setShowNewMessageModal(false);
    setNewMessageData({ to: '', subject: '', content: '', type: 'general' });
    loadMessagesData();
    showToast('Message sent successfully', 'success');
  };

  const getContactMessages = () => {
    if (!selectedContact) return [];
    
    return messages.filter(msg => 
      (msg.senderId === selectedContact.id && msg.receiverId === user?.id) ||
      (msg.senderId === user?.id && msg.receiverId === selectedContact.id)
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
          <button className="btn btn-outline" onClick={markAllAsRead}>
            <FaCheckDouble /> Mark All Read
          </button>
        </div>
      </div>

      <div className="messages-container">
        {/* Contacts Panel */}
        <div className="contacts-panel">
          <div className="contacts-header">
            <div className="search-box">
              <FaSearch />
              <input 
                type="text" 
                placeholder="Search messages..."
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
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=${contact.type === 'admin' ? '4CAF50' : '2196F3'}&color=fff`} 
                      alt={contact.name} 
                    />
                  </div>
                  <div className="contact-info">
                    <h4>{contact.name}</h4>
                    <p>{lastMessage?.content || 'No messages yet'}</p>
                  </div>
                  {unreadCount > 0 && (
                    <div className="unread-indicator"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Panel */}
        <div className="chat-panel">
          {selectedContact ? (
            <>
              <div className="chat-header">
                <div className="chat-user">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedContact.name)}&background=${selectedContact.type === 'admin' ? '4CAF50' : '2196F3'}&color=fff`} 
                    alt={selectedContact.name} 
                  />
                  <div className="chat-user-info">
                    <h4>{selectedContact.name}</h4>
                    <p>{selectedContact.type === 'admin' ? 'System Admin' : 'Operator'}</p>
                  </div>
                </div>
              </div>

              <div className="chat-messages">
                {contactMessages.map(msg => (
                  <div key={msg.id} className={`message ${msg.senderId === user?.id ? 'sent' : 'received'}`}>
                    <div className="message-content">{msg.content}</div>
                    <div className="message-time">{formatTime(msg.timestamp)}</div>
                  </div>
                ))}
              </div>

              <div className="chat-input">
                <div className="input-tools">
                  <button className="btn btn-icon" title="Attach Image">
                    <FaImage />
                  </button>
                  <button className="btn btn-icon" title="Attach File">
                    <FaPaperclip />
                  </button>
                </div>
                <div className="message-input">
                  <textarea 
                    placeholder="Type your message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    rows="1"
                  />
                  <button 
                    className="btn btn-primary" 
                    onClick={sendMessage}
                    disabled={!messageInput.trim()}
                  >
                    <FaPaperPlane />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <FaSearch />
              <h3>Select a contact to start messaging</h3>
            </div>
          )}
        </div>

        {/* Message Info Panel */}
        <div className="message-info-panel">
          {selectedContact ? (
            <>
              <h4>Contact Information</h4>
              <p><strong>Name:</strong> {selectedContact.name}</p>
              <p><strong>Type:</strong> {selectedContact.type === 'admin' ? 'System Admin' : 'Operator'}</p>
              <p><strong>Email:</strong> {selectedContact.email}</p>
              {selectedContact.phone && (
                <p><strong>Phone:</strong> {selectedContact.phone}</p>
              )}
              <hr />
              <button className="btn btn-sm btn-outline btn-block">
                <FaPlus /> New Order with {selectedContact.type === 'admin' ? 'Admin' : 'Operator'}
              </button>
            </>
          ) : (
            <div className="empty-state">
              <FaSearch />
              <p>Select a contact to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* New Message Modal */}
      <Modal 
        isOpen={showNewMessageModal} 
        onClose={() => setShowNewMessageModal(false)}
        title="New Message"
      >
        <form onSubmit={handleNewMessage}>
          <div className="form-group">
            <label htmlFor="messageTo">To *</label>
            <select 
              id="messageTo" 
              value={newMessageData.to}
              onChange={(e) => setNewMessageData({...newMessageData, to: e.target.value})}
              required
            >
              <option value="">Select Recipient</option>
              {contacts.map(contact => (
                <option key={contact.id} value={contact.id}>
                  {contact.name} ({contact.type === 'admin' ? 'Admin' : 'Operator'})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="messageSubject">Subject *</label>
            <input 
              type="text" 
              id="messageSubject" 
              value={newMessageData.subject}
              onChange={(e) => setNewMessageData({...newMessageData, subject: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="messageType">Message Type</label>
            <select 
              id="messageType"
              value={newMessageData.type}
              onChange={(e) => setNewMessageData({...newMessageData, type: e.target.value})}
            >
              <option value="general">General Inquiry</option>
              <option value="order">Order Related</option>
              <option value="complaint">Complaint</option>
              <option value="suggestion">Suggestion</option>
              <option value="feedback">Feedback</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="messageContent">Message *</label>
            <textarea 
              id="messageContent" 
              rows="5" 
              value={newMessageData.content}
              onChange={(e) => setNewMessageData({...newMessageData, content: e.target.value})}
              required
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => setShowNewMessageModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <FaPaperPlane /> Send Message
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default CustomerMessages;