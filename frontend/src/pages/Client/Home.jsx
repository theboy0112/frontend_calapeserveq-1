import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Clock, Users, Zap, Heart, X, Star } from "lucide-react";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import "./styles/Home.css";


const Home = () => {
  const navigate = useNavigate();
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const features = [
    {
      icon: <Clock size={24} />,
      title: "Save Time",
      description: "No more waiting in long lines. Get your queue number instantly."
    },
    {
      icon: <Users size={24} />,
      title: "Real-time Updates",
      description: "Track your position and get notified when it's your turn."
    },
    {
      icon: <Zap size={24} />,
      title: "Easy & Fast",
      description: "Simple interface that gets you queued in seconds."
    }
  ];

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('Feedback submitted:', { rating, comment });

    // Reset form
    setRating(0);
    setComment('');
    setShowFeedback(false);
    setIsSubmitting(false);
  };

  const handleCloseFeedback = () => {
    setShowFeedback(false);
    setRating(0);
    setComment('');
  };

  return (
    <div className="home-wrapper">
      <Header />

      {/* Feedback Button */}
      <button
        className="home-feedback-trigger"
        onClick={() => setShowFeedback(true)}
        aria-label="Give feedback"
      >
        <Heart className="home-feedback-icon" size={20} />
        <span className="home-feedback-label">Feedback</span>
      </button>

      {/* Animated Background */}
      <div className="home-background-animation">
        <div className="home-bg-decoration home-decoration-1"></div>
        <div className="home-bg-decoration home-decoration-2"></div>
        <div className="home-bg-decoration home-decoration-3"></div>
      </div>

      <main className="home-main-content">
        {/* Hero Section */}
        <div className="home-hero-section">
          <h1 className="home-hero-title">
            <span className="home-gradient-text">CalapeServeQ</span>
          </h1>

          <button className="home-btn-secondary">
            <Sparkles className="home-sparkle-icon" size={18} />
            Smart Queueing System
          </button>

          <p className="home-hero-subtitle">
            Skip the physical queue. Get your digital number instantly
            and make the most of your time.
          </p>
        </div>

        {/* Features Grid */}
        <div className="home-features-grid">
          {features.map((feature, index) => (
            <div className="home-feature-card" key={index}>
              <div className={`home-feature-icon home-feature-icon-${index + 1}`}>
                {feature.icon}
              </div>
              <h3 className="home-feature-title">{feature.title}</h3>
              <p className="home-feature-description">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Get Started Button - Below Cards */}
        <div className="home-cta-buttons">
          <button className="home-btn-primary" onClick={() => navigate("/queue")}>
            Get Started
            <ArrowRight className="home-arrow-icon" size={20} />
          </button>
        </div>
      </main>

      {/* Feedback Modal */}
      {showFeedback && (
        <>
          <div className="home-modal-overlay" onClick={handleCloseFeedback} />
          <div className="home-feedback-modal">
            <div className="home-modal-header">
              <h2 className="home-modal-title">Share Your Feedback</h2>
              <button
                className="home-close-button"
                onClick={handleCloseFeedback}
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="home-feedback-form">
              <div className="home-rating-section">
                <label className="home-rating-label">How was your experience?</label>
                <div className="home-stars-container">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`home-star-button ${star <= (hoveredStar || rating) ? 'active' : ''}`}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      aria-label={`Rate ${star} stars`}
                    >
                      <Star size={40} fill={star <= (hoveredStar || rating) ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="home-comment-section">
                <label htmlFor="home-feedback-comment" className="home-comment-label">
                  Tell us more (optional)
                </label>
                <textarea
                  id="home-feedback-comment"
                  className="home-comment-textarea"
                  placeholder="Share your thoughts..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows="4"
                />
              </div>

              <button
                type="submit"
                className="home-submit-button"
                disabled={rating === 0 || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          </div>
        </>
      )}

      <Footer />
    </div>
  );
};

export default Home;