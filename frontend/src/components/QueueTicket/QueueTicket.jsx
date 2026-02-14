import React, { useState } from "react";
import html2canvas from "html2canvas";
import Swal from "sweetalert2";
import "./QueueTicket.css";

const QueueTicket = ({ queueNumber, department, dateTime }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const userRole = localStorage.getItem("role");

  const handlePrint = () => {
    window.print();

    setTimeout(() => {
      Swal.fire({
        icon: "success",
        title: "Ticket Printed Successfully!",
        text: "Your queue ticket has been sent to the printer.",
        confirmButtonColor: "#667eea",
        timer: 2000,
        timerProgressBar: true,
      });
    }, 500);
  };

  const handleSaveAsImage = async () => {
    setIsProcessing(true);
    try {
      const ticketElement = document.getElementById("ticket");

      if (!ticketElement) {
        console.error("Ticket element not found");
        return;
      }

      const canvas = await html2canvas(ticketElement, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
      });

      canvas.toBlob((blob) => {
        if (!blob) {
          console.error("Failed to create image blob");
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "queue-ticket.png";

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setIsProcessing(false);

        Swal.fire({
          icon: "success",
          title: "Ticket Saved Successfully!",
          text: "Your queue ticket has been downloaded to your device.",
          confirmButtonColor: "#f5576c",
          timer: 2000,
          timerProgressBar: true,
        });
      }, "image/png");
    } catch (error) {
      console.error("Error saving ticket as image:", error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="queue-ticket-wrapper">
      <div id="ticket" className="ticket-container">
        <div className="ticket-header">
          <h2>Queue Ticket</h2>
          <div className="municipality-name">Municipality of Calape</div>
        </div>

        <div className="ticket-body">
          <div className="ticket-field">
            <label>Queue Number</label>
            <div className="ticket-value queue-number">{queueNumber}</div>
          </div>

          <div className="ticket-field">
            <label>Department</label>
            <div className="ticket-value">{department}</div>
          </div>

          <div className="ticket-field">
            <label>Date & Time</label>
            <div className="ticket-value">{dateTime}</div>
          </div>
        </div>

        <div className="ticket-footer">
          <p>Please keep this ticket and present it when called.</p>
          <p>Thank you for using our service!</p>
        </div>
      </div>

      <div className="ticket-actions">
        {userRole === "staff" && (
          <button
            onClick={handlePrint}
            className="action-btn print-btn"
            aria-label="Print ticket"
          >
            <span className="btn-icon">🖨️</span>
            Print Ticket
          </button>
        )}

        {userRole === "client" && (
          <button
            onClick={handleSaveAsImage}
            className="action-btn save-btn"
            disabled={isProcessing}
            aria-label="Save ticket as image"
          >
            <span className="btn-icon">💾</span>
            {isProcessing ? "Saving..." : "Save Ticket"}
          </button>
        )}
      </div>
    </div>
  );
};

export default QueueTicket;
