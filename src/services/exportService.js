/**
 * Export Service
 * Generates pristine Excel, CSV, and formatted PDF reports with OWASP formula injection protection.
 */
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export class ExportService {
  static sanitizeCell(val) {
    if (val === null || val === undefined) return '';
    let str = String(val);
    if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
      return "'" + str; // Escape formula injection
    }
    return str;
  }

  static getConsistentColumns(c) {
    let teamMembersStr = '';
    if (Array.isArray(c.team_members) && c.team_members.length > 0) {
      teamMembersStr = c.team_members.map(m => `${m.name} (${m.email})`).join(' | ');
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      try {
        return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      } catch (e) {
        return dateStr;
      }
    };

    return {
      'Submission ID': this.sanitizeCell(c.id || c.competition_id),
      'Student Name': this.sanitizeCell(c.leader_name || c.student_name || 'Student'),
      'Student Email': this.sanitizeCell(c.leader_email || c.email || ''),
      'Competition Name': this.sanitizeCell(c.competition_name),
      'Project Name': this.sanitizeCell(c.project_name || ''),
      'Organization': this.sanitizeCell(c.organization || c.organizer || ''),
      'Category': this.sanitizeCell(c.category),
      'Status': this.sanitizeCell(c.status),
      'Date Submitted': this.sanitizeCell(formatDate(c.date || c.deadline)),
      'Team Members': this.sanitizeCell(teamMembersStr),
      'Demo Link': this.sanitizeCell(c.demo_link || ''),
      'Proof / Certificate': this.sanitizeCell(c.proof_file_path || c.verification_link || c.competition_link || ''),
      'Notes & Feedback': this.sanitizeCell(c.notes || c.description || ''),
      'Last Update': this.sanitizeCell(formatDate(c.updated_at || c.created_at))
    };
  }

  static exportToExcel(competitions, filename = 'Digilians_Competitions_Report.xlsx') {
    try {
      const cleanData = competitions.map(c => this.getConsistentColumns(c));
      const worksheet = XLSX.utils.json_to_sheet(cleanData);
      
      // Auto-size columns for a more professional look
      const colWidths = [
        { wch: 20 }, // ID
        { wch: 30 }, // Student Name
        { wch: 35 }, // Email
        { wch: 45 }, // Competition Name
        { wch: 35 }, // Project Name
        { wch: 30 }, // Organization
        { wch: 20 }, // Category
        { wch: 15 }, // Status
        { wch: 18 }, // Date Submitted
        { wch: 50 }, // Team Members
        { wch: 45 }, // Demo Link
        { wch: 45 }, // Proof
        { wch: 40 }, // Notes
        { wch: 18 }  // Last Update
      ];
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Competitions');
      XLSX.writeFile(workbook, filename);
      return { success: true };
    } catch (err) {
      console.error('Excel export error:', err);
      return { success: false, error: err.message };
    }
  }

  static exportToCSV(competitions, filename = 'Digilians_Competitions_Report.csv') {
    try {
      const cleanData = competitions.map(c => this.getConsistentColumns(c));
      const worksheet = XLSX.utils.json_to_sheet(cleanData);
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
      
      const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up memory leak
      return { success: true };
    } catch (err) {
      console.error('CSV export error:', err);
      return { success: false, error: err.message };
    }
  }

  static exportToPDF(competitions, stats, filename = 'Digilians_Executive_Report.pdf') {
    try {
      const safeStats = stats || {};
      const doc = new jsPDF('p', 'pt', 'a4');
      
      // Primary Color Header banner
      doc.setFillColor(9, 13, 22); // #090D16 Dark Navy
      doc.rect(0, 0, doc.internal.pageSize.width, 110, 'F');
      
      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.text('DIGILIANS', 40, 50, { charSpace: 1.5 });
      
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(99, 102, 241); // Indigo Accent
      doc.text('ACHIEVEMENT PORTAL', 185, 50);

      doc.setTextColor(180, 190, 210);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Executive Summary & Master Data Report', 40, 85);

      // Metadata
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 40, 140);
      doc.text(`Total Records: ${competitions.length}`, 220, 140);
      doc.text(`Success Rate: ${safeStats.successRate || '0%'}`, 400, 140);

      // Statistics Highlights Table
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('General Performance Overview', 40, 180);

      doc.autoTable({
        startY: 195,
        head: [['Metric', 'Value', 'Status']],
        body: [
          ['Total Students Participating', safeStats.totalStudents || 0, 'Active'],
          ['Total Competitions Tracked', safeStats.totalCompetitions || 0, 'Monitored'],
          ['Active Competing Teams', safeStats.activeTeams || 0, 'Ongoing'],
          ['Competition Finalists', safeStats.finalists || 0, 'Shortlisted'],
          ['Competition Winners', safeStats.winners || 0, 'Completed Awardees']
        ],
        headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { font: 'helvetica', fontSize: 11, cellPadding: 6 },
        margin: { left: 40, right: 40 }
      });

      // Submissions Table
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('Detailed Submissions & Status', 40, doc.lastAutoTable.finalY + 40);

      const tableData = competitions.map(c => [
        this.sanitizeCell(c.competition_name),
        this.sanitizeCell(c.project_name || 'N/A'),
        this.sanitizeCell(c.category),
        this.sanitizeCell(c.leader_name || c.student_name || 'N/A'),
        this.sanitizeCell(c.status),
        c.team_members && Array.isArray(c.team_members) ? String(c.team_members.length) : '0'
      ]);

      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 55,
        head: [['Competition', 'Project', 'Category', 'Leader', 'Status', 'Team Size']],
        body: tableData,
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, overflow: 'linebreak' },
        columnStyles: { 
          0: { cellWidth: 100 },
          1: { cellWidth: 120 },
          2: { cellWidth: 80 },
          3: { cellWidth: 90 },
          4: { cellWidth: 70 },
          5: { cellWidth: 55, halign: 'center' }
        },
        margin: { left: 40, right: 40 }
      });

      // Footer
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${totalPages} - Digilians Achievement Portal`, 40, doc.internal.pageSize.height - 30);
      }

      doc.save(filename);
      return { success: true };
    } catch (err) {
      console.error('PDF export error:', err);
      return { success: false, error: err.message };
    }
  }
}
