/**
 * Digilians Competition Tracker Platform - Google Apps Script Backend
 * Serves as a REST API endpoint (Master Database) to read and write competition records instantly.
 * 
 * Instructions:
 * 1. Open a Google Sheet and go to Extensions > Apps Script.
 * 2. Paste this code into Code.gs.
 * 3. Deploy as a Web App (Execute as: Me, Access: Anyone).
 * 4. Copy the Web App URL to your .env file or Admin Settings tab.
 */

const SHEET_NAME = 'Competitions';

function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = [
      'competition_id', 'competition_name', 'competition_link', 'organizer', 'category',
      'deadline', 'country', 'mode', 'team_name', 'leader_name', 'leader_email', 'leader_phone',
      'team_members', 'project_name', 'project_description', 'tech_stack', 'status',
      'achievement', 'ranking', 'prize', 'certificate_link', 'demo_link', 'github_repo',
      'linkedin_post', 'notes', 'created_at'
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0F172A').setFontColor('#F8FAFC');
    sheet.setFrozenRows(1);
  }
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      setupSheet();
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    const result = rows.map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i];
      });
      try { obj.team_members = JSON.parse(obj.team_members); } catch(err){}
      return obj;
    });
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) { setupSheet(); sheet = ss.getSheetByName(SHEET_NAME); }
    
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action || 'create';
    const record = requestData.record;
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    if (action === 'create') {
      record.competition_id = record.competition_id || Utilities.getUuid();
      record.created_at = record.created_at || new Date().toISOString();
      
      const newRow = headers.map(header => {
        let val = record[header] || '';
        if (typeof val === 'object') { val = JSON.stringify(val); }
        return val;
      });
      sheet.appendRow(newRow);
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Record created successfully', data: record }))
        .setMimeType(ContentService.MimeType.JSON);
    } 
    else if (action === 'update') {
      const id = record.competition_id;
      let rowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === id) { rowIndex = i + 1; break; }
      }
      if (rowIndex > -1) {
        const updateRow = headers.map(header => {
          let val = record[header] || '';
          if (typeof val === 'object') { val = JSON.stringify(val); }
          return val;
        });
        sheet.getRange(rowIndex, 1, 1, headers.length).setValues([updateRow]);
        return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Record updated successfully', data: record }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Record not found' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    else if (action === 'delete') {
      const id = requestData.competition_id || (record && record.competition_id);
      let rowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === id) { rowIndex = i + 1; break; }
      }
      if (rowIndex > -1) {
        sheet.deleteRow(rowIndex);
        return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Record deleted successfully' }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Record not found in Google Sheets' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
