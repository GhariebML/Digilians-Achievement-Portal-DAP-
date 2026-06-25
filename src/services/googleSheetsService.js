/**
 * Google Sheets Service Wrapper
 * Interacts with the Google Apps Script Web App endpoint with robust error handling and DELETE support.
 */

export class GoogleSheetsService {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
  }

  _isValidEndpoint() {
    return this.apiUrl && this.apiUrl.startsWith('https://script.google.com/macros/');
  }

  async _fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(url, { ...options, signal: controller.signal, redirect: 'follow' });
    clearTimeout(id);
    return response;
  }

  async getAllCompetitions() {
    if (!this._isValidEndpoint()) {
      throw new Error('Google Sheets API URL is not fully configured.');
    }
    const res = await this._fetchWithTimeout(this.apiUrl);
    if (!res.ok) {
      throw new Error(`Google Sheets Web App HTTP Error: ${res.status}`);
    }
    const result = await res.json();
    if (result.status === 'success') {
      return result.data || [];
    } else {
      throw new Error(result.message || 'Error fetching from Google Sheets');
    }
  }

  async createCompetition(record) {
    if (!this._isValidEndpoint()) {
      throw new Error('Google Sheets API URL is not fully configured.');
    }
    const res = await this._fetchWithTimeout(this.apiUrl, {
      method: 'POST',
      body: JSON.stringify({ action: 'create', record }),
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      throw new Error(`Google Sheets Web App HTTP Error: ${res.status}`);
    }
    const result = await res.json();
    if (result.status === 'success') {
      return result.data;
    } else {
      throw new Error(result.message || 'Error writing to Google Sheets');
    }
  }

  async updateCompetition(record) {
    if (!this._isValidEndpoint()) {
      throw new Error('Google Sheets API URL is not fully configured.');
    }
    const res = await this._fetchWithTimeout(this.apiUrl, {
      method: 'POST',
      body: JSON.stringify({ action: 'update', record }),
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      throw new Error(`Google Sheets Web App HTTP Error: ${res.status}`);
    }
    const result = await res.json();
    if (result.status === 'success') {
      return result.data;
    } else {
      throw new Error(result.message || 'Error updating Google Sheets');
    }
  }

  async deleteCompetition(competitionId) {
    if (!this._isValidEndpoint()) {
      throw new Error('Google Sheets API URL is not fully configured.');
    }
    const res = await this._fetchWithTimeout(this.apiUrl, {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', competition_id: competitionId }),
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      throw new Error(`Google Sheets Web App HTTP Error: ${res.status}`);
    }
    const result = await res.json();
    if (result.status === 'success') {
      return true;
    } else {
      throw new Error(result.message || 'Error deleting from Google Sheets');
    }
  }
}
