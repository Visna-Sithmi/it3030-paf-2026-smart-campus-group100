// frontend/src/components/reports/ReportHeader.tsx
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
  logoUrl = "/logo.jpeg"
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

  // Force absolute URL with cache buster
  const getLogoUrl = () => {
    if (typeof window !== 'undefined') {
      const timestamp = new Date().getTime();
      return `${window.location.origin}${logoUrl}?t=${timestamp}`;
    }
    return logoUrl;
  };

  // NO SVG FALLBACK - just your logo
  return `
    <div class="official-header">
      <div class="logo-container">
        <div class="logo-circle">
          <img 
            src="${getLogoUrl()}" 
            alt="Northbridge University Logo" 
            class="logo-image"
          />
        </div>
      </div>
      <div class="university-name">${organizationName}</div>
      <div class="university-subtitle">ESTABLISHED 2004 | ACCREDITED INSTITUTION</div>
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
        margin-bottom: 35px;
        padding-bottom: 20px;
        border-bottom: 3px solid #002147;
      }
      
      .logo-container {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 15px;
      }
      
      .logo-circle {
        width: 100px;
        height: 100px;
        background: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid #002147;
        overflow: hidden;
      }
      
      .logo-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .university-name {
        font-size: 28px;
        font-weight: bold;
        color: #002147;
        margin-top: 10px;
        letter-spacing: 2px;
      }
      
      .university-subtitle {
        font-size: 11px;
        color: #555;
        margin-top: 5px;
        letter-spacing: 3px;
      }
      
      .report-title {
        font-size: 22px;
        font-weight: bold;
        color: #002147;
        margin-top: 15px;
        text-transform: uppercase;
      }
      
      .report-subtitle {
        font-size: 12px;
        color: #666;
        margin-top: 10px;
        font-style: italic;
      }
      
      .report-meta {
        display: flex;
        justify-content: center;
        gap: 20px;
        margin-top: 15px;
        padding-top: 12px;
        border-top: 1px dashed #cbd5e1;
      }
      
      .report-type {
        font-size: 10px;
        color: #002147;
        background: #e8edf2;
        padding: 4px 12px;
        border-radius: 20px;
      }
      
      .report-date {
        font-size: 10px;
        color: #555;
      }
      
      @media print {
        .logo-circle {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    </style>
  `;
};

export default ReportHeader;