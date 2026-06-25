/**
 * Unified Data Service Repository
 * Transparently manages state between Local Storage mock, Google Sheets API, and Supabase.
 * Integrates robust validation contracts, UUID log generation, and complete CRUD (including DELETE).
 */
import { initialCompetitions } from './sampleData';
import { GoogleSheetsService } from './googleSheetsService';
import { SupabaseService } from './supabaseService';
import { ValidationService } from './validationService';

const LOCAL_STORAGE_KEY = 'digilians_competitions_data';
const LOGS_STORAGE_KEY = 'digilians_system_logs';

export class DataService {
  constructor() {
    this.mode = localStorage.getItem('dap_storage_mode') || import.meta.env.VITE_DEFAULT_STORAGE_MODE || 'local';
    this.googleSheetsUrl = localStorage.getItem('dap_google_sheets_url') || import.meta.env.VITE_GOOGLE_SHEETS_API_URL || '';
    this.supabaseUrl = localStorage.getItem('dap_supabase_url') || import.meta.env.VITE_SUPABASE_URL || '';
    this.supabaseKey = localStorage.getItem('dap_supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    this.googleSheetsService = new GoogleSheetsService(this.googleSheetsUrl);
    this.supabaseService = new SupabaseService(this.supabaseUrl, this.supabaseKey);
    this.isFallbackMode = false;
  }

  setCredentials(mode, googleSheetsUrl, supabaseUrl, supabaseKey) {
    this.mode = mode;
    this.googleSheetsUrl = googleSheetsUrl;
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
    this.isFallbackMode = false;

    localStorage.setItem('dap_storage_mode', mode);
    localStorage.setItem('dap_google_sheets_url', googleSheetsUrl);
    localStorage.setItem('dap_supabase_url', supabaseUrl);
    localStorage.setItem('dap_supabase_key', supabaseKey);

    this.googleSheetsService = new GoogleSheetsService(googleSheetsUrl);
    this.supabaseService = new SupabaseService(supabaseUrl, supabaseKey);
  }

  getCredentials() {
    return {
      mode: this.mode,
      googleSheetsUrl: this.googleSheetsUrl,
      supabaseUrl: this.supabaseUrl,
      supabaseKey: this.supabaseKey,
      isFallbackMode: this.isFallbackMode
    };
  }

  getLogs() {
    const logs = localStorage.getItem(LOGS_STORAGE_KEY);
    if (!logs) {
      const initialLogs = [
        { id: crypto.randomUUID(), timestamp: new Date().toISOString(), type: 'INFO', message: 'Digilians Competition Tracker platform initialized.' },
        { id: crypto.randomUUID(), timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'SUCCESS', message: 'Master database sync established.' }
      ];
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(initialLogs));
      return initialLogs;
    }
    return JSON.parse(logs);
  }

  addLog(type, message) {
    const logs = this.getLogs();
    const newLog = { id: crypto.randomUUID(), timestamp: new Date().toISOString(), type, message };
    logs.unshift(newLog);
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 100))); // Keep last 100 logs
  }

  async getAllCompetitions() {
    if (this.mode === 'google-sheets') {
      try {
        const data = await this.googleSheetsService.getAllCompetitions();
        this.isFallbackMode = false;
        this.addLog('SUCCESS', 'Fetched records from Google Sheets master database.');
        return data;
      } catch (err) {
        this.isFallbackMode = true;
        this.addLog('ERROR', `Google Sheets sync failed: ${err.message}. Serving local cache.`);
        console.warn('Falling back to local storage due to Google Sheets err:', err);
      }
    } else if (this.mode === 'supabase') {
      try {
        const data = await this.supabaseService.getAllCompetitions();
        this.isFallbackMode = false;
        this.addLog('SUCCESS', 'Fetched records from Supabase database.');
        return data;
      } catch (err) {
        this.isFallbackMode = true;
        this.addLog('ERROR', `Supabase sync failed: ${err.message}. Serving local cache.`);
        console.warn('Falling back to local storage due to Supabase err:', err);
      }
    }

    // Local storage / fallback mode
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialCompetitions));
      this.addLog('INFO', 'Preloaded initial competition data.');
      return initialCompetitions;
    }
    return JSON.parse(stored);
  }

  async createCompetition(record) {
    const validation = ValidationService.validateCompetitionRecord(record);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(' '));
    }

    record.competition_id = record.competition_id || `comp-${crypto.randomUUID()}`;
    record.created_at = record.created_at || new Date().toISOString();

    if (this.mode === 'google-sheets') {
      try {
        const res = await this.googleSheetsService.createCompetition(record);
        this.isFallbackMode = false;
        this.addLog('SUCCESS', `Successfully saved competition "${record.competition_name}" to Google Sheets.`);
        this._saveLocal(record, false); // Backup locally
        return res;
      } catch (err) {
        this.isFallbackMode = true;
        this.addLog('ERROR', `Google Sheets save failed: ${err.message}. Queued to local repository.`);
        return this._saveLocal(record, false);
      }
    } else if (this.mode === 'supabase') {
      try {
        const res = await this.supabaseService.createCompetition(record);
        this.isFallbackMode = false;
        this.addLog('SUCCESS', `Successfully saved competition "${record.competition_name}" to Supabase.`);
        this._saveLocal(record, false); // Backup locally
        return res;
      } catch (err) {
        this.isFallbackMode = true;
        this.addLog('ERROR', `Supabase save failed: ${err.message}. Queued to local repository.`);
        return this._saveLocal(record, false);
      }
    }

    this.addLog('SUCCESS', `Created competition record "${record.competition_name}" in local storage.`);
    return this._saveLocal(record, false);
  }

  async updateCompetition(record) {
    const validation = ValidationService.validateCompetitionRecord(record);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(' '));
    }

    if (this.mode === 'google-sheets') {
      try {
        const res = await this.googleSheetsService.updateCompetition(record);
        this.isFallbackMode = false;
        this.addLog('SUCCESS', `Updated competition "${record.competition_name}" in Google Sheets.`);
        this._saveLocal(record, true);
        return res;
      } catch (err) {
        this.isFallbackMode = true;
        this.addLog('ERROR', `Google Sheets update failed: ${err.message}. Updated local repository.`);
        return this._saveLocal(record, true);
      }
    } else if (this.mode === 'supabase') {
      try {
        const res = await this.supabaseService.updateCompetition(record);
        this.isFallbackMode = false;
        this.addLog('SUCCESS', `Updated competition "${record.competition_name}" in Supabase.`);
        this._saveLocal(record, true);
        return res;
      } catch (err) {
        this.isFallbackMode = true;
        this.addLog('ERROR', `Supabase update failed: ${err.message}. Updated local repository.`);
        return this._saveLocal(record, true);
      }
    }

    this.addLog('SUCCESS', `Updated competition record "${record.competition_name}" in local storage.`);
    return this._saveLocal(record, true);
  }

  async deleteCompetition(competitionId) {
    if (this.mode === 'google-sheets') {
      try {
        await this.googleSheetsService.deleteCompetition(competitionId);
        this.isFallbackMode = false;
        this.addLog('SUCCESS', `Deleted competition "${competitionId}" from Google Sheets.`);
        this._deleteLocal(competitionId);
        return true;
      } catch (err) {
        this.isFallbackMode = true;
        this.addLog('ERROR', `Google Sheets delete failed: ${err.message}. Deleted locally.`);
        this._deleteLocal(competitionId);
        return true;
      }
    } else if (this.mode === 'supabase') {
      try {
        await this.supabaseService.deleteCompetition(competitionId);
        this.isFallbackMode = false;
        this.addLog('SUCCESS', `Deleted competition "${competitionId}" from Supabase.`);
        this._deleteLocal(competitionId);
        return true;
      } catch (err) {
        this.isFallbackMode = true;
        this.addLog('ERROR', `Supabase delete failed: ${err.message}. Deleted locally.`);
        this._deleteLocal(competitionId);
        return true;
      }
    }

    this.addLog('SUCCESS', `Deleted competition record "${competitionId}" from local storage.`);
    this._deleteLocal(competitionId);
    return true;
  }

  _saveLocal(record, isUpdate) {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    let items = stored ? JSON.parse(stored) : [...initialCompetitions];
    if (isUpdate) {
      items = items.map(item => item.competition_id === record.competition_id ? record : item);
    } else {
      items.unshift(record);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    return record;
  }

  _deleteLocal(competitionId) {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    let items = stored ? JSON.parse(stored) : [...initialCompetitions];
    items = items.filter(item => item.competition_id !== competitionId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  }
}

export const dataService = new DataService();
