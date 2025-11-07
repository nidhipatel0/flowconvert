/**
 * Profile Store (Zustand)
 *
 * Manages user profiles for document field replacement.
 * Stores profiles in localStorage for persistence.
 *
 * Per constitution: Privacy-first (localStorage only, no server storage)
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { UserProfile, ProfileFields } from '@/lib/types/profile';
import { v4 as uuidv4 } from 'uuid';

/**
 * Profile state interface
 */
export interface ProfileState {
  // Profiles
  profiles: Map<string, UserProfile>;
  activeProfileId: string | null;
  defaultProfileId: string | null;

  // Actions - Profile management
  addProfile: (name: string, fields: ProfileFields) => string;
  updateProfile: (profileId: string, updates: Partial<Omit<UserProfile, 'id'>>) => void;
  deleteProfile: (profileId: string) => void;
  duplicateProfile: (profileId: string, newName: string) => string;
  setActiveProfile: (profileId: string | null) => void;
  setDefaultProfile: (profileId: string | null) => void;

  // Actions - Field management
  updateField: (profileId: string, fieldKey: string, value: string) => void;
  deleteField: (profileId: string, fieldKey: string) => void;
  clearFields: (profileId: string) => void;

  // Getters
  getProfile: (profileId: string) => UserProfile | undefined;
  getActiveProfile: () => UserProfile | undefined;
  getDefaultProfile: () => UserProfile | undefined;
  getAllProfiles: () => UserProfile[];
  getFieldValue: (profileId: string, fieldKey: string) => string | undefined;
}

/**
 * Create Profile Store with localStorage persistence
 */
export const useProfileStore = create<ProfileState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        profiles: new Map(),
        activeProfileId: null,
        defaultProfileId: null,

        // Profile management actions
        addProfile: (name, fields) => {
          const profileId = uuidv4();
          const now = new Date();
          const profile: UserProfile = {
            id: profileId,
            name,
            fields,
            createdAt: now,
            updatedAt: now,
            isDefault: false,
          };

          set((state) => {
            const newProfiles = new Map(state.profiles);
            newProfiles.set(profileId, profile);

            // Auto-set as default if it's the first profile
            const isFirstProfile = state.profiles.size === 0;

            return {
              profiles: newProfiles,
              activeProfileId: state.activeProfileId ?? profileId,
              defaultProfileId: isFirstProfile ? profileId : state.defaultProfileId,
            };
          });

          // Update isDefault flag if this is the default
          if (get().profiles.size === 1) {
            get().setDefaultProfile(profileId);
          }

          return profileId;
        },

        updateProfile: (profileId, updates) => {
          set((state) => {
            const profile = state.profiles.get(profileId);
            if (!profile) {
              return state;
            }

            const updatedProfile = {
              ...profile,
              ...updates,
              updatedAt: new Date(),
            };
            const newProfiles = new Map(state.profiles);
            newProfiles.set(profileId, updatedProfile);

            return { profiles: newProfiles };
          });
        },

        deleteProfile: (profileId) => {
          set((state) => {
            const newProfiles = new Map(state.profiles);
            newProfiles.delete(profileId);

            let newActiveProfileId = state.activeProfileId;
            let newDefaultProfileId = state.defaultProfileId;

            // Update active profile if deleted
            if (state.activeProfileId === profileId) {
              const remainingProfiles = Array.from(newProfiles.keys());
              newActiveProfileId = remainingProfiles[0] ?? null;
            }

            // Update default profile if deleted
            if (state.defaultProfileId === profileId) {
              const remainingProfiles = Array.from(newProfiles.values());
              const firstProfile = remainingProfiles[0];
              newDefaultProfileId = firstProfile?.id ?? null;

              // Update isDefault flag
              if (firstProfile) {
                newProfiles.set(firstProfile.id, {
                  ...firstProfile,
                  isDefault: true,
                });
              }
            }

            return {
              profiles: newProfiles,
              activeProfileId: newActiveProfileId,
              defaultProfileId: newDefaultProfileId,
            };
          });
        },

        duplicateProfile: (profileId, newName) => {
          const profile = get().profiles.get(profileId);
          if (!profile) {
            throw new Error(`Profile ${profileId} not found`);
          }

          return get().addProfile(newName, { ...profile.fields });
        },

        setActiveProfile: (profileId) => {
          set({ activeProfileId: profileId });
        },

        setDefaultProfile: (profileId) => {
          set((state) => {
            const newProfiles = new Map(state.profiles);

            // Unmark all profiles as default
            newProfiles.forEach((profile) => {
              if (profile.isDefault) {
                newProfiles.set(profile.id, { ...profile, isDefault: false });
              }
            });

            // Mark new default profile
            if (profileId) {
              const profile = newProfiles.get(profileId);
              if (profile) {
                newProfiles.set(profileId, { ...profile, isDefault: true });
              }
            }

            return {
              profiles: newProfiles,
              defaultProfileId: profileId,
            };
          });
        },

        // Field management actions
        updateField: (profileId, fieldKey, value) => {
          set((state) => {
            const profile = state.profiles.get(profileId);
            if (!profile) {
              return state;
            }

            const updatedProfile = {
              ...profile,
              fields: {
                ...profile.fields,
                [fieldKey]: value,
              },
            };

            const newProfiles = new Map(state.profiles);
            newProfiles.set(profileId, updatedProfile);

            return { profiles: newProfiles };
          });
        },

        deleteField: (profileId, fieldKey) => {
          set((state) => {
            const profile = state.profiles.get(profileId);
            if (!profile) {
              return state;
            }

            const { [fieldKey]: _, ...remainingFields } = profile.fields;
            const updatedProfile = {
              ...profile,
              fields: remainingFields,
            };

            const newProfiles = new Map(state.profiles);
            newProfiles.set(profileId, updatedProfile);

            return { profiles: newProfiles };
          });
        },

        clearFields: (profileId) => {
          set((state) => {
            const profile = state.profiles.get(profileId);
            if (!profile) {
              return state;
            }

            const updatedProfile = {
              ...profile,
              fields: {},
            };

            const newProfiles = new Map(state.profiles);
            newProfiles.set(profileId, updatedProfile);

            return { profiles: newProfiles };
          });
        },

        // Getters
        getProfile: (profileId) => {
          return get().profiles.get(profileId);
        },

        getActiveProfile: () => {
          const { activeProfileId, profiles } = get();
          return activeProfileId ? profiles.get(activeProfileId) : undefined;
        },

        getDefaultProfile: () => {
          const { defaultProfileId, profiles } = get();
          return defaultProfileId ? profiles.get(defaultProfileId) : undefined;
        },

        getAllProfiles: () => {
          return Array.from(get().profiles.values());
        },

        getFieldValue: (profileId, fieldKey) => {
          const profile = get().profiles.get(profileId);
          return profile?.fields[fieldKey];
        },
      }),
      {
        name: 'flowconvert_profiles', // localStorage key
        // Custom storage to handle Map serialization
        storage: {
          getItem: (name) => {
            const str = localStorage.getItem(name);
            if (!str) {
              return null;
            }

            const { state } = JSON.parse(str);
            return {
              state: {
                ...state,
                profiles: new Map(Object.entries(state.profiles || {})),
              },
            };
          },
          setItem: (name, value) => {
            const { state } = value;
            const serializedState = {
              ...state,
              profiles: Object.fromEntries(state.profiles),
            };
            localStorage.setItem(name, JSON.stringify({ state: serializedState }));
          },
          removeItem: (name) => {
            localStorage.removeItem(name);
          },
        },
      }
    ),
    {
      name: 'profile-store',
    }
  )
);
