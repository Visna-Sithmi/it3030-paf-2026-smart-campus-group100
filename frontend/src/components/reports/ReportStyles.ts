// frontend/src/components/reports/ReportStyles.ts
export const getReportStyles = () => `
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Times New Roman', Arial, sans-serif;
      padding: 40px 35px;
      color: #1a1a1a;
      line-height: 1.4;
      background: white;
    }
    
    /* Info Bar */
    .info-bar {
      display: flex;
      justify-content: space-between;
      background: linear-gradient(135deg, #f0f4f8 0%, #e8edf2 100%);
      padding: 12px 20px;
      margin-bottom: 30px;
      border-radius: 8px;
      font-size: 11px;
      border-left: 4px solid #002147;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    
    .info-bar span {
      font-weight: 500;
    }
    
    .info-bar strong {
      color: #002147;
    }
    
    /* Section Styles - Enhanced Visibility */
    .student-section {
      margin-bottom: 40px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    .section-header {
      background: linear-gradient(135deg, #002147 0%, #003366 100%);
      color: white;
      padding: 12px 20px;
      margin-bottom: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,33,71,0.2);
      border-left: 4px solid #ffd700;
    }
    
    .section-header h3 {
      font-size: 16px;
      font-weight: bold;
      margin: 0;
      letter-spacing: 1px;
    }
    
    .section-header p {
      font-size: 11px;
      margin-top: 5px;
      opacity: 0.9;
      font-weight: normal;
    }
    
    /* Table Styles - Enhanced */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
      font-size: 10px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    
    th {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: white;
      border: 1px solid #334155;
      padding: 10px 8px;
      text-align: left;
      font-weight: bold;
      font-size: 10px;
      letter-spacing: 0.5px;
    }
    
    td {
      border: 1px solid #cbd5e1;
      padding: 8px;
      text-align: left;
      vertical-align: top;
    }
    
    tr:nth-child(even) {
      background-color: #f8fafc;
    }
    
    tr:hover {
      background-color: #eef2ff;
    }
    
    /* Summary Row */
    .summary-row {
      background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
      padding: 10px 15px;
      margin-top: 8px;
      font-size: 11px;
      font-weight: bold;
      border-radius: 6px;
      color: #002147;
      border-left: 3px solid #002147;
    }
    
    /* Header Styles (from ReportHeader) */
    .official-header {
      text-align: center;
      margin-bottom: 35px;
      padding-bottom: 20px;
      border-bottom: 3px solid #002147;
      position: relative;
      background: linear-gradient(to bottom, #ffffff, #fafcff);
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
      box-shadow: 0 4px 15px rgba(0,33,71,0.15);
      border: 3px solid #002147;
      overflow: hidden;
    }
    
    .logo-image {
      width: 90px;
      height: 90px;
      object-fit: cover;
      border-radius: 50%;
    }
    
    .logo-fallback {
      width: 90px;
      height: 90px;
      background: linear-gradient(135deg, #002147 0%, #004080 100%);
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 28px;
      font-weight: bold;
      text-align: center;
    }
    
    .university-name {
      font-size: 28px;
      font-weight: bold;
      color: #002147;
      margin-top: 10px;
      letter-spacing: 2px;
      font-family: 'Times New Roman', serif;
    }
    
    .university-subtitle {
      font-size: 11px;
      color: #555;
      margin-top: 5px;
      letter-spacing: 3px;
      font-weight: 500;
    }
    
    .report-title {
      font-size: 22px;
      font-weight: bold;
      color: #002147;
      margin-top: 15px;
      text-transform: uppercase;
      letter-spacing: 2px;
      position: relative;
      display: inline-block;
      padding-bottom: 8px;
    }
    
    .report-title::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 25%;
      width: 50%;
      height: 2px;
      background: linear-gradient(90deg, transparent, #002147, #002147, transparent);
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
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    
    .report-date {
      font-size: 10px;
      color: #555;
      font-family: monospace;
    }
    
    /* Footer Styles (from ReportFooter) */
    .official-footer {
      margin-top: 60px;
      padding-top: 30px;
      font-family: 'Times New Roman', Arial, sans-serif;
      color: #1a1a1a;
      page-break-inside: avoid;
      page-break-before: avoid;
      page-break-after: avoid;
      break-inside: avoid;
      position: relative;
      width: 100%;
      clear: both;
    }
    
    .footer-main {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 8px;
      padding: 20px 25px;
      margin-bottom: 20px;
      border: 1px solid #e2e8f0;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    .footer-grid {
      display: flex;
      justify-content: space-between;
      gap: 30px;
      flex-wrap: wrap;
    }
    
    .footer-section {
      flex: 1;
      min-width: 180px;
    }
    
    .footer-title {
      font-size: 10px;
      font-weight: bold;
      color: #002147;
      letter-spacing: 1.5px;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 2px solid #002147;
      display: inline-block;
    }
    
    .footer-address, .footer-contact, .footer-accreditation, .footer-doc {
      font-size: 8.5px;
      line-height: 1.5;
      color: #334155;
      margin-bottom: 4px;
    }
    
    .security-level {
      font-weight: bold;
      color: #002147;
      letter-spacing: 1px;
    }
    
    .footer-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px;
      margin: 20px 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    .divider-line {
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, transparent, #cbd5e1, #cbd5e1, #cbd5e1, transparent);
    }
    
    .divider-logo {
      font-size: 14px;
      color: #002147;
      opacity: 0.6;
    }
    
    .signature-area {
      margin-top: 35px;
      margin-bottom: 25px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    .signature-container {
      display: flex;
      justify-content: flex-end;
      align-items: flex-end;
      gap: 50px;
      flex-wrap: wrap;
    }
    
    .signature-box {
      text-align: center;
      min-width: 220px;
    }
    
    .signature-line {
      border-top: 1.5px solid #1a1a1a;
      margin-top: 40px;
      padding-top: 10px;
      width: 100%;
    }
    
    .signature-label {
      margin-top: 8px;
    }
    
    .signature-title {
      font-size: 9px;
      font-weight: bold;
      color: #002147;
      letter-spacing: 1px;
      margin-bottom: 5px;
    }
    
    .signature-name {
      font-size: 10px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 2px;
    }
    
    .signature-role {
      font-size: 8px;
      color: #666;
      font-style: italic;
    }
    
    .seal-container {
      display: flex;
      align-items: center;
    }
    
    .seal {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 2px solid #b45309;
      border-radius: 50%;
      width: 70px;
      height: 70px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .seal-inner {
      text-align: center;
    }
    
    .seal-text {
      font-size: 8px;
      font-weight: bold;
      color: #b45309;
      letter-spacing: 1px;
    }
    
    .seal-subtext {
      font-size: 6px;
      color: #b45309;
      margin-top: 2px;
    }
    
    .verification-section {
      background: #f8fafc;
      border-radius: 6px;
      padding: 15px 20px;
      margin: 20px 0 15px;
      text-align: center;
      border: 1px solid #e2e8f0;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    .verification-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #002147;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 8px;
      font-weight: bold;
      margin-bottom: 10px;
      letter-spacing: 1px;
    }
    
    .badge-icon {
      font-size: 10px;
    }
    
    .verification-code {
      font-size: 9px;
      color: #334155;
      margin-bottom: 8px;
    }
    
    .code-value {
      font-family: monospace;
      font-weight: bold;
      color: #002147;
      background: #e2e8f0;
      padding: 2px 6px;
      border-radius: 4px;
      letter-spacing: 1px;
    }
    
    .verification-note {
      font-size: 7.5px;
      color: #666;
      font-style: italic;
    }
    
    .copyright {
      text-align: center;
      font-size: 7px;
      color: #94a3b8;
      margin-top: 15px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
    }
    
    /* Print Styles */
    @media print {
      body {
        padding: 0;
        margin: 0;
      }
      
      .info-bar {
        background: #f0f4f8;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .section-header {
        background: #002147;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        break-inside: avoid;
      }
      
      th {
        background: #1e293b;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .official-footer {
        margin-top: 30px;
        padding-top: 20px;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      .footer-main {
        background: none;
        border: 1px solid #ddd;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      .signature-area {
        margin-top: 20px;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      .seal {
        background: none;
        border: 1px solid #333;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      .verification-section {
        background: none;
        border: 1px solid #ddd;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      .verification-badge {
        background: #333;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .logo-circle {
        box-shadow: none;
        border: 2px solid #002147;
      }
      
      .logo-fallback {
        background: #002147;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .report-type {
        background: #e8edf2;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .official-footer > * {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
    
    /* Page margin control */
    @page {
      size: A4;
      margin: 1.5cm;
      margin-bottom: 0.5in;
    }
  </style>
`;

// Also export as default for flexibility
export default getReportStyles;