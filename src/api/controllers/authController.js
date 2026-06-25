import { SupabaseService } from '../../services/supabaseService';
import { ValidationService } from '../../services/validationService';

export class AuthController {
  static async registerStudent({ name, email, password }) {
    if (!name || !email || !password) {
      throw new Error('Name, email, and password are required.');
    }
    if (!ValidationService.validateEmail(email)) {
      throw new Error('Please provide a valid email address.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    return await SupabaseService.registerStudent({ name, email, password });
  }

  static async login({ email, password }) {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }
    return await SupabaseService.login({ email, password });
  }

  static async logout() {
    return await SupabaseService.logout();
  }

  static async getAllStudents() {
    return await SupabaseService.getAllStudents();
  }
}
