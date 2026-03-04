import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Shield, Smartphone, Lock, Trash2, Moon, Sun, Globe, LogOut } from 'lucide-react';

type SettingsSection = 'edit-profile' | 'notifications' | 'privacy' | 'login-activity' | 'apps' | 'password' | 'delete';

const Settings = () => {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [section, setSection] = useState<SettingsSection>('edit-profile');

  // Edit Profile state
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [website, setWebsite] = useState(profile?.website || '');

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Privacy state
  const [isPrivate, setIsPrivate] = useState(profile?.is_private || false);

  // Notification preferences (local)
  const [likesNotif, setLikesNotif] = useState(true);
  const [commentsNotif, setCommentsNotif] = useState(true);
  const [followsNotif, setFollowsNotif] = useState(true);
  const [messagesNotif, setMessagesNotif] = useState(true);

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({ display_name: displayName, username, bio, website });
      toast.success('Profile updated!');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else {
      toast.success('Password updated!');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Are you sure you want to delete your account? This cannot be undone.');
    if (!confirmed) return;
    toast.info('Account deletion requested. Please contact support.');
  };

  const handlePrivacyToggle = async (value: boolean) => {
    setIsPrivate(value);
    try {
      await updateProfile.mutateAsync({ is_private: value });
      toast.success(value ? 'Account set to private' : 'Account set to public');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const menuItems = [
    { key: 'edit-profile' as const, label: 'Edit Profile', icon: User },
    { key: 'apps' as const, label: 'Apps and Websites', icon: Globe },
    { key: 'notifications' as const, label: 'Notifications', icon: Bell },
    { key: 'privacy' as const, label: 'Privacy and Security', icon: Shield },
    { key: 'login-activity' as const, label: 'Login Activity', icon: Smartphone },
    { key: 'password' as const, label: 'Change Password', icon: Lock },
    { key: 'delete' as const, label: 'Delete Account', icon: Trash2 },
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto flex min-h-screen">
        {/* Sidebar */}
        <div className="hidden md:block w-64 border-r border-border">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">Settings</h2>
            <nav className="space-y-1">
              {menuItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => setSection(item.key)}
                  className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                    section === item.key ? 'bg-muted font-semibold text-foreground' : 'text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
              <Separator className="my-2" />
              <button onClick={toggleTheme} className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted/50">
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
              <button onClick={signOut} className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-destructive hover:bg-muted/50">
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </nav>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden w-full">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Settings</h2>
          </div>
          <div className="flex overflow-x-auto border-b border-border px-2">
            {menuItems.map(item => (
              <button
                key={item.key}
                onClick={() => setSection(item.key)}
                className={`px-3 py-2 text-xs whitespace-nowrap ${section === item.key ? 'border-b-2 border-foreground font-semibold text-foreground' : 'text-muted-foreground'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="p-4">{renderContent()}</div>
        </div>

        {/* Desktop content */}
        <div className="hidden md:block flex-1 p-6">
          {renderContent()}
        </div>
      </div>
    </AppLayout>
  );

  function renderContent() {
    switch (section) {
      case 'edit-profile':
        return (
          <div className="max-w-md space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Edit Profile</h3>
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={displayName} onChange={e => setDisplayName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={username} onChange={e => setUsername(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Input value={bio} onChange={e => setBio(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={website} onChange={e => setWebsite(e.target.value)} />
            </div>
            <Button onClick={handleSaveProfile} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        );
      case 'notifications':
        return (
          <div className="max-w-md space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Notification Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-foreground">Likes</p><p className="text-xs text-muted-foreground">Get notified when someone likes your post</p></div>
                <Switch checked={likesNotif} onCheckedChange={setLikesNotif} />
              </div>
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-foreground">Comments</p><p className="text-xs text-muted-foreground">Get notified when someone comments on your post</p></div>
                <Switch checked={commentsNotif} onCheckedChange={setCommentsNotif} />
              </div>
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-foreground">New Followers</p><p className="text-xs text-muted-foreground">Get notified when someone follows you</p></div>
                <Switch checked={followsNotif} onCheckedChange={setFollowsNotif} />
              </div>
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-foreground">Messages</p><p className="text-xs text-muted-foreground">Get notified when you receive a message</p></div>
                <Switch checked={messagesNotif} onCheckedChange={setMessagesNotif} />
              </div>
            </div>
          </div>
        );
      case 'privacy':
        return (
          <div className="max-w-md space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Privacy and Security</h3>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-foreground">Private Account</p><p className="text-xs text-muted-foreground">Only approved followers can see your photos and videos</p></div>
              <Switch checked={isPrivate} onCheckedChange={handlePrivacyToggle} />
            </div>
            <Separator />
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Blocked Accounts</h4>
              <p className="text-xs text-muted-foreground">No blocked accounts</p>
            </div>
            <Separator />
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Two-Factor Authentication</h4>
              <p className="text-xs text-muted-foreground">Add extra security to your account. Coming soon.</p>
            </div>
          </div>
        );
      case 'login-activity':
        return (
          <div className="max-w-md space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Login Activity</h3>
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Smartphone className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Current Session</p>
                  <p className="text-xs text-muted-foreground">
                    {navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'} • {new Date().toLocaleDateString()}
                  </p>
                  <p className="text-xs text-green-500">Active now</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'apps':
        return (
          <div className="max-w-md space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Apps and Websites</h3>
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-foreground mb-1">Active</h4>
                <p className="text-xs text-muted-foreground">No active apps or websites connected</p>
              </div>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-foreground mb-1">Expired</h4>
                <p className="text-xs text-muted-foreground">No expired connections</p>
              </div>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-foreground mb-1">Removed</h4>
                <p className="text-xs text-muted-foreground">No removed connections</p>
              </div>
            </div>
          </div>
        );
      case 'password':
        return (
          <div className="max-w-md space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Change Password</h3>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
            <Button onClick={handleChangePassword}>Change Password</Button>
          </div>
        );
      case 'delete':
        return (
          <div className="max-w-md space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Delete Account</h3>
            <p className="text-sm text-muted-foreground">
              Deleting your account is permanent. All your data, posts, and followers will be lost.
            </p>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              Delete My Account
            </Button>
          </div>
        );
    }
  }
};

export default Settings;
