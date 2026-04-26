// frontend/src/components/reports/ReportFooter.tsx
import React from 'react';

interface ReportFooterProps {
  showSignatures?: boolean;
  additionalNotes?: string;
  organizationAddress?: string;
  contactInfo?: string;
  website?: string;
  registrarName?: string;
  viceChancellorName?: string;
}

const ReportFooter: React.FC<ReportFooterProps> = ({
  showSignatures = true,
  additionalNotes,
  organizationAddress = "123 University Avenue, Colombo, Sri Lanka",
  contactInfo = "Tel: +94 11 234 5678 | Email: registrar@northbridge.edu",
  website = "www.northbridge.edu",
  registrarName = "Prof. M.S. Perera",
  viceChancellorName = "Dr. K.D. Silva"
}) => {
  const documentId = `NB-REP-${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
  const verificationCode = `NB-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

  return `
    <div class="official-footer">
      <div class="footer-content">
        <div class="footer-left">
          <p><strong>Northbridge University</strong></p>
          <p>${organizationAddress}</p>
          <p>${contactInfo}</p>
        </div>
        <div class="footer-center">
          <p>${website}</p>
          <p>Accredited by UGC Sri Lanka</p>
          <p>ISO 9001:2024 Certified</p>
        </div>
        <div class="footer-right">
          <p>Document ID: ${documentId}</p>
          <p>Security Level: Official</p>
          <p>Page <span class="page-number"></span></p>
        </div>
      </div>
      
      ${additionalNotes ? `
        <div class="additional-notes">
          <p><strong>Additional Notes:</strong> ${additionalNotes}</p>
        </div>
      ` : ''}
      
      ${showSignatures ? `
        <div class="signature-area">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">
              <strong>Registrar's Signature</strong><br>
              ${registrarName}<br>
              University Registrar
            </div>
          </div>
          <div class="signature-box" style="margin-left: 40px;">
            <div class="signature-line"></div>
            <div class="signature-label">
              <strong>Vice Chancellor's Signature</strong><br>
              ${viceChancellorName}<br>
              Vice Chancellor
            </div>
          </div>
          <div class="seal">
            <div style="border: 1px solid #002147; border-radius: 4px; padding: 8px;">
              OFFICIAL<br>SEAL
            </div>
          </div>
        </div>
      ` : ''}
      
      <div class="verification-note">
        This is a computer-generated document and requires no physical signature.<br>
        Verification Code: ${verificationCode}
      </div>
      
      <div class="copyright">
        © ${new Date().getFullYear()} Northbridge University. All rights reserved.
      </div>
    </div>

    <style>
      .official-footer {
        margin-top: 50px;
        padding-top: 20px;
        border-top: 1px solid #cbd5e1;
        font-size: 9px;
        color: #666;
      }
      
      .footer-content {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        flex-wrap: wrap;
        margin-bottom: 20px;
      }
      
      .footer-left, .footer-center, .footer-right {
        flex: 1;
      }
      
      .footer-left {
        text-align: left;
      }
      
      .footer-center {
        text-align: center;
      }
      
      .footer-right {
        text-align: right;
      }
      
      .additional-notes {
        background: #f9fbfd;
        padding: 10px;
        margin: 15px 0;
        border-left: 3px solid #002147;
        font-size: 9px;
      }
      
      .signature-area {
        margin-top: 30px;
        display: flex;
        justify-content: flex-end;
        align-items: flex-end;
      }
      
      .signature-box {
        text-align: center;
        width: 250px;
      }
      
      .signature-line {
        border-top: 1px solid #1a1a1a;
        margin-top: 30px;
        padding-top: 8px;
        width: 100%;
      }
      
      .signature-label {
        font-size: 9px;
        color: #555;
        margin-top: 5px;
      }
      
      .seal {
        display: inline-block;
        margin-left: 20px;
        font-size: 10px;
        color: #002147;
      }
      
      .verification-note {
        text-align: center;
        margin-top: 20px;
        font-size: 8px;
        color: #888;
      }
      
      .copyright {
        text-align: center;
        margin-top: 10px;
        font-size: 8px;
        color: #999;
      }
      
      @media print {
        .signature-area {
          margin-top: 40px;
        }
      }
    </style>
  `;
};

export default ReportFooter;