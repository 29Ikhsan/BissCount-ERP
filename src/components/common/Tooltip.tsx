'use client';

import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="tooltip-wrapper"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children || <HelpCircle size={14} className="tooltip-icon" />}
      
      {isVisible && (
        <div className="tooltip-box">
          {content}
          <div className="tooltip-arrow" />
        </div>
      )}

      <style jsx>{`
        .tooltip-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
          cursor: help;
        }

        .tooltip-icon {
          color: #94a3b8;
          transition: color 0.2s;
        }

        .tooltip-wrapper:hover .tooltip-icon {
          color: #3b82f6;
        }

        .tooltip-box {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(-10px);
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(4px);
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 500;
          white-space: normal;
          width: max-content;
          max-width: 200px;
          z-index: 100;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
          animation: tooltip-fade-in 0.2s ease-out;
          line-height: 1.4;
          text-align: center;
        }

        .tooltip-arrow {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-width: 6px;
          border-style: solid;
          border-color: rgba(15, 23, 42, 0.9) transparent transparent transparent;
        }

        @keyframes tooltip-fade-in {
          from { opacity: 0; transform: translateX(-50%) translateY(0); }
          to { opacity: 1; transform: translateX(-50%) translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default Tooltip;
