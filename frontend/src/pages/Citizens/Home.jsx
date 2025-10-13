import React from "react";
import "./styles/Home.css";
import { useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaClipboardList,
  FaClock,
  FaCity,
  FaArrowRight,
} from "react-icons/fa";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

const Home = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/form");
  };

  return (
    <div className="home-container">
      <Header />

      <div className="home-main-content">  {/* CHANGED */}
        <div className="hero-section">
          <div className="hero-content">
            <div className="hero-badge">
              <FaCity className="badge-icon" />
              <span>Smart Municipal Services</span>
            </div>

            <h1 className="hero-title">
              Welcome to <span className="gradient-text">CalapeServeQ</span>
            </h1>

            <p className="hero-description">
              Skip the long wait times. Access municipal services faster and more
              efficiently with our intelligent queue management system.
            </p>

            <div className="card-container">
              <div className="feature-card">
                <FaUsers className="card-icon" />
                <h3>Priority Service</h3>
                <p>
                  Priority lanes for seniors, PWDs, and pregnant citizens with
                  dedicated assistance and support
                </p>
                <div className="card-accent"></div>
              </div>

              <div className="feature-card">
                <FaClipboardList className="card-icon" />
                <h3>Organized</h3>
                <p>
                  Smart queue management across all municipal departments with
                  real-time coordination and updates
                </p>
                <div className="card-accent"></div>
              </div>

              <div className="feature-card">
                <FaClock className="card-icon" />
                <h3>Time-Saving</h3>
                <p>
                  Easy check-in process with real-time updates, estimated wait
                  times, and instant notifications
                </p>
                <div className="card-accent"></div>
              </div>
            </div>

            <div className="cta-container">
              <button className="get-started-btn" onClick={handleGetStarted}>
                <span>Get Started</span>
                <FaArrowRight className="btn-icon" />
                <div className="btn-glow"></div>
              </button>
              <p className="cta-note">Join thousands of satisfied citizens</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <div className="background-elements">
        <div className="floating-element element-1"></div>
        <div className="floating-element element-2"></div>
        <div className="floating-element element-3"></div>
        <div className="floating-element element-4"></div>
      </div>
    </div>
  );
};

export default Home;