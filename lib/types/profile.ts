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
  // Personal Information
  fullName?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;

  // Educational/Professional
  rollNumber?: string;
  studentId?: string;
  employeeId?: string;
  class?: string;
  section?: string;
  grade?: string;
  designation?: string;
  department?: string;

  // Address Information
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;

  // Custom fields (user-defined)
  [key: string]: string | undefined;
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
 * Detected field in a document
 */
export interface DetectedField {
  field: keyof ProfileFields | string; // Field name
  label: string; // Display label found in document
  value?: string; // Current value in document
  confidence: number; // 0-1 confidence score
  position: {
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
  };
  pattern: string; // Regex pattern that detected this field
}

/**
 * Field detection pattern
 */
export interface FieldPattern {
  field: keyof ProfileFields;
  patterns: RegExp[]; // Multiple patterns to match the field
  priority: number; // Higher priority patterns checked first
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
export const DEFAULT_PROFILE_ID = 'flowconvert_default_profile' as const;

/**
 * Common field detection patterns for Smart Document Personalization
 */
export const FIELD_PATTERNS: FieldPattern[] = [
  {
    field: 'fullName',
    patterns: [
      /\b(full\s+)?name\s*:?\s*/i,
      /\bcandidate\s+name\s*:?\s*/i,
      /\bstudent\s+name\s*:?\s*/i,
      /\bemployee\s+name\s*:?\s*/i,
    ],
    priority: 1,
  },
  {
    field: 'email',
    patterns: [
      /\be-?mail(\s+address)?\s*:?\s*/i,
      /\bcontact\s+email\s*:?\s*/i,
    ],
    priority: 1,
  },
  {
    field: 'phone',
    patterns: [
      /\bphone(\s+number)?\s*:?\s*/i,
      /\bmobile(\s+number)?\s*:?\s*/i,
      /\bcontact(\s+number)?\s*:?\s*/i,
      /\btel(ephone)?\s*:?\s*/i,
    ],
    priority: 1,
  },
  {
    field: 'rollNumber',
    patterns: [
      /\broll(\s+number)?\s*:?\s*/i,
      /\broll\s+no\.?\s*:?\s*/i,
      /\bstudent\s+roll\s*:?\s*/i,
    ],
    priority: 2,
  },
  {
    field: 'studentId',
    patterns: [
      /\bstudent\s+id\s*:?\s*/i,
      /\bstudent\s+number\s*:?\s*/i,
      /\bmatriculation\s+number\s*:?\s*/i,
    ],
    priority: 2,
  },
  {
    field: 'employeeId',
    patterns: [
      /\bemployee\s+id\s*:?\s*/i,
      /\bstaff\s+id\s*:?\s*/i,
      /\bemployee\s+number\s*:?\s*/i,
    ],
    priority: 2,
  },
  {
    field: 'class',
    patterns: [
      /\bclass\s*:?\s*/i,
      /\bgrade\s*:?\s*/i,
    ],
    priority: 2,
  },
  {
    field: 'designation',
    patterns: [
      /\bdesignation\s*:?\s*/i,
      /\bposition\s*:?\s*/i,
      /\bjob\s+title\s*:?\s*/i,
      /\brole\s*:?\s*/i,
    ],
    priority: 2,
  },
  {
    field: 'department',
    patterns: [
      /\bdepartment\s*:?\s*/i,
      /\bdept\.?\s*:?\s*/i,
      /\bdivision\s*:?\s*/i,
    ],
    priority: 2,
  },
  {
    field: 'address',
    patterns: [
      /\baddress\s*:?\s*/i,
      /\bstreet\s+address\s*:?\s*/i,
      /\bresidential\s+address\s*:?\s*/i,
    ],
    priority: 3,
  },
  {
    field: 'city',
    patterns: [
      /\bcity\s*:?\s*/i,
      /\btown\s*:?\s*/i,
    ],
    priority: 3,
  },
  {
    field: 'state',
    patterns: [
      /\bstate\s*:?\s*/i,
      /\bprovince\s*:?\s*/i,
      /\bregion\s*:?\s*/i,
    ],
    priority: 3,
  },
  {
    field: 'zipCode',
    patterns: [
      /\bzip(\s+code)?\s*:?\s*/i,
      /\bpostal\s+code\s*:?\s*/i,
      /\bpin\s+code\s*:?\s*/i,
    ],
    priority: 3,
  },
];

export type CreateProfileInput = Omit<
  UserProfile,
  'id' | 'createdAt' | 'updatedAt'
>;
export type UpdateProfileInput = Partial<Omit<UserProfile, 'id'>>;
