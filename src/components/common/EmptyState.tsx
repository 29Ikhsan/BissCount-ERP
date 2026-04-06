'use client';

import React from 'react';
import { PlusCircle, SearchX } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  description, 
  icon, 
  actionLabel, 
  actionHref 
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {icon || <SearchX size={48} />}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      
      {actionLabel && actionHref && (
        <Link href={actionHref} className="empty-state-btn">
          <PlusCircle size={18} />
          {actionLabel}
        </Link>
      )}

      <style jsx>{`
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 24px;
          text-align: center;
          background: #ffffff;
          border: 1px dashed #e2e8f0;
          border-radius: 16px;
          margin: 20px 0;
        }

        .empty-state-icon {
          color: #cbd5e1;
          margin-bottom: 20px;
          background: #f8fafc;
          padding: 24px;
          border-radius: 50%;
        }

        .empty-state-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 8px;
        }

        .empty-state-description {
          font-size: 0.875rem;
          color: #64748b;
          max-width: 380px;
          line-height: 1.5;
          margin-bottom: 24px;
        }

        .empty-state-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #0f172a;
          color: #ffffff;
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          text-decoration: none;
          transition: transform 0.2s, background 0.2s;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .empty-state-btn:hover {
          background: #1e293b;
          transform: translateY(-1px);
        }

        .empty-state-btn:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

export default EmptyState;
