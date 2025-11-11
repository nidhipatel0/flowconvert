'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserProfile, ProfileFields, DEFAULT_PROFILE_ID } from '@/lib/types/profile';
import {
  loadProfiles,
  saveProfiles,
  exportProfile,
  importProfile,
} from '@/lib/utils/profile';

export function ProfileManager() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [profileName, setProfileName] = useState('');
  const [formFields, setFormFields] = useState<ProfileFields>({});

  // Load profiles on mount
  useEffect(() => {
    const loaded = loadProfiles();
    setProfiles(loaded);

    // Select default profile if exists
    const defaultProfile = loaded.find(p => p.id === DEFAULT_PROFILE_ID) || loaded[0];
    if (defaultProfile) {
      setSelectedProfile(defaultProfile);
    }
  }, []);

  const handleCreateProfile = useCallback(() => {
    setIsCreating(true);
    setIsEditing(false);
    setProfileName('');
    setFormFields({});
    setSelectedProfile(null);
  }, []);

  const handleSaveProfile = useCallback(() => {
    if (!profileName.trim()) {
      alert('Please enter a profile name');
      return;
    }

    if (isCreating) {
      // Create new profile
      const newProfile: UserProfile = {
        id: `profile_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name: profileName.trim(),
        fields: formFields,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDefault: profiles.length === 0, // First profile is default
      };

      const updated = [...profiles, newProfile];
      setProfiles(updated);
      saveProfiles(updated);
      setSelectedProfile(newProfile);
      setIsCreating(false);
      alert('Profile created successfully!');
    } else if (selectedProfile) {
      // Update existing profile
      const updatedProfile: UserProfile = {
        ...selectedProfile,
        name: profileName.trim(),
        fields: formFields,
        updatedAt: new Date(),
      };

      const updated = profiles.map(p => p.id === selectedProfile.id ? updatedProfile : p);
      setProfiles(updated);
      saveProfiles(updated);
      setSelectedProfile(updatedProfile);
      setIsEditing(false);
      alert('Profile updated successfully!');
    }
  }, [profileName, formFields, isCreating, selectedProfile, profiles]);

  const handleEditProfile = useCallback(() => {
    if (!selectedProfile) return;

    setIsEditing(true);
    setIsCreating(false);
    setProfileName(selectedProfile.name);
    setFormFields(selectedProfile.fields);
  }, [selectedProfile]);

  const handleDeleteProfile = useCallback((id: string) => {
    if (!confirm('Are you sure you want to delete this profile?')) return;

    const updated = profiles.filter(p => p.id !== id);
    setProfiles(updated);
    saveProfiles(updated);

    if (selectedProfile?.id === id) {
      setSelectedProfile(updated[0] || null);
    }

    alert('Profile deleted successfully!');
  }, [profiles, selectedProfile]);

  const handleDuplicateProfile = useCallback((id: string) => {
    const original = profiles.find(p => p.id === id);
    if (!original) return;

    const duplicate: UserProfile = {
      id: `profile_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: `${original.name} (Copy)`,
      fields: { ...original.fields },
      createdAt: new Date(),
      updatedAt: new Date(),
      isDefault: false,
    };

    const updated = [...profiles, duplicate];
    setProfiles(updated);
    saveProfiles(updated);
    setSelectedProfile(duplicate);
    alert('Profile duplicated successfully!');
  }, [profiles]);

  const handleSetDefault = useCallback((id: string) => {
    const updated = profiles.map(p => ({
      ...p,
      isDefault: p.id === id,
    }));

    setProfiles(updated);
    saveProfiles(updated);
    alert('Default profile updated!');
  }, [profiles]);

  const handleExportProfile = useCallback((id: string) => {
    const json = exportProfile(id);
    if (!json) return;

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profile_${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleImportProfile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const imported = importProfile(json);
        if (imported) {
          const updated = [...profiles, imported];
          setProfiles(updated);
          setSelectedProfile(imported);
          alert('Profile imported successfully!');
        }
      } catch (error) {
        alert('Failed to import profile. Invalid file format.');
      }
    };
    reader.readAsText(file);
  }, [profiles]);

  const handleFieldChange = useCallback((field: string, value: string) => {
    setFormFields(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setIsCreating(false);
    setProfileName('');
    setFormFields({});
  }, []);

  const handleSelectProfile = useCallback((profile: UserProfile) => {
    setSelectedProfile(profile);
    setIsEditing(false);
    setIsCreating(false);
  }, []);

  if (profiles.length === 0 && !isCreating) {
    return (
      <div className="workspace-card">
        <div className="text-center py-8">
          <h2 className="text-lg font-semibold text-secondary-900 mb-2">
            No Profiles Found
          </h2>
          <p className="text-sm text-secondary-600 mb-4">
            Create a profile to quickly fill forms and documents with your information.
          </p>
          <button onClick={handleCreateProfile} className="btn-primary">
            Create Your First Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold text-secondary-900">
          Profile Manager
        </h2>
        <div className="flex gap-2">
          <input
            type="file"
            accept="application/json"
            onChange={handleImportProfile}
            className="hidden"
            id="import-profile"
          />
          <label
            htmlFor="import-profile"
            className="btn-secondary text-sm cursor-pointer"
          >
            Import
          </label>
          <button onClick={handleCreateProfile} className="btn-primary text-sm">
            + New Profile
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile List */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-secondary-700 mb-3">
            Your Profiles ({profiles.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  selectedProfile?.id === profile.id
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-secondary-200 hover:border-cyan-300'
                }`}
                onClick={() => handleSelectProfile(profile)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-secondary-900 truncate">
                      {profile.name}
                    </p>
                    <p className="text-xs text-secondary-500 mt-1">
                      {Object.keys(profile.fields).length} fields
                    </p>
                    {profile.isDefault && (
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateProfile(profile.id);
                      }}
                      className="text-xs text-secondary-500 hover:text-cyan-600"
                      title="Duplicate"
                    >
                      📋
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportProfile(profile.id);
                      }}
                      className="text-xs text-secondary-500 hover:text-cyan-600"
                      title="Export"
                    >
                      📤
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProfile(profile.id);
                      }}
                      className="text-xs text-red-500 hover:text-red-700"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Profile Editor */}
        <div className="md:col-span-2 space-y-4">
          {(isCreating || isEditing) ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-secondary-700">
                  {isCreating ? 'Create New Profile' : 'Edit Profile'}
                </h3>
                <div className="flex gap-2">
                  <button onClick={handleCancel} className="btn-secondary text-sm">
                    Cancel
                  </button>
                  <button onClick={handleSaveProfile} className="btn-primary text-sm">
                    Save Profile
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-secondary-700 mb-2">
                    Profile Name *
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="e.g., John Doe - Student"
                    className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Personal Information */}
                  <div>
                    <label className="block text-xs font-medium text-secondary-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formFields.fullName || ''}
                      onChange={(e) => handleFieldChange('fullName', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-secondary-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formFields.email || ''}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-secondary-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formFields.phone || ''}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-secondary-700 mb-2">
                      Roll Number
                    </label>
                    <input
                      type="text"
                      value={formFields.rollNumber || ''}
                      onChange={(e) => handleFieldChange('rollNumber', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-secondary-700 mb-2">
                      Student ID
                    </label>
                    <input
                      type="text"
                      value={formFields.studentId || ''}
                      onChange={(e) => handleFieldChange('studentId', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-secondary-700 mb-2">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      value={formFields.employeeId || ''}
                      onChange={(e) => handleFieldChange('employeeId', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-secondary-700 mb-2">
                      Class / Grade
                    </label>
                    <input
                      type="text"
                      value={formFields.class || ''}
                      onChange={(e) => handleFieldChange('class', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-secondary-700 mb-2">
                      Designation
                    </label>
                    <input
                      type="text"
                      value={formFields.designation || ''}
                      onChange={(e) => handleFieldChange('designation', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-secondary-700 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      value={formFields.department || ''}
                      onChange={(e) => handleFieldChange('department', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-secondary-700 mb-2">
                      Address
                    </label>
                    <textarea
                      value={formFields.address || ''}
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-secondary-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={formFields.city || ''}
                      onChange={(e) => handleFieldChange('city', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-secondary-700 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      value={formFields.state || ''}
                      onChange={(e) => handleFieldChange('state', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-secondary-700 mb-2">
                      ZIP / Postal Code
                    </label>
                    <input
                      type="text"
                      value={formFields.zipCode || ''}
                      onChange={(e) => handleFieldChange('zipCode', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-secondary-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      value={formFields.country || ''}
                      onChange={(e) => handleFieldChange('country', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : selectedProfile ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-secondary-700">
                  Profile Details
                </h3>
                <div className="flex gap-2">
                  {!selectedProfile.isDefault && (
                    <button
                      onClick={() => handleSetDefault(selectedProfile.id)}
                      className="btn-secondary text-sm"
                    >
                      Set as Default
                    </button>
                  )}
                  <button onClick={handleEditProfile} className="btn-primary text-sm">
                    Edit Profile
                  </button>
                </div>
              </div>

              <div className="border border-secondary-200 rounded-lg p-4 bg-secondary-50">
                <h4 className="text-sm font-semibold text-secondary-900 mb-3">
                  {selectedProfile.name}
                </h4>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {Object.entries(selectedProfile.fields).map(([key, value]) => (
                    value && (
                      <div key={key}>
                        <p className="text-xs text-secondary-500 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </p>
                        <p className="font-medium text-secondary-900">{value}</p>
                      </div>
                    )
                  ))}
                </div>

                {Object.keys(selectedProfile.fields).length === 0 && (
                  <p className="text-sm text-secondary-500 text-center py-4">
                    No fields added yet. Click "Edit Profile" to add information.
                  </p>
                )}

                <div className="mt-4 pt-4 border-t border-secondary-200">
                  <div className="flex items-center justify-between text-xs text-secondary-500">
                    <span>Created: {selectedProfile.createdAt.toLocaleDateString()}</span>
                    <span>Updated: {selectedProfile.updatedAt.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="border border-cyan-200 rounded-lg p-3 bg-cyan-50">
                <p className="text-xs text-cyan-800">
                  💡 Tip: Profiles are saved locally in your browser and can be used to quickly fill forms and documents with your information.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-secondary-500">
              <p className="text-sm">Select a profile to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
