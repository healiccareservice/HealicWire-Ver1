import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { UserCircle, Save, Loader2, Image as ImageIcon, ArrowLeft } from "lucide-react";
import { authFetch } from "../lib/api";
import ImageSelectorModal from "./ImageSelectorModal";

interface UserProfileEditorProps {
  session: any;
  targetProfileId?: string;
  onBack?: () => void;
}

export default function UserProfileEditor({ session, targetProfileId, onBack }: UserProfileEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: "success" | "error" } | null>(null);
  const [showImageSelector, setShowImageSelector] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    degree: "",
    role: "",
    work_place: "",
    bio: "",
    avatar_url: "",
    email: ""
  });

  useEffect(() => {
    if (session?.user?.id) {
      loadProfile();
    }
  }, [session]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const fetchUrl = targetProfileId ? `/api/admin/profiles/${targetProfileId}` : "/api/admin/profile";
      const res = await authFetch(fetchUrl);
      if (!res.ok) throw new Error("Failed to load profile");
      const { profile: data } = await res.json();
      
      if (targetProfileId) {
        setProfile({
          name: data?.name || "",
          degree: data?.degree || "",
          role: data?.role || "",
          work_place: data?.work_place || "",
          bio: data?.bio || "",
          avatar_url: data?.avatar_url || "",
          email: data?.email || ""
        });
      } else {
        setProfile({
          name: data?.name || session.user.user_metadata?.name || "",
          degree: data?.degree || session.user.user_metadata?.degree || "",
          role: data?.role || session.user.user_metadata?.role || "",
          work_place: data?.work_place || session.user.user_metadata?.work_place || "",
          bio: data?.bio || session.user.user_metadata?.bio || "",
          avatar_url: data?.avatar_url || session.user.user_metadata?.avatar_url || "",
          email: data?.email || session.user.email || ""
        });
      }
      
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const fetchUrl = targetProfileId ? `/api/admin/profiles/${targetProfileId}` : "/api/admin/profile";
      const response = await authFetch(fetchUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: profile.name,
          degree: profile.degree,
          role: profile.role,
          work_place: profile.work_place,
          bio: profile.bio,
          avatar_url: profile.avatar_url
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update profile via API");
      }
      
      // Update session metadata only if editing own profile
      if (!targetProfileId) {
        await supabase.auth.updateUser({
          data: {
            name: profile.name,
            degree: profile.degree,
            role: profile.role,
            work_place: profile.work_place
          }
        });
      }

      setMessage({ text: "Profile successfully updated!", type: "success" });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setMessage({ text: error.message || "Failed to update profile.", type: "error" });
    } finally {
      setSaving(false);
      // Auto dismiss message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    }
  };



  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin mb-4" />
        <p className="text-zinc-500 font-mono text-sm">Loading profile data...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto bg-white dark:bg-zinc-950 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              {onBack && (
                <button 
                  type="button"
                  onClick={onBack}
                  className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
                  title="Go back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h2 className="text-2xl font-bold font-mono uppercase tracking-tighter text-zinc-900 dark:text-white">
                Profile <span className="text-teal-600">Settings</span>
              </h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-450 font-sans pl-1">
              Manage your personal information, credentials, and how you appear in article bylines.
            </p>
          </div>
          <UserCircle className="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
        </div>

        {message && (
          <div className={`p-4 rounded-xl border font-mono text-xs font-bold ${
            message.type === 'success' 
              ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-6">
            
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
              <div className="relative group shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shrink-0">
                  {profile.avatar_url ? (
                    <img onError={(e) => { e.currentTarget.style.display = 'none'; }} src={profile.avatar_url} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400">
                      <UserCircle className="w-12 h-12" />
                    </div>
                  )}
                </div>
                <button 
                  type="button"
                  onClick={() => setShowImageSelector(true)}
                  className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
                >
                  <ImageIcon className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-bold">Upload</span>
                </button>
              </div>
              <div className="flex-1 w-full space-y-2 text-center sm:text-left">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Profile Photo</h3>
                <p className="text-xs text-zinc-500">Upload a professional headshot for your article bylines.</p>
                <div className="flex flex-col space-y-1 mt-2">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Or Paste Image URL</label>
                  <div className="flex space-x-2">
                    <input 
                      type="url"
                      value={profile.avatar_url}
                      onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-teal-500/20"
                      placeholder="https://example.com/avatar.jpg"
                    />
                    <button
                      type="button"
                      onClick={() => setShowImageSelector(true)}
                      className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center space-x-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shrink-0 cursor-pointer"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>Select Image</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold font-mono uppercase text-zinc-500 dark:text-zinc-400">
                  Email Address
                </label>
                <input
                  disabled
                  type="text"
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 text-sm text-zinc-500 cursor-not-allowed"
                  value={profile.email || ""}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold font-mono uppercase text-zinc-500 dark:text-zinc-400">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  className="w-full p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="e.g. Dr. K. Narayana K"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold font-mono uppercase text-zinc-500 dark:text-zinc-400">
                  Degrees / Credentials
                </label>
                <input
                  type="text"
                  className="w-full p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  value={profile.degree}
                  onChange={(e) => setProfile({ ...profile, degree: e.target.value })}
                  placeholder="e.g. MBBS, MD, DipIBLM, FHPE"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold font-mono uppercase text-zinc-500 dark:text-zinc-400">
                  Professional Role
                </label>
                <input
                  type="text"
                  className="w-full p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  value={profile.role}
                  onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                  placeholder="e.g. Editor-in-Chief & Lead Strategist"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold font-mono uppercase text-zinc-500 dark:text-zinc-400">
                  Work Place
                </label>
                <input
                  type="text"
                  className="w-full p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  value={profile.work_place}
                  onChange={(e) => setProfile({ ...profile, work_place: e.target.value })}
                  placeholder="e.g. AIIMS Delhi, Apollo Hospitals"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold font-mono uppercase text-zinc-500 dark:text-zinc-400">
                  Short Bio
                </label>
                <textarea
                  rows={3}
                  className="w-full p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none resize-none"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Brief description of your expertise and background..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-mono text-sm font-bold uppercase rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>

      {showImageSelector && (
        <ImageSelectorModal
          onClose={() => setShowImageSelector(false)}
          onSelect={(url) => {
            setProfile(prev => ({ ...prev, avatar_url: url }));
            setShowImageSelector(false);
          }}
        />
      )}
    </div>
  );
}
