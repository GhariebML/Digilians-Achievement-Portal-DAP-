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
    return {
      'Competition ID': this.sanitizeCell(c.id || c.competition_id),
      'Student Name': this.sanitizeCell(c.leader_name || c.student_name || 'Student'),
      'Email': this.sanitizeCell(c.leader_email || c.email || ''),
      'Competition Name': this.sanitizeCell(c.competition_name),
      'Organization': this.sanitizeCell(c.organization || c.organizer),
      'Date': this.sanitizeCell(c.date || c.deadline),
      'Status': this.sanitizeCell(c.status),
      'Category': this.sanitizeCell(c.category),
      'Project Name': this.sanitizeCell(c.project_name),
      'Links': this.sanitizeCell(c.verification_link || c.competition_link || ''),
      'Demo Link': this.sanitizeCell(c.demo_link),
      'Proof File': this.sanitizeCell(c.proof_file_path),
      'Leader Phone': this.sanitizeCell(c.leader_phone),
      'Member Count': c.team_members ? c.team_members.length : 0,
      'Notes & Feedback': this.sanitizeCell(c.notes || c.description),
      'Last Update': this.sanitizeCell(c.updated_at || c.created_at)
    };
  }

  static exportToExcel(competitions, filename = 'Digilians_Competitions_Report.xlsx') {
    try {
      const cleanData = competitions.map(c => this.getConsistentColumns(c));
      const worksheet = XLSX.utils.json_to_sheet(cleanData);
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
      doc.setFillColor(15, 23, 42); // #0F172A Dark Navy
      doc.rect(0, 0, doc.internal.pageSize.width, 100, 'F');
      
      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Digilians Competition Tracker', 40, 50);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Executive Summary & Participation Report', 40, 80);

      // Metadata
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 40, 130);
      doc.text(`Total Records: ${competitions.length}`, 220, 130);
      doc.text(`Success Rate: ${safeStats.successRate || '0%'}`, 400, 130);

      // Statistics Highlights Table
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('General Performance Overview', 40, 170);

      doc.autoTable({
        startY: 190,
        head: [['Metric', 'Value', 'Status']],
        body: [
          ['Total Students Participating', safeStats.totalStudents || 0, 'Active'],
          ['Total Competitions Tracked', safeStats.totalCompetitions || 0, 'Monitored'],
          ['Active Competing Teams', safeStats.activeTeams || 0, 'Ongoing'],
          ['Competition Finalists', safeStats.finalists || 0, 'Shortlisted'],
          ['Competition Winners', safeStats.winners || 0, 'Completed Awardees']
        ],
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { font: 'helvetica', fontSize: 11 },
        margin: { left: 40, right: 40 }
      });

      // Submissions Table
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Detailed Submissions & Status', 40, doc.lastAutoTable.finalY + 40);

      const tableData = competitions.map(c => [
        this.sanitizeCell(c.competition_name),
        this.sanitizeCell(c.category),
        this.sanitizeCell(c.team_name),
        this.sanitizeCell(c.status),
        this.sanitizeCell(c.ranking || 'N/A'),
        this.sanitizeCell(c.prize || 'None')
      ]);

      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 60,
        head: [['Competition', 'Category', 'Team', 'Status', 'Rank', 'Prize']],
        body: tableData,
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { font: 'helvetica', fontSize: 10 },
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
