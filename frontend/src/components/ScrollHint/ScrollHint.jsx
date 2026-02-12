import React from "react";
import { ChevronDown } from "lucide-react";
import "./ScrollHint.css";

const ScrollHint = ({ text = "Scroll Down", className = "" }) => {
  return (
    <div className={`scroll-hint-wrapper ${className}`}>
      <span className="scroll-hint-text">{text}</span>
      <ChevronDown className="scroll-hint-icon" size={20} />
    </div>
  );
};

export default ScrollHint;
