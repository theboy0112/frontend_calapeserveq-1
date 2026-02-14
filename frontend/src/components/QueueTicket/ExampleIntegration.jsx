// Example: How to integrate QueueTicket into your existing QueueModal.jsx

import React from "react";
import QueueTicket from "../QueueTicket/QueueTicket";
import { X } from "lucide-react";
import "./QueueModal.css";

const QueueModalWithTicket = ({ queueNumber, department, onClose }) => {
  const currentDateTime = new Date().toLocaleString();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="close-btn"
          aria-label="Close modal"
        >
          <X />
        </button>

        {/* Use the new QueueTicket component */}
        <QueueTicket
          queueNumber={queueNumber}
          department={department}
          dateTime={currentDateTime}
        />
      </div>
    </div>
  );
};

export default QueueModalWithTicket;
