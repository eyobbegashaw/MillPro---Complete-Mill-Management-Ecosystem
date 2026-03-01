import React, { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { getUsers, saveUsers } from '../utils/storage';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const { showToast } = useNotification();

  useEffect(() => {
    document.title = 'MillPro - Contact';
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const usersData = getUsers();
    usersData.messages.push({
      id: Date.now(),
      ...formData,
      timestamp: new Date().toISOString(),
      read: false
    });

    saveUsers(usersData);

    showToast('Thank you for your message! We will get back to you soon.', 'success');
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <main>
      <section id="contact" className="section active">
        <div className="container">
          <h2 className="section-title">Contact Us</h2>
          <p className="section-subtitle">Get in touch with us</p>
          
          <div className="contact-container">
            <div className="contact-info">
              <div className="contact-item">
                <i className="fas fa-map-marker-alt"></i>
                <div>
                  <h3>Address</h3>
                  <p>Mill Street, Addis Ababa, Ethiopia</p>
                </div>
              </div>
              <div className="contact-item">
                <i className="fas fa-phone"></i>
                <div>
                  <h3>Phone</h3>
                  <p>+251 911 223344</p>
                </div>
              </div>
              <div className="contact-item">
                <i className="fas fa-envelope"></i>
                <div>
                  <h3>Email</h3>
                  <p>info@millpro.com</p>
                </div>
              </div>
              <div className="contact-item">
                <i className="fas fa-clock"></i>
                <div>
                  <h3>Working Hours</h3>
                  <p>Mon - Sat: 8:00 AM - 8:00 PM</p>
                  <p>Sunday: 9:00 AM - 6:00 PM</p>
                </div>
              </div>
            </div>
            
            <div className="contact-form">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <input 
                    type="text" 
                    id="name"
                    placeholder="Your Name" 
                    value={formData.name}
                    onChange={handleChange}
                    required 
                  />
                </div>
                <div className="form-group">
                  <input 
                    type="email" 
                    id="email"
                    placeholder="Your Email" 
                    value={formData.email}
                    onChange={handleChange}
                    required 
                  />
                </div>
                <div className="form-group">
                  <textarea 
                    id="message"
                    rows="5" 
                    placeholder="Your Message" 
                    value={formData.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-primary btn-block">
                  <i className="fas fa-paper-plane"></i> Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Contact;