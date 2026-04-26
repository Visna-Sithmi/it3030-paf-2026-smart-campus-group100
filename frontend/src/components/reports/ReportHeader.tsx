import React from 'react';

interface ReportHeaderProps {
  title?: string;
  subtitle?: string;
  generatedDate?: Date;
  reportType?: string;
  organizationName?: string;
  logoUrl?: string;
}

const ReportHeader: React.FC<ReportHeaderProps> = ({
  title = "Student Enrollment Report",
  subtitle = "Official Administrative Report",
  generatedDate = new Date(),
  reportType = "Comprehensive Enrollment",
  organizationName = "Northbridge University",
  logoUrl = undefined
}) => {
  const formattedDate = generatedDate.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  return `
    <div class="official-header">
      <div class="university-name">${organizationName}</div>
      <div class="report-title">${title}</div>
      <div class="report-subtitle">${subtitle}</div>
      <div class="report-meta">
        <span class="report-type">${reportType}</span>
        <span class="report-date">Generated: ${formattedDate}</span>
      </div>
    </div>

    <style>
      .official-header {
        text-align: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 2px solid #002147;
      }
      
      .university-name {
        font-size: 24px;
        font-weight: bold;
        color: #002147;
        margin: 0;
        letter-spacing: 1px;
      }
      
      .report-title {
        font-size: 18px;
        font-weight: bold;
        color: #002147;
        margin-top: 8px;
        text-transform: uppercase;
      }
      
      .report-subtitle {
        font-size: 11px;
        color: #666;
        margin-top: 5px;
        font-style: italic;
      }
      
      .report-meta {
        display: flex;
        justify-content: center;
        gap: 15px;
        margin-top: 10px;
        padding-top: 8px;
        border-top: 1px dashed #cbd5e1;
      }
      
      .report-type {
        font-size: 9px;
        color: #002147;
        background: #e8edf2;
        padding: 3px 10px;
        border-radius: 20px;
      }
      
      .report-date {
        font-size: 9px;
        color: #555;
      }
    </style>
  `;
};

export default ReportHeader;