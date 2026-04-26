// frontend/src/components/reports/ReportHeader.tsx
interface ReportHeaderProps {
  title?: string;
  subtitle?: string;
  generatedDate?: Date;
  reportType?: string;
  organizationName?: string;
  logoUrl?: string;
}

export const getReportHeader = (props: ReportHeaderProps = {}) => {
  const {
    title = "Student Enrollment Report",
    subtitle = "Official Administrative Report",
    generatedDate = new Date(),
    reportType = "Comprehensive Enrollment",
    organizationName = "Northbridge University",
    logoUrl
  } = props;

  return `
    <div class="official-header">
      <div class="logo-container">
        ${logoUrl ? 
          `<img src="${logoUrl}" alt="University Logo" style="width: 80px; height: 80px; object-fit: cover; border-radius: 50%;" />` :
          `<div class="logo-placeholder">
            NB<br>UNIV
          </div>`
        }
      </div>
      <div class="university-name">${organizationName}</div>
      <div class="university-subtitle">ESTABLISHED 2004 | ACCREDITED INSTITUTION</div>
      <div class="report-title">${title}</div>
      <div class="report-date">Generated: ${generatedDate.toLocaleString()}</div>
      ${subtitle ? `<div class="report-subtitle">${subtitle}</div>` : ''}
    </div>

    <style>
      .official-header {
        text-align: center;
        margin-bottom: 30px;
        padding-bottom: 15px;
        border-bottom: 2px solid #002147;
        position: relative;
      }
      
      .logo-container {
        display: inline-block;
        margin-bottom: 10px;
      }
      
      .logo-placeholder {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #002147 0%, #004080 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto;
        color: white;
        font-size: 12px;
        font-weight: bold;
        text-align: center;
        line-height: 1.2;
        padding: 10px;
      }
      
      .university-name {
        font-size: 28px;
        font-weight: bold;
        color: #002147;
        margin-top: 10px;
        letter-spacing: 2px;
      }
      
      .university-subtitle {
        font-size: 12px;
        color: #555;
        margin-top: 5px;
        letter-spacing: 3px;
      }
      
      .report-title {
        font-size: 18px;
        font-weight: bold;
        color: #002147;
        margin-top: 15px;
        text-transform: uppercase;
      }
      
      .report-subtitle {
        font-size: 11px;
        color: #666;
        margin-top: 5px;
      }
      
      .report-date {
        font-size: 11px;
        color: #666;
        margin-top: 5px;
      }
    </style>
  `;
};

export default getReportHeader;