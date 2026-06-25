import { SupabaseService } from '../../services/supabaseService';

export class CompetitionController {
  static async getStudentSubmissions(userId) {
    if (!userId) throw new Error("User ID is required to fetch submissions.");
    return await SupabaseService.getStudentSubmissions(userId);
  }

  static async getAllSubmissions() {
    return await SupabaseService.getAllSubmissions();
  }

  static async createSubmission(competitionData, userId, userName) {
    if (!userId) throw new Error("User ID is required to create a submission.");
    if (!competitionData.competition_name) throw new Error("Competition Name is required.");
    if (!competitionData.verification_link) throw new Error("Verification Link is required.");

    return await SupabaseService.createSubmission(competitionData, userId, userName);
  }

  static async updateSubmission(competitionId, updateData, userId, userName) {
    if (!competitionId) throw new Error("Competition ID is required for update.");
    return await SupabaseService.updateSubmission(competitionId, updateData, userId, userName);
  }

  static async deleteSubmission(competitionId, userId, userName) {
    if (!competitionId) throw new Error("Competition ID is required for deletion.");
    return await SupabaseService.deleteSubmission(competitionId, userId, userName);
  }
}
