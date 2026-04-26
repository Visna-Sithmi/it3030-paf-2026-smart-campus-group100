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
      <div class="footer-main">
        <div class="footer-grid">
          <div class="footer-section">
            <div class="footer-title">NORTHBRIDGE UNIVERSITY</div>
            <div class="footer-address">${organizationAddress}</div>
            <div class="footer-contact">${contactInfo}</div>
          </div>
          
          <div class="footer-section">
            <div class="footer-title">ACCREDITATION</div>
            <div class="footer-accreditation">${website}</div>
            <div class="footer-accreditation">Accredited by UGC Sri Lanka</div>
            <div class="footer-accreditation">ISO 9001:2024 Certified</div>
          </div>
          
          <div class="footer-section">
            <div class="footer-title">DOCUMENT INFO</div>
            <div class="footer-doc">Document ID: ${documentId}</div>
            <div class="footer-doc">Security Level: <span class="security-level">OFFICIAL</span></div>
            <div class="footer-doc">Page <span class="page-number"></span></div>
          </div>
        </div>
      </div>

      <div class="footer-divider">
        <span class="divider-line"></span>
        <span class="divider-logo">⚜️</span>
        <span class="divider-line"></span>
      </div>
      
      ${additionalNotes ? `
        <div class="additional-notes">
          <div class="notes-icon">📋</div>
          <div class="notes-content">
            <strong>Additional Notes:</strong> ${additionalNotes}
          </div>
        </div>
      ` : ''}
      
      ${showSignatures ? `
        <div class="signature-area">
          <div class="signature-container">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">
                <div class="signature-title">Registrar's Signature</div>
                <div class="signature-name">${registrarName}</div>
                <div class="signature-role">University Registrar</div>
              </div>
            </div>
            
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">
                <div class="signature-title">Vice Chancellor's Signature</div>
                <div class="signature-name">${viceChancellorName}</div>
                <div class="signature-role">Vice Chancellor</div>
              </div>
            </div>
            
            <div class="seal-container">
              <div class="seal">
                <div class="seal-inner">
                  <div class="seal-text">OFFICIAL</div>
                  <div class="seal-subtext">SEAL</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ` : ''}
      
      <div class="verification-section">
        <div class="verification-badge">
          <span class="badge-icon">✓</span>
          <span class="badge-text">VERIFIED DOCUMENT</span>
        </div>
        <div class="verification-code">
          Verification Code: <span class="code-value">${verificationCode}</span>
        </div>
        <div class="verification-note">
          This is a computer-generated document and requires no physical signature.
        </div>
      </div>
      
      <div class="copyright">
        © ${new Date().getFullYear()} Northbridge University. All rights reserved.
      </div>
    </div>
  `;
};

// Also export as a function that can be called directly
export const getReportFooter = (props?: ReportFooterProps) => {
  return ReportFooter(props || {});
};

export default ReportFooter;