/**
 * Validation Service
 * Enforces strict schema definitions, regex sanitization, and input validation contracts.
 */

export class ValidationService {
  static validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }

  static validateUrl(url) {
    if (!url) return true; // Optional fields
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static sanitizeText(text) {
    if (!text) return '';
    // Strip potential dangerous script tags or leading formula characters if needed for general display
    return String(text).trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  static validateCompetitionRecord(record) {
    const errors = [];

    if (!record.competition_name || record.competition_name.trim() === '') {
      errors.push('Competition Name is required.');
    }
    if (!record.competition_link || !this.validateUrl(record.competition_link)) {
      errors.push('A valid Competition Link URL is required.');
    }
    if (!record.team_name || record.team_name.trim() === '') {
      errors.push('Team Name is required.');
    }
    if (!record.leader_name || record.leader_name.trim() === '') {
      errors.push('Team Leader Name is required.');
    }
    if (!record.leader_email || !this.validateEmail(record.leader_email)) {
      errors.push('A valid Team Leader Email is required.');
    }
    if (!record.leader_phone || record.leader_phone.trim() === '') {
      errors.push('Team Leader Phone is required.');
    }

    if (record.team_members && Array.isArray(record.team_members)) {
      record.team_members.forEach((m, idx) => {
        if (m.email && !this.validateEmail(m.email)) {
          errors.push(`Team Member #${idx + 1} (${m.name || 'Unnamed'}) has an invalid email.`);
        }
      });
    }

    if (record.certificate_link && !this.validateUrl(record.certificate_link)) {
      errors.push('Certificate Link must be a valid URL.');
    }
    if (record.demo_link && !this.validateUrl(record.demo_link)) {
      errors.push('Demo Link must be a valid URL.');
    }
    if (record.github_repo && !this.validateUrl(record.github_repo)) {
      errors.push('GitHub Repository must be a valid URL.');
    }
    if (record.linkedin_post && !this.validateUrl(record.linkedin_post)) {
      errors.push('LinkedIn Post must be a valid URL.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
