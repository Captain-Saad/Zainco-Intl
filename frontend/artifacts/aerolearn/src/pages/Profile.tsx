import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { Badge } from "@/components/shared/Badge";
import { User, Shield, Bell, LogOut } from "lucide-react";

export default function Profile() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState(user?.name?.split(' ')[0] || "");
  const [lastName, setLastName] = useState(user?.name?.split(' ')[1] || "");
  const [phone, setPhone] = useState(user?.phone || "+92-321-4567890");
  const [license, setLicense] = useState(user?.license || "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => customFetch("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" }
    }),
    onSuccess: () => {
      alert("Profile updated successfully!");
      // This will force useAuth to refetch if it shares the query client or we can just trigger a general invalidation
      queryClient.invalidateQueries({ queryKey: ['auth-user'] });
    },
    onError: () => {
      alert("Failed to update profile.");
    }
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (data: any) => customFetch("/api/auth/password", {
      method: "PUT",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" }
    }),
    onSuccess: () => {
      alert("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: () => {
      alert("Failed to update password. Please check your current password.");
    }
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      name: `${firstName} ${lastName}`.trim(),
      phone,
      license
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match!");
      return;
    }
    updatePasswordMutation.mutate({
      current_password: currentPassword,
      new_password: newPassword
    });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 px-4 pt-16 pb-8 md:p-10 max-w-4xl w-full">
        <header className="mb-8 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">PILOT PROFILE</h1>
        </header>

        {/* Profile Header */}
        <div className="glass-card p-5 md:p-8 rounded-2xl flex flex-col sm:flex-row items-center sm:items-center gap-5 md:gap-8 mb-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-primary p-1 shrink-0 bg-card flex items-center justify-center">
            <span className="text-2xl md:text-3xl font-display font-bold text-primary">
              {user?.name?.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">{user?.name}</h2>
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 md:gap-4 text-xs md:text-sm font-mono text-muted-foreground">
              <span className="break-all">{user?.email}</span>
              <span className="text-primary hidden sm:inline">•</span>
              <span>License: <span className="text-foreground">{user?.license}</span></span>
              <Badge variant={user?.role === 'admin' ? 'red' : 'gold'}>{user?.role?.toUpperCase()}</Badge>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          <div className="md:col-span-2 space-y-6 md:space-y-8">
            {/* Edit Form */}
            <div className="glass-card rounded-2xl border border-border p-5 md:p-6">
              <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
                <User size={20} className="text-primary" />
                <h3 className="font-display font-semibold text-lg">Personal Information</h3>
              </div>
              <form className="space-y-5 md:space-y-6" onSubmit={handleProfileSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <Input label="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} />
                  <Input label="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} />
                </div>
                <Input label="Email Address" type="email" defaultValue={user?.email} disabled className="opacity-50 cursor-not-allowed" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <Input label="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} />
                  <Input label="CPL License Number" value={license} onChange={e => setLicense(e.target.value)} />
                </div>
                <div className="pt-4">
                  <Button type="submit" disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </div>

            {/* Security */}
            <div className="glass-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
                <Shield size={20} className="text-accent" />
                <h3 className="font-display font-semibold text-lg">Security Settings</h3>
              </div>
              <form className="space-y-6" onSubmit={handlePasswordSubmit}>
                <Input label="Current Password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <Input label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} />
                  <Input label="Confirm Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8} />
                </div>
                <div className="pt-4">
                  <Button variant="secondary" type="submit" disabled={updatePasswordMutation.isPending}>
                     {updatePasswordMutation.isPending ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          <div className="space-y-8">
            {/* Preferences */}
            <div className="glass-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
                <Bell size={20} className="text-emerald-400" />
                <h3 className="font-display font-semibold text-lg">Notifications</h3>
              </div>
              <div className="space-y-6">
                {[
                  { title: "Course Updates", desc: "New lessons or materials added" },
                  { title: "Instructor Messages", desc: "Direct feedback on assignments" },
                  { title: "Achievement Alerts", desc: "When you unlock a new badge" }
                ].map((pref, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-foreground">{pref.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{pref.desc}</p>
                    </div>
                    {/* Custom Toggle Switch */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-destructive/5 rounded-2xl border border-destructive/20 p-6">
              <h3 className="font-display font-semibold text-lg text-destructive mb-2">Danger Zone</h3>
              <p className="text-sm text-muted-foreground mb-6">Terminate your current session securely.</p>
              <Button variant="danger" className="w-full gap-2" onClick={logout}>
                <LogOut size={16} /> Sign Out Completely
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
