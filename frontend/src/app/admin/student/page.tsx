import { useEffect, useMemo, useState } from "react";
import Header from "../components/header";
import Sidebar from "../components/Sidebar";
import { studentService } from "../../../services/studentService";
import type { Student } from "../../../types/student";

type StudentRow = Student & {
  student_id?: string;
};

const emptyForm: Student = {
  studentId: "",
  name: "",
  email: "",
  password: "",
  phone: "",
  address: "",
  course: "",
  year: 1,
  semester: 1,
  dateOfBirth: "",
  gender: "Male",
};

// Report data structure
interface YearSemesterReport {
  year: number;
  semester: number;
  studentCount: number;
  students: StudentRow[];
  totalMale: number;
  totalFemale: number;
  totalOther: number;
  courses: { [key: string]: number };
}

// Form validation error interface
interface FormErrors {
  studentId?: string;
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  address?: string;
  course?: string;
  dateOfBirth?: string;
}

export default function StudentPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRow | null>(null);
  const [formData, setFormData] = useState<Student>(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [isEmailManuallyEdited, setIsEmailManuallyEdited] = useState(false);

  // Report state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState<YearSemesterReport[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const [selectedSemester, setSelectedSemester] = useState<number | "all">("all");

  const getStudentIdValue = (student: StudentRow) => {
    return student.studentId || student.student_id || "";
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const studentData = await studentService.getAllStudents();
      console.log("Students API response:", studentData);
      
      // Log each student's dateOfBirth to debug
      if (studentData && Array.isArray(studentData)) {
        studentData.forEach((student: any) => {
          console.log(`Student ${student.name} - dateOfBirth:`, student.dateOfBirth, "type:", typeof student.dateOfBirth);
        });
      }
      
      setStudents(studentData as StudentRow[]);
    } catch (err: any) {
      setError(err.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    const term = search.toLowerCase();

    return students.filter((student) => {
      return (
        getStudentIdValue(student).toLowerCase().includes(term) ||
        (student.name || "").toLowerCase().includes(term) ||
        (student.email || "").toLowerCase().includes(term) ||
        (student.phone || "").toLowerCase().includes(term) ||
        (student.address || "").toLowerCase().includes(term) ||
        (student.course || "").toLowerCase().includes(term) ||
        (student.gender || "").toLowerCase().includes(term) ||
        String(student.year ?? "").includes(term) ||
        String(student.semester ?? "").includes(term)
      );
    });
  }, [students, search]);

  // Generate Report Data
  const generateReport = () => {
    const reportMap = new Map<string, YearSemesterReport>();

    students.forEach((student) => {
      const year = student.year || 1;
      const semester = student.semester || 1;
      const key = `${year}-${semester}`;

      if (!reportMap.has(key)) {
        reportMap.set(key, {
          year,
          semester,
          studentCount: 0,
          students: [],
          totalMale: 0,
          totalFemale: 0,
          totalOther: 0,
          courses: {},
        });
      }

      const report = reportMap.get(key)!;
      report.studentCount++;
      report.students.push(student);

      // Gender count
      if (student.gender === "Male") report.totalMale++;
      else if (student.gender === "Female") report.totalFemale++;
      else report.totalOther++;

      // Course count
      const course = student.course || "Not Specified";
      report.courses[course] = (report.courses[course] || 0) + 1;
    });

    // Convert map to array and sort by year and semester
    const sortedReport = Array.from(reportMap.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.semester - b.semester;
    });

    setReportData(sortedReport);
    setShowReportModal(true);
  };

  // Filter report data based on selections
  const filteredReportData = useMemo(() => {
    if (selectedYear === "all" && selectedSemester === "all") {
      return reportData;
    }
    return reportData.filter((item) => {
      const yearMatch = selectedYear === "all" || item.year === selectedYear;
      const semesterMatch = selectedSemester === "all" || item.semester === selectedSemester;
      return yearMatch && semesterMatch;
    });
  }, [reportData, selectedYear, selectedSemester]);

  // Download Report as CSV
  const downloadCSV = () => {
    const headers = [
      "Year",
      "Semester",
      "Student ID",
      "Name",
      "Email",
      "Phone",
      "Address",
      "Course",
      "Gender",
      "Date of Birth",
    ];

    const rows: any[][] = [];
    filteredReportData.forEach((item) => {
      item.students.forEach((student) => {
        rows.push([
          item.year,
          item.semester,
          getStudentIdValue(student),
          student.name,
          student.email,
          student.phone || '-',
          student.address || '-',
          student.course || '-',
          student.gender || '-',
          student.dateOfBirth || '-',
        ]);
      });
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `student_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download Report as JSON
  const downloadJSON = () => {
    const reportDataToExport = {
      generatedAt: new Date().toISOString(),
      totalStudents: students.length,
      reportSummary: filteredReportData.map((item) => ({
        year: item.year,
        semester: item.semester,
        totalStudents: item.studentCount,
        genderBreakdown: {
          male: item.totalMale,
          female: item.totalFemale,
          other: item.totalOther,
        },
        courseDistribution: item.courses,
        students: item.students.map((s) => ({
          id: getStudentIdValue(s),
          name: s.name,
          email: s.email,
          phone: s.phone,
          address: s.address,
          course: s.course,
          gender: s.gender,
          dateOfBirth: s.dateOfBirth,
        })),
      })),
    };

    const jsonStr = JSON.stringify(reportDataToExport, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `student_report_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

// Generate Print HTML for PDF - WITHOUT LOGO AND DATE OF BIRTH
const generatePrintHTML = () => {
  const getFilterText = () => {
    if (selectedYear === "all" && selectedSemester === "all") return "All Years & Semesters";
    if (selectedYear !== "all" && selectedSemester === "all") return `Year ${selectedYear} Only`;
    if (selectedYear === "all" && selectedSemester !== "all") return `Semester ${selectedSemester} Only`;
    return `Year ${selectedYear} - Semester ${selectedSemester}`;
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Student Report - Northbridge University</title>
      <meta charset="UTF-8">
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
        
        .official-header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #002147;
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
          font-size: 20px;
          font-weight: bold;
          color: #002147;
          margin-top: 15px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .report-date {
          font-size: 11px;
          color: #666;
          margin-top: 8px;
        }
        
        .info-bar {
          display: flex;
          justify-content: space-between;
          background: #f0f4f8;
          padding: 12px 20px;
          margin: 20px 0 30px;
          border-radius: 8px;
          font-size: 11px;
          border-left: 4px solid #002147;
        }
        
        .info-bar span {
          font-weight: 500;
        }
        
        .info-bar strong {
          color: #002147;
        }
        
        .student-section {
          margin-bottom: 35px;
          page-break-inside: avoid;
        }
        
        .section-header {
          background: #002147;
          color: white;
          padding: 12px 20px;
          margin-bottom: 15px;
          border-radius: 8px;
        }
        
        .section-header h3 {
          font-size: 16px;
          font-weight: bold;
          margin: 0;
        }
        
        .section-header p {
          font-size: 11px;
          margin-top: 5px;
          opacity: 0.9;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          font-size: 10px;
        }
        
        th {
          background: #1e293b;
          color: white;
          border: 1px solid #334155;
          padding: 10px 8px;
          text-align: left;
          font-weight: bold;
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
        
        .summary-row {
          background: #f0f4f8;
          padding: 10px 15px;
          margin-top: 8px;
          font-size: 11px;
          font-weight: bold;
          border-radius: 6px;
          color: #002147;
          border-left: 3px solid #002147;
        }
        
        .official-footer {
          margin-top: 50px;
          padding-top: 25px;
          border-top: 2px solid #cbd5e1;
        }
        
        .footer-content {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          margin-bottom: 30px;
        }
        
        .footer-left, .footer-center, .footer-right {
          flex: 1;
          font-size: 9px;
        }
        
        .footer-left { text-align: left; }
        .footer-center { text-align: center; }
        .footer-right { text-align: right; }
        
        .footer-left p, .footer-center p, .footer-right p {
          margin-bottom: 3px;
        }
        
        .signature-area {
          margin-top: 40px;
          display: flex;
          justify-content: flex-end;
          gap: 50px;
          flex-wrap: wrap;
        }
        
        .signature-box {
          text-align: center;
          width: 250px;
        }
        
        .signature-line {
          border-top: 1px solid #1a1a1a;
          margin-top: 40px;
          padding-top: 10px;
          width: 100%;
        }
        
        .signature-label {
          margin-top: 8px;
        }
        
        .signature-label strong {
          font-size: 10px;
        }
        
        .seal {
          display: inline-block;
        }
        
        .seal div {
          border: 2px solid #002147;
          border-radius: 50%;
          padding: 12px;
          text-align: center;
          width: 80px;
          height: 80px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        
        .verification-note {
          text-align: center;
          margin-top: 25px;
          font-size: 8px;
          color: #888;
          padding-top: 15px;
          border-top: 1px solid #e2e8f0;
        }
        
        .copyright {
          text-align: center;
          margin-top: 15px;
          font-size: 7px;
          color: #999;
        }
        
        @page {
          size: A4;
          margin: 1.5cm;
        }
        
        @media print {
          body {
            padding: 0;
          }
          
          .section-header {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          th {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .info-bar {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <!-- Header without Logo -->
      <div class="official-header">
        <div class="university-name">NORTHBRIDGE UNIVERSITY</div>
        <div class="university-subtitle">ESTABLISHED 2004 | ACCREDITED INSTITUTION</div>
        <div class="report-title">Student Enrollment Report</div>
        <div class="report-date">Generated: ${new Date().toLocaleString()}</div>
      </div>
      
      <!-- Info Bar -->
      <div class="info-bar">
        <span><strong>Total Students:</strong> ${students.length}</span>
        <span><strong>Filter:</strong> ${getFilterText()}</span>
        <span><strong>Academic Year:</strong> ${new Date().getFullYear()}</span>
      </div>
      
      <!-- Student Data without Date of Birth column -->
      ${filteredReportData.map((item) => {
        const maleCount = item.students.filter(s => s.gender === 'Male').length;
        const femaleCount = item.students.filter(s => s.gender === 'Female').length;
        const otherCount = item.students.filter(s => s.gender === 'Other').length;
        
        return `
          <div class="student-section">
            <div class="section-header">
              <h3>YEAR ${item.year} - SEMESTER ${item.semester}</h3>
              <p>Total: ${item.studentCount} students | Male: ${maleCount} | Female: ${femaleCount} | Other: ${otherCount}</p>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Course</th>
                  <th>Gender</th>
                </tr>
              </thead>
              <tbody>
                ${item.students.map(student => `
                  <tr>
                    <td>${getStudentIdValue(student)}</td>
                    <td>${student.name}</td>
                    <td>${student.email}</td>
                    <td>${student.phone || '-'}</td>
                    <td>${student.address || '-'}</td>
                    <td>${student.course || '-'}</td>
                    <td>${student.gender || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="summary-row">
              Year ${item.year} Semester ${item.semester}: ${item.studentCount} students registered
            </div>
          </div>
        `;
      }).join('')}
      
      <!-- Footer -->
      <div class="official-footer">
        <div class="footer-content">
          <div class="footer-left">
            <p><strong>Northbridge University</strong></p>
            <p>123 University Avenue, Colombo, Sri Lanka</p>
            <p>Tel: +94 11 234 5678 | Email: registrar@northbridge.edu</p>
          </div>
          <div class="footer-center">
            <p>www.northbridge.edu</p>
            <p>Accredited by UGC Sri Lanka</p>
            <p>ISO 9001:2024 Certified</p>
          </div>
          <div class="footer-right">
            <p>Document ID: NB-REP-${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}</p>
            <p>Security Level: Official</p>
          </div>
        </div>
        
        <div class="signature-area">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">
              <strong>Registrar's Signature</strong><br>
              Prof. M.S. Perera<br>
              University Registrar
            </div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">
              <strong>Vice Chancellor's Signature</strong><br>
              Dr. K.D. Silva<br>
              Vice Chancellor
            </div>
          </div>
          <div class="seal">
            <div>
              OFFICIAL<br>SEAL
            </div>
          </div>
        </div>
        
        <div class="verification-note">
          This is a computer-generated document and requires no physical signature.<br>
          Verification Code: NB-${Math.random().toString(36).substring(2, 10).toUpperCase()}
        </div>
        
        <div class="copyright">
          © ${new Date().getFullYear()} Northbridge University. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
};

  // Print/PDF Download
  const downloadPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    const htmlContent = generatePrintHTML();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  // Get unique years for filter
  const availableYears = useMemo(() => {
    const years = new Set(students.map((s) => s.year).filter((y) => y));
    return Array.from(years).sort();
  }, [students]);

  // ==================== EMAIL AUTO-GENERATION FUNCTION ====================
  // Generate email in format: firstname.lastinitial@northbridge.com
  // Example: "Samindi Kusalya" -> "samindi.k@northbridge.com"
  const generateEmailFromName = (name: string): string => {
    if (!name.trim()) return "";
    
    const cleanName = name.trim().toLowerCase();
    const parts = cleanName.split(/\s+/).filter(part => part.length > 0);
    
    if (parts.length === 0) return "";
    
    const firstName = parts[0];
    let lastInitial = "";
    
    if (parts.length >= 2) {
      // Get the last name's first letter
      const lastName = parts[parts.length - 1];
      lastInitial = lastName.charAt(0);
    } else {
      // If only one name, use first letter of that name
      lastInitial = firstName.charAt(0);
    }
    
    // Remove any special characters from first name
    const cleanFirstName = firstName.replace(/[^a-z]/g, "");
    const cleanLastInitial = lastInitial.replace(/[^a-z]/g, "");
    
    if (!cleanFirstName) return "";
    
    if (cleanLastInitial) {
      return `${cleanFirstName}.${cleanLastInitial}@northbridge.com`;
    } else {
      return `${cleanFirstName}@northbridge.com`;
    }
  };

  // Format date for input field (YYYY-MM-DD) - Improved version
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return "";
    
    console.log("Formatting date:", dateString, "type:", typeof dateString);
    
    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // Handle DD/MM/YYYY format
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const parts = dateString.split('/');
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    
    // Handle DD-MM-YYYY format
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      const parts = dateString.split('-');
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    
    // Try to parse the date
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const formatted = date.toISOString().split('T')[0];
        console.log("Parsed date to:", formatted);
        return formatted;
      }
    } catch (e) {
      console.error("Date parsing error:", e);
    }
    
    return "";
  };

  // ==================== INPUT RESTRICTION FUNCTIONS ====================
  
  // Restrict Student ID: Only allow STU followed by 3 digits (STU001 format)
  const restrictStudentId = (value: string): string => {
    // Convert to uppercase
    let formatted = value.toUpperCase();
    // Only allow STU and digits
    if (formatted.length <= 3) {
      if (!/^STU?$/.test(formatted) && formatted !== "S" && formatted !== "ST") {
        return "";
      }
    }
    if (formatted.length > 3) {
      const prefix = formatted.slice(0, 3);
      const digits = formatted.slice(3).replace(/[^0-9]/g, "");
      if (prefix !== "STU") return "STU";
      formatted = "STU" + digits;
    }
    return formatted.slice(0, 6); // STU + 3 digits max
  };

  // Restrict Name: Only letters, spaces, hyphens, apostrophes, periods
  const restrictName = (value: string): string => {
    return value.replace(/[^a-zA-Z\s\-'.]/g, "");
  };

  // Validate email format: name.letter@northbridge.com
  const validateEmail = (email: string): string | undefined => {
    if (!email || email.trim() === "") {
      return "Email address is required";
    }
    if (email.trim().length > 100) {
      return "Email must be at most 100 characters";
    }
    
    // Check for northbridge.com domain
    const emailPattern = /^[a-z][a-z0-9.]*@northbridge\.com$/;
    if (!emailPattern.test(email.trim().toLowerCase())) {
      return "Email must be in format: name.letter@northbridge.com (e.g., samindi.k@northbridge.com)";
    }
    
    const localPart = email.split("@")[0];
    // Should contain at least one dot for name.letter format
    if (!localPart.includes(".")) {
      return "Email local part should be in format 'name.letter' (e.g., samindi.k)";
    }
    
    // Check for duplicate email (skip if editing and email hasn't changed)
    const existingStudent = students.find(
      (s) => s.email?.toLowerCase() === email.trim().toLowerCase() && s.id !== editingStudent?.id
    );
    if (existingStudent) {
      return "Email already registered by another student";
    }
    return undefined;
  };

  // Restrict Phone: Only digits, first digit must be 0, exactly 10 digits
  const restrictPhone = (value: string): string => {
    const digits = value.replace(/[^0-9]/g, "");
    if (digits.length === 0) return "";
    // First digit must be 0
    if (digits[0] !== '0') return "";
    return digits.slice(0, 10);
  };

  // ==================== FORM VALIDATION FUNCTIONS ====================
  
  // Validation 1: Student ID should contain STU with 3 digits (e.g., STU001, STU123)
  const validateStudentId = (id: string): string | undefined => {
    if (!id || id.trim() === "") {
      return "Student ID is required";
    }
    if (id && id.trim() !== "") {
      const studentIdPattern = /^STU\d{3}$/i;
      if (!studentIdPattern.test(id.trim())) {
        return "Student ID must be in format 'STU' followed by 3 digits (e.g., STU001, STU123)";
      }
    }
    // Check for duplicate Student ID (skip if editing and ID hasn't changed)
    if (!editingStudent || (editingStudent && formData.studentId !== editingStudent.studentId)) {
      const existingStudent = students.find(
        (s) => getStudentIdValue(s).toLowerCase() === id.trim().toLowerCase() && s.id !== editingStudent?.id
      );
      if (existingStudent) {
        return "Student ID already exists";
      }
    }
    return undefined;
  };

  const validateName = (name: string): string | undefined => {
    if (!name || name.trim() === "") {
      return "Full name is required";
    }
    if (name.trim().length < 2) {
      return "Name must be at least 2 characters";
    }
    if (name.trim().length > 100) {
      return "Name must be at most 100 characters";
    }
    return undefined;
  };

  // Validation: Password should contain special character, capital letters, simple letters, numbers and more than 8 characters
  const validatePassword = (password: string): string | undefined => {
    if (!editingStudent && (!password || password.trim() === "")) {
      return "Password is required for new student";
    }
    if (password && password.trim() !== "") {
      if (password.length < 8) {
        return "Password must be at least 8 characters";
      }
      if (password.length > 50) {
        return "Password must be at most 50 characters";
      }
      if (!/(?=.*[A-Z])/.test(password)) {
        return "Password must contain at least one uppercase letter";
      }
      if (!/(?=.*[a-z])/.test(password)) {
        return "Password must contain at least one lowercase letter";
      }
      if (!/(?=.*\d)/.test(password)) {
        return "Password must contain at least one number";
      }
      if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) {
        return "Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)";
      }
    }
    return undefined;
  };

  // Validation: Phone should contain 10 digits and first digit should be 0
  const validatePhone = (phone: string): string | undefined => {
    if (phone && phone.trim() !== "") {
      const digitsOnly = phone.replace(/\D/g, "");
      if (digitsOnly.length !== 10) {
        return "Phone number must contain exactly 10 digits";
      }
      if (digitsOnly[0] !== '0') {
        return "Phone number first digit must be 0";
      }
    }
    return undefined;
  };

  // Validation: Address should have more than 3 words and less than 50 words
  const validateAddress = (address: string): string | undefined => {
    if (address && address.trim() !== "") {
      const words = address.trim().split(/\s+/).filter(word => word.length > 0);
      if (words.length < 3) {
        return "Address must contain more than 3 words";
      }
      if (words.length > 50) {
        return "Address must contain less than 50 words";
      }
    }
    return undefined;
  };

  const validateCourse = (course: string): string | undefined => {
    if (course && course.trim().length > 100) {
      return "Course name must be at most 100 characters";
    }
    return undefined;
  };

  // Validation: Birthday should be before 2010
  const validateDateOfBirth = (dob: string): string | undefined => {
    if (!dob || dob.trim() === "") {
      return "Date of birth is required";
    }
    const birthDate = new Date(dob);
    const cutoffDate = new Date("2010-01-01");
    const today = new Date();
    
    if (isNaN(birthDate.getTime())) {
      return "Please enter a valid date";
    }
    if (birthDate > today) {
      return "Date of birth cannot be in the future";
    }
    if (birthDate >= cutoffDate) {
      return "Student must be born before 2010 (minimum 16 years old)";
    }
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age > 100) {
      return "Please verify the date of birth";
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    errors.studentId = validateStudentId(formData.studentId || "");
    errors.name = validateName(formData.name);
    errors.email = validateEmail(formData.email);
    errors.password = validatePassword(formData.password || "");
    errors.phone = validatePhone(formData.phone || "");
    errors.address = validateAddress(formData.address || "");
    errors.course = validateCourse(formData.course || "");
    errors.dateOfBirth = validateDateOfBirth(formData.dateOfBirth || "");
    
    setFormErrors(errors);
    
    return !Object.values(errors).some(error => error !== undefined);
  };

  const clearFormErrors = () => {
    setFormErrors({});
  };

  const openAddModal = () => {
    setEditingStudent(null);
    setFormData(emptyForm);
    setIsEmailManuallyEdited(false);
    clearFormErrors();
    setShowModal(true);
  };

  const openEditModal = (student: StudentRow) => {
    console.log("Opening edit modal for student:", student);
    console.log("Raw dateOfBirth from student:", student.dateOfBirth);
    
    const formattedDate = formatDateForInput(student.dateOfBirth || "");
    console.log("Formatted date for input:", formattedDate);
    
    setEditingStudent(student);
    setFormData({
      id: student.id,
      studentId: getStudentIdValue(student),
      name: student.name || "",
      email: student.email || "",
      password: "",
      phone: student.phone || "",
      address: student.address || "",
      course: student.course || "",
      year: student.year || 1,
      semester: student.semester || 1,
      dateOfBirth: formattedDate,
      gender: student.gender || "Male",
    });
    setIsEmailManuallyEdited(true); // For editing, don't auto-generate email
    clearFormErrors();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStudent(null);
    setFormData(emptyForm);
    setIsEmailManuallyEdited(false);
    clearFormErrors();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let restrictedValue = value;

    // Apply input restrictions based on field
    switch (name) {
      case "studentId":
        restrictedValue = restrictStudentId(value);
        break;
      case "name":
        restrictedValue = restrictName(value);
        // Auto-generate email from name ONLY if email hasn't been manually edited and it's new student
        if (!editingStudent && !isEmailManuallyEdited) {
          const autoEmail = generateEmailFromName(restrictedValue);
          if (autoEmail) {
            setFormData((prev) => ({ ...prev, email: autoEmail }));
            if (formErrors.email) {
              setFormErrors((prev) => ({ ...prev, email: undefined }));
            }
          } else if (!restrictedValue) {
            setFormData((prev) => ({ ...prev, email: "" }));
          }
        }
        break;
      case "email":
        restrictedValue = value.toLowerCase();
        setIsEmailManuallyEdited(true); // Mark that user manually edited email
        break;
      case "phone":
        restrictedValue = restrictPhone(value);
        break;
      default:
        break;
    }

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "year" || name === "semester"
          ? value === ""
            ? undefined
            : Number(value)
          : restrictedValue,
    }));

    // Clear specific field error when user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      const modalContent = document.querySelector(".max-h-\\[90vh\\]");
      if (modalContent) {
        modalContent.scrollTop = 0;
      }
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      if (editingStudent?.id) {
        const payload: Partial<Student> = {
          studentId: formData.studentId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          course: formData.course,
          year: formData.year,
          semester: formData.semester,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
        };

        if (formData.password && formData.password.trim() !== "") {
          payload.password = formData.password;
        }

        await studentService.updateStudent(editingStudent.id, payload);
      } else {
        console.log("Submitting student form:", formData);
        await studentService.addStudent(formData);
      }

      closeModal();
      await fetchStudents();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;

    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this student?"
    );

    if (!confirmed) return;

    try {
      setError("");
      await studentService.deleteStudent(id);
      await fetchStudents();
    } catch (err: any) {
      setError(err.message || "Failed to delete student");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Sidebar activeItem="Student Administration" />

      <div className="ml-72 min-h-screen">
        <Header adminName="Admin User" adminRole="Chancellor Administrator" />

        <main className="p-8">
          <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                Student Administration
              </h1>
              <p className="mt-2 max-w-2xl text-slate-600">
                Manage student records and maintain the institutional student
                registry.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={generateReport}
                className="rounded-lg bg-[#002147] px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-[#003366]"
              >
                Generate Report
              </button>

              <button
                onClick={openAddModal}
                className="rounded-lg bg-[#002147] px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-[#003366]"
              >
                Register New Student
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                Student Registry
              </h2>

              <input
                type="text"
                placeholder="Search by student id, name, email, address, course..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-[#002147] md:w-96"
              />
            </div>

            {loading ? (
              <div className="p-6 text-sm text-slate-500">Loading students...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">No students found.</div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[800px] table-fixed text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="w-[10%] px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Student ID
                      </th>
                      <th className="w-[13%] px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Name
                      </th>
                      <th className="w-[16%] px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Email
                      </th>
                      <th className="w-[10%] px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Phone
                      </th>
                      <th className="w-[14%] px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Address
                      </th>
                      <th className="w-[10%] px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Course
                      </th>
                      <th className="w-[9%] px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Year / Sem
                      </th>
                      <th className="w-[8%] px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Gender
                      </th>
                      <th className="w-[10%] px-4 py-4 text-center text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50 align-top">
                        <td className="break-words px-4 py-5 text-sm font-medium text-slate-900">
                          {getStudentIdValue(student) || "-"}
                        </td>
                        <td className="break-words px-4 py-5 text-sm font-medium text-slate-900">
                          {student.name}
                        </td>
                        <td className="break-words px-4 py-5 text-sm text-slate-600">
                          {student.email}
                        </td>
                        <td className="break-words px-4 py-5 text-sm text-slate-600">
                          {student.phone || "-"}
                        </td>
                        <td className="break-words px-4 py-5 text-sm text-slate-600">
                          {student.address || "-"}
                        </td>
                        <td className="break-words px-4 py-5 text-sm text-slate-600">
                          {student.course || "-"}
                        </td>
                        <td className="px-4 py-5 text-sm text-slate-600">
                          {student.year || "-"} / {student.semester || "-"}
                        </td>
                        <td className="break-words px-4 py-5 text-sm text-slate-600">
                          {student.gender || "-"}
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex flex-col items-center gap-2">
                            <button
                              onClick={() => openEditModal(student)}
                              className="w-16 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(student.id)}
                              className="w-16 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-500">
              Showing {filteredStudents.length} student(s)
            </div>
          </div>
        </main>
      </div>

      {/* Add/Edit Student Modal with Validations */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 className="text-xl font-bold text-slate-900">
                {editingStudent ? "Update Student" : "Register New Student"}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Enter the student details and save the record.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
              {Object.values(formErrors).some(error => error !== undefined) && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-700 mb-2">Please fix the following errors:</p>
                  <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                    {Object.entries(formErrors).map(([field, error]) => 
                      error && <li key={field}>{error}</li>
                    )}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Student ID - Now editable for both add and edit */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Student ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="studentId"
                    value={formData.studentId || ""}
                    onChange={handleChange}
                    className={`w-full rounded-lg border px-4 py-3 outline-none focus:border-[#002147] ${
                      formErrors.studentId ? "border-red-500 bg-red-50" : "border-slate-300"
                    }`}
                    placeholder="STU001"
                    maxLength={6}
                  />
                  {formErrors.studentId && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.studentId}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">Format: STU followed by 3 digits (e.g., STU001)</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full rounded-lg border px-4 py-3 outline-none focus:border-[#002147] ${
                      formErrors.name ? "border-red-500 bg-red-50" : "border-slate-300"
                    }`}
                    placeholder="e.g., Samindi Kusalya"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>
                  )}
                  {!editingStudent && (
                    <p className="mt-1 text-xs text-slate-400">Email will be auto-generated as firstname.lastinitial@northbridge.com</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full rounded-lg border px-4 py-3 outline-none focus:border-[#002147] ${
                      formErrors.email ? "border-red-500 bg-red-50" : "border-slate-300"
                    }`}
                    placeholder="samindi.k@northbridge.com"
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.email}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">Format: firstname.lastinitial@northbridge.com</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Password {editingStudent ? "(Leave blank if no change)" : ""}
                    {!editingStudent && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password || ""}
                    onChange={handleChange}
                    className={`w-full rounded-lg border px-4 py-3 outline-none focus:border-[#002147] ${
                      formErrors.password ? "border-red-500 bg-red-50" : "border-slate-300"
                    }`}
                    placeholder="Min 8 chars with uppercase, lowercase, number & special char"
                  />
                  {formErrors.password && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.password}</p>
                  )}
                  {editingStudent && (
                    <p className="mt-1 text-xs text-slate-500">Leave blank to keep current password</p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">Must contain: uppercase, lowercase, number & special character</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleChange}
                    className={`w-full rounded-lg border px-4 py-3 outline-none focus:border-[#002147] ${
                      formErrors.phone ? "border-red-500 bg-red-50" : "border-slate-300"
                    }`}
                    placeholder="0712345678"
                    maxLength={10}
                  />
                  {formErrors.phone && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.phone}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">Exactly 10 digits, starting with 0</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Course
                  </label>
                  <input
                    type="text"
                    name="course"
                    value={formData.course || ""}
                    onChange={handleChange}
                    className={`w-full rounded-lg border px-4 py-3 outline-none focus:border-[#002147] ${
                      formErrors.course ? "border-red-500 bg-red-50" : "border-slate-300"
                    }`}
                    placeholder="e.g., Computer Science"
                  />
                  {formErrors.course && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.course}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Year
                  </label>
                  <select
                    name="year"
                    value={formData.year ?? 1}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#002147]"
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Semester
                  </label>
                  <select
                    name="semester"
                    value={formData.semester ?? 1}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#002147]"
                  >
                    <option value={1}>Semester 1</option>
                    <option value={2}>Semester 2</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className={`w-full rounded-lg border px-4 py-3 outline-none focus:border-[#002147] ${
                      formErrors.dateOfBirth ? "border-red-500 bg-red-50" : "border-slate-300"
                    }`}
                  />
                  {formErrors.dateOfBirth && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.dateOfBirth}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">Must be before 2010</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender || "Male"}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#002147]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address || ""}
                    onChange={handleChange}
                    rows={3}
                    className={`w-full rounded-lg border px-4 py-3 outline-none focus:border-[#002147] ${
                      formErrors.address ? "border-red-500 bg-red-50" : "border-slate-300"
                    }`}
                    placeholder="Enter full address (minimum 3 words, maximum 50 words)"
                  />
                  {formErrors.address && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.address}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">Minimum 3 words, maximum 50 words</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-[#002147] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#003366] disabled:opacity-60"
                >
                  {submitting ? "Saving..." : editingStudent ? "Update Student" : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 border-b border-slate-200 bg-white px-6 py-4 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Student Report</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Year and semester wise student distribution
                  </p>
                </div>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="px-6 py-4">
              <div className="mb-6 flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Filter by Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value === "all" ? "all" : Number(e.target.value))}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-[#002147]"
                  >
                    <option value="all">All Years</option>
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        Year {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Filter by Semester
                  </label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value === "all" ? "all" : Number(e.target.value))}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-[#002147]"
                  >
                    <option value="all">All Semesters</option>
                    <option value={1}>Semester 1</option>
                    <option value={2}>Semester 2</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={downloadCSV}
                    className="rounded-lg bg-[#002147] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#003366]"
                  >
                    Download CSV
                  </button>
                  <button
                    onClick={downloadJSON}
                    className="rounded-lg bg-[#002147] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#003366]"
                  >
                    Download JSON
                  </button>
                  <button
                    onClick={downloadPDF}
                    className="rounded-lg bg-[#002147] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#003366]"
                  >
                    Print / PDF
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {filteredReportData.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No students found for selected filters.
                  </div>
                ) : (
                  filteredReportData.map((item) => {
                    const maleCount = item.students.filter(s => s.gender === 'Male').length;
                    const femaleCount = item.students.filter(s => s.gender === 'Female').length;
                    const otherCount = item.students.filter(s => s.gender === 'Other').length;
                    
                    return (
                      <div key={`${item.year}-${item.semester}`} className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-[#002147] px-4 py-3">
                          <h4 className="text-white font-semibold">
                            Year {item.year} - Semester {item.semester}
                          </h4>
                          <p className="text-white/70 text-xs">
                            Total: {item.studentCount} students | Male: {maleCount} | Female: {femaleCount} | Other: {otherCount}
                          </p>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-100">
                              <tr>
                                <th className="px-3 py-2 text-left font-semibold text-slate-700">Student ID</th>
                                <th className="px-3 py-2 text-left font-semibold text-slate-700">Name</th>
                                <th className="px-3 py-2 text-left font-semibold text-slate-700">Email</th>
                                <th className="px-3 py-2 text-left font-semibold text-slate-700">Phone</th>
                                <th className="px-3 py-2 text-left font-semibold text-slate-700">Address</th>
                                <th className="px-3 py-2 text-left font-semibold text-slate-700">Course</th>
                                <th className="px-3 py-2 text-left font-semibold text-slate-700">Gender</th>
                              </tr>
                            </thead>
                            <tbody>
                              {item.students.map((student) => (
                                <tr key={student.id} className="border-t border-slate-200 hover:bg-slate-50">
                                  <td className="px-3 py-2">{getStudentIdValue(student)}</td>
                                  <td className="px-3 py-2">{student.name}</td>
                                  <td className="px-3 py-2">{student.email}</td>
                                  <td className="px-3 py-2">{student.phone || '-'}</td>
                                  <td className="px-3 py-2">{student.address || '-'}</td>
                                  <td className="px-3 py-2">{student.course || '-'}</td>
                                  <td className="px-3 py-2">{student.gender || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}