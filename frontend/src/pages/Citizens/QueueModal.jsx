import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  Calendar,
  Building2,
  Clock,
  ClipboardList,
  Printer,
  X,
  Lightbulb,
} from "lucide-react";
import { Sparkles, PartyPopper } from "lucide-react";
import "./styles/QueueModal.css";

const QueueModal = ({ queueNumber, department, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    
    document.body.style.overflow = "hidden";

    const timeouts = [
      setTimeout(() => setIsVisible(true), 100),
      setTimeout(() => setShowCelebration(true), 300),
      setTimeout(() => setShowCelebration(false), 2300),
    ];

    return () => {
      document.body.style.overflow = "unset";
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, []);

  const handlePrint = () => {
    setIsPrinting(true);

    setTimeout(() => {
      const printContent = `
        Municipality of Calape - Service Queue Ticket
        =============================================
        Queue Number: ${queueNumber}
        Department: ${department}
        Date & Time: ${new Date().toLocaleString()}
        Status: Waiting
        
        Please keep this ticket and present it when called.
        Thank you for using our services!
      `;
      
      console.log("Print Content:", printContent);
      alert("Ticket printed successfully! (Frontend simulation)");
      setIsPrinting(false);
    }, 2000);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      document.body.style.overflow = "unset";
      onClose();
    }, 300);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const currentDateTime = new Date().toLocaleString();

  return (
    <div
      className={`modal-overlay ${isVisible ? "visible" : ""}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div className={`modal-content ${isVisible ? "visible" : ""}`}>
        {showCelebration && (
          <div className="celebration-container" aria-hidden="true">
            <div className="confetti confetti-1">
              <PartyPopper />
            </div>
            <div className="confetti confetti-2">
              <Sparkles />
            </div>
            <div className="confetti confetti-3">
              <PartyPopper />
            </div>
            <div className="confetti confetti-4">
              <Sparkles />
            </div>
            <div className="confetti confetti-5">
              <PartyPopper />
            </div>
            <div className="confetti confetti-6">
              <Sparkles />
            </div>
          </div>
        )}

        <div className="modal-header">
          <div className="success-icon" aria-hidden="true">
            <CheckCircle />
          </div>
          <h2 id="modal-title" className="modal-title">
            Queue Number Generated!
          </h2>
        </div>

          <div className="queue-display-section">
            <div className="queue-label" aria-label="Your queue number is">
              YOUR QUEUE NUMBER
            </div>
            <div
              className="queue-number-display"
              aria-live="polite"
              aria-label={`Queue number ${queueNumber}`}
            >
              {queueNumber}
            </div>
          <div className="queue-pulse-ring" aria-hidden="true"></div>
        </div>

        <div className="details-section">
          <div className="detail-card">
            <div className="detail-item">
              <span className="detail-icon" aria-hidden="true">
                <Calendar />
              </span>
              <div className="detail-content">
                <span className="detail-label">Date & Time</span>
                <span className="detail-value">{currentDateTime}</span>
              </div>
            </div>

            <div className="detail-item">
              <span className="detail-icon" aria-hidden="true">
                <Building2 />
              </span>
              <div className="detail-content">
                <span className="detail-label">Department</span>
                <span className="detail-value">{department}</span>
              </div>
            </div>

            <div className="detail-item">
              <span className="detail-icon" aria-hidden="true">
                <Clock />
              </span>
              <div className="detail-content">
                <span className="detail-label">Status</span>
                <span className="detail-value status-waiting">Waiting</span>
              </div>
            </div>
          </div>
        </div>

        <div className="instructions-section">
          <div className="instruction-card">
            <div className="instruction-icon" aria-hidden="true">
              <ClipboardList />
            </div>
            <div className="instruction-content">
              <p className="instruction-title">Please be seated</p>
              <p className="instruction-text">
                You will be served shortly. Keep this number visible for municipal staff.
              </p>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button
            onClick={handlePrint}
            className={`print-btn ${isPrinting ? "printing" : ""}`}
            disabled={isPrinting}
            aria-label={isPrinting ? "Printing ticket" : "Print service ticket"}
          >
            <span className="btn-content">
              <span className="btn-icon">
                <Printer />
              </span>
              <span>Print Ticket</span>
            </span>
            <span className="btn-loading">
              <div className="loading-spinner" aria-hidden="true"></div>
              <span>Printing...</span>
            </span>
          </button>

          <button
            onClick={handleClose}
            className="close-btn"
            aria-label="Close modal"
          >
            <span className="btn-icon">
              <X />
            </span>
            <span>Close</span>
          </button>
        </div>

        <div className="tips-section">
          <p className="tip-text">
            <Lightbulb className="tip-icon" aria-hidden="true" />
            <strong>Tip:</strong> Save a screenshot or print this ticket for
            your municipal service records
          </p>
        </div>
      </div>
    </div>
  );
};

export default QueueModal;