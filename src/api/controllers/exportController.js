import * as XLSX from 'xlsx';
import { ExportService } from '../../services/exportService';

export class ExportController {
  static getFormattedRow(c, studentsMap) {
    const student = studentsMap[c.user_id] || { name: c.leader_name || 'Unknown', email: c.leader_email || 'N/A' };
    return {
      'Student Name': ExportService.sanitizeCell(student.name),
      'Student Email': ExportService.sanitizeCell(student.email),
      'Competition Name': ExportService.sanitizeCell(c.competition_name),
      'Organization': ExportService.sanitizeCell(c.organization || c.organizer),
      'Submission Date': ExportService.sanitizeCell(c.date || c.deadline),
      'Category': ExportService.sanitizeCell(c.category),
      'Status': ExportService.sanitizeCell(c.status),
      'Verification Link': ExportService.sanitizeCell(c.verification_link || c.competition_link),
      'Notes': ExportService.sanitizeCell(c.notes || c.description),
      'Last Update': ExportService.sanitizeCell(c.updated_at || c.created_at)
    };
  }

  static exportSubmissionsExcel(submissions, students) {
    try {
      const studentsMap = {};
      students.forEach(s => { studentsMap[s.id] = s; });

      const cleanData = submissions.map(c => this.getFormattedRow(c, studentsMap));
      const worksheet = XLSX.utils.json_to_sheet(cleanData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');
      XLSX.writeFile(workbook, 'Digilians_Student_Submissions_Report.xlsx');
      return { success: true };
    } catch (err) {
      console.error('Excel export error:', err);
      return { success: false, error: err.message };
    }
  }

  static exportSubmissionsCSV(submissions, students) {
    try {
      const studentsMap = {};
      students.forEach(s => { studentsMap[s.id] = s; });

      const cleanData = submissions.map(c => this.getFormattedRow(c, studentsMap));
      const worksheet = XLSX.utils.json_to_sheet(cleanData);
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
      
      const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Digilians_Student_Submissions_Report.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return { success: true };
    } catch (err) {
      console.error('CSV export error:', err);
      return { success: false, error: err.message };
    }
  }
}
