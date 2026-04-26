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
      padding: 50px 40px;
      color: #1a1a1a;
      line-height: 1.4;
      background: white;
    }
    
    /* Info Bar */
    .info-bar {
      display: flex;
      justify-content: space-between;
      background: #f0f4f8;
      padding: 10px 15px;
      margin-bottom: 25px;
      border-radius: 4px;
      font-size: 11px;
      border-left: 4px solid #002147;
    }
    
    /* Section Styles */
    .student-section {
      margin-bottom: 35px;
      page-break-inside: avoid;
    }
    
    .section-header {
      background-color: #002147;
      color: white;
      padding: 8px 15px;
      margin-bottom: 10px;
      border-radius: 4px;
    }
    
    .section-header h3 {
      font-size: 14px;
      font-weight: bold;
      margin: 0;
    }
    
    .section-header p {
      font-size: 10px;
      margin-top: 3px;
      opacity: 0.9;
    }
    
    /* Table Styles */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
      font-size: 10px;
    }
    
    th {
      background-color: #e8edf2;
      border: 1px solid #cbd5e1;
      padding: 8px 6px;
      text-align: left;
      font-weight: bold;
      color: #1e293b;
      font-size: 10px;
    }
    
    td {
      border: 1px solid #cbd5e1;
      padding: 6px;
      text-align: left;
    }
    
    tr:nth-child(even) {
      background-color: #f9fbfd;
    }
    
    /* Summary Row */
    .summary-row {
      background-color: #f0f4f8;
      padding: 8px 12px;
      margin-top: 5px;
      font-size: 10px;
      font-weight: bold;
      border-radius: 3px;
    }
    
    @page {
      size: A4;
      margin: 1.5cm;
    }
    
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
`;

// Also export as default for flexibility
export default getReportStyles;