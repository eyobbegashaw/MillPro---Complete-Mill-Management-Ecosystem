import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import heroImage from '../assets/images/hero-image.jpg';

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'MillPro - Home';
  }, []);

  return (
    <main>
      <section id="home" className="section active">
        <div className="hero animate__animated animate__fadeIn">
          <div className="hero-content">
            <h1 className="hero-title">Welcome to <span>MillPro</span></h1>
            <p className="hero-subtitle">Modern Mill Management & Ordering System</p>
            <p className="hero-description">
              Streamline your mill operations with our advanced management system. 
              Connect farmers, operators, and customers seamlessly.
            </p>
            <div className="hero-buttons">
              <button 
                onClick={() => navigate('/services')} 
                className="btn btn-primary btn-large"
              >
                <i className="fas fa-shopping-basket"></i> Order Now
              </button>
              <button 
                onClick={() => navigate('/about')} 
                className="btn btn-outline btn-large"
              >
                <i className="fas fa-info-circle"></i> Learn More
              </button>
            </div>
          </div>
          <div className="hero-image">
            <div className="floating-image">
              <img 
                src="https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="Mill Products" 
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;