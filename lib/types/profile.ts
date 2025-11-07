/**
 * User Profile Type Definitions
 *
 * Saved collection of personal/academic field values for quick document replacement.
 * Stored in browser localStorage (privacy-first, never uploaded to server).
 */

/**
 * Profile field values
 */
export interface ProfileFields {
  name?: string;
  rollNumber?: string;
  email?: string;
  phone?: string;
  class?: string;
  section?: string;
  designation?: string;
  employeeId?: string;
  studentId?: string;
  [key: string]: string | undefined; // Allow custom fields
}

/**
 * User Profile entity
 */
export interface UserProfile {
  id: string; // UUID v4
  name: string; // Profile name (e.g., "Jane Smith - Student")
  fields: ProfileFields;
  createdAt: Date;
  updatedAt: Date;
  isDefault: boolean; // Auto-select on page load
}

/**
 * Validation rules
 */
export const PROFILE_VALIDATION_RULES = {
  MIN_PROFILE_NAME_LENGTH: 1,
  MAX_PROFILE_NAME_LENGTH: 100,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  INDIAN_PHONE_REGEX: /^[6-9]\d{9}$/,
  ALPHANUMERIC_REGEX: /^[a-zA-Z0-9]+$/,
} as const;

/**
 * localStorage key for profiles
 */
export const PROFILES_STORAGE_KEY = 'flowconvert_profiles' as const;

export type CreateProfileInput = Omit<
  UserProfile,
  'id' | 'createdAt' | 'updatedAt'
>;
export type UpdateProfileInput = Partial<Omit<UserProfile, 'id'>>;
