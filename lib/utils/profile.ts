/**
 * Profile Management Utilities
 *
 * Handles saving, loading, and managing user profiles in localStorage
 */

import { UserProfile, PROFILES_STORAGE_KEY, DEFAULT_PROFILE_ID } from '@/lib/types/profile';

/**
 * Load all profiles from localStorage
 */
export function loadProfiles(): UserProfile[] {
  try {
    const stored = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (!stored) return [];

    const profiles = JSON.parse(stored);
    return profiles.map((p: UserProfile) => ({
      ...p,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
    }));
  } catch (error) {
    console.error('Failed to load profiles:', error);
    return [];
  }
}

/**
 * Save profiles to localStorage
 */
export function saveProfiles(profiles: UserProfile[]): boolean {
  try {
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    return true;
  } catch (error) {
    console.error('Failed to save profiles:', error);
    return false;
  }
}

/**
 * Get a profile by ID
 */
export function getProfile(id: string): UserProfile | null {
  const profiles = loadProfiles();
  return profiles.find(p => p.id === id) || null;
}

/**
 * Create a new profile
 */
export function createProfile(name: string): UserProfile {
  const newProfile: UserProfile = {
    id: `profile_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name,
    createdAt: new Date(),
    updatedAt: new Date(),
    isDefault: false,
    fields: {},
  };

  const profiles = loadProfiles();
  profiles.push(newProfile);
  saveProfiles(profiles);

  return newProfile;
}

/**
 * Update an existing profile
 */
export function updateProfile(id: string, updates: Partial<UserProfile>): UserProfile | null {
  const profiles = loadProfiles();
  const index = profiles.findIndex(p => p.id === id);

  if (index === -1) return null;

  const profile = profiles[index];
  if (!profile) return null;

  const updated: UserProfile = {
    ...profile,
    ...updates,
    id: profile.id, // Prevent ID change
    createdAt: profile.createdAt, // Prevent createdAt change
    updatedAt: new Date(),
  };

  profiles[index] = updated;
  saveProfiles(profiles);

  return updated;
}

/**
 * Delete a profile by ID
 */
export function deleteProfile(id: string): boolean {
  const profiles = loadProfiles();
  const filtered = profiles.filter(p => p.id !== id);

  if (filtered.length === profiles.length) {
    return false; // Profile not found
  }

  saveProfiles(filtered);
  return true;
}

/**
 * Get the default profile (or create one if it doesn't exist)
 */
export function getDefaultProfile(): UserProfile {
  let profile = getProfile(DEFAULT_PROFILE_ID);

  if (!profile) {
    profile = {
      id: DEFAULT_PROFILE_ID,
      name: 'Default Profile',
      createdAt: new Date(),
      updatedAt: new Date(),
      isDefault: true,
      fields: {},
    };

    const profiles = loadProfiles();
    profiles.push(profile);
    saveProfiles(profiles);
  }

  return profile;
}

/**
 * Duplicate a profile
 */
export function duplicateProfile(id: string, newName?: string): UserProfile | null {
  const original = getProfile(id);
  if (!original) return null;

  const duplicate: UserProfile = {
    id: `profile_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: newName || `${original.name} (Copy)`,
    createdAt: new Date(),
    updatedAt: new Date(),
    isDefault: false,
    fields: { ...original.fields },
  };

  const profiles = loadProfiles();
  profiles.push(duplicate);
  saveProfiles(profiles);

  return duplicate;
}

/**
 * Get profile count
 */
export function getProfileCount(): number {
  return loadProfiles().length;
}

/**
 * Export profile as JSON
 */
export function exportProfile(id: string): string | null {
  const profile = getProfile(id);
  if (!profile) return null;

  return JSON.stringify(profile, null, 2);
}

/**
 * Import profile from JSON
 */
export function importProfile(jsonString: string): UserProfile | null {
  try {
    const imported = JSON.parse(jsonString) as UserProfile;

    // Generate new ID to avoid conflicts
    const newProfile: UserProfile = {
      ...imported,
      id: `profile_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDefault: false,
    };

    const profiles = loadProfiles();
    profiles.push(newProfile);
    saveProfiles(profiles);

    return newProfile;
  } catch (error) {
    console.error('Failed to import profile:', error);
    return null;
  }
}
