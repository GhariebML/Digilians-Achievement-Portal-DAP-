import { SupabaseService } from '../../services/supabaseService';

export class ActivityLogController {
  static async getStudentLogs(userId) {
    if (!userId) throw new Error("User ID is required to fetch activity logs.");
    return await SupabaseService.getStudentLogs(userId);
  }

  static async getAllLogs() {
    return await SupabaseService.getAllLogs();
  }
}
