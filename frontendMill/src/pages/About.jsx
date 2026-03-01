import React, { useEffect } from 'react';

const About = () => {
  useEffect(() => {
    document.title = 'MillPro - About';
  }, []);

  return (
    <main>
      <section id="about" className="section active">
        <div className="container">
          <h2 className="section-title animate__animated">About Our System</h2>
          <p className="section-subtitle">Revolutionizing Mill Management with Technology</p>
          
          <div className="cards-container">
            <div className="card animate__animated">
              <div className="card-icon">
                <i className="fas fa-cogs"></i>
              </div>
              <h3>Smart Management</h3>
              <p>Automated inventory tracking, real-time updates, and efficient order processing for mill operations.</p>
            </div>
            
            <div className="card animate__animated">
              <div className="card-icon">
                <i className="fas fa-users"></i>
              </div>
              <h3>Multi-User Platform</h3>
              <p>Separate interfaces for admin, operators, and customers with role-based access control.</p>
            </div>
            
            <div className="card animate__animated">
              <div className="card-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <h3>Real-time Analytics</h3>
              <p>Comprehensive reports and analytics for better decision making and business growth.</p>
            </div>
            
            <div className="card animate__animated">
              <div className="card-icon">
                <i className="fas fa-mobile-alt"></i>
              </div>
              <h3>Easy Ordering</h3>
              <p>Customers can browse products, place orders, and track progress from anywhere.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default About;