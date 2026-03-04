import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useProfileStats } from '@/hooks/useProfile';
import { AppLayout } from '@/components/layout/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Settings, Grid3X3, Film, Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Profile = () => {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { data: stats } = useProfileStats();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [reels, setReels] = useState<any[]>([]);
  const [saved, setSaved] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      supabase.from('posts').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        .then(({ data }) => setPosts(data || []));
      supabase.from('reels').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        .then(({ data }) => setReels(data || []));
      supabase.from('saves').select('*, posts(*)').eq('user_id', user.id).order('created_at', { ascending: false })
        .then(({ data }) => setSaved(data || []));
    }
  }, [user]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto p-4 space-y-6">
          <div className="flex items-center gap-8">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4">
        {/* Profile Header */}
        <div className="flex items-start gap-8 mb-6">
          <Avatar className="h-20 w-20 md:h-36 md:w-36">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="text-2xl">{profile?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="text-xl font-normal text-foreground">{profile?.username}</h1>
              <Button variant="secondary" size="sm" onClick={() => navigate('/settings/edit-profile')}>
                Edit profile
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                <Settings className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex gap-8">
              <span className="text-sm text-foreground"><strong>{stats?.posts ?? 0}</strong> posts</span>
              <span className="text-sm text-foreground"><strong>{stats?.followers ?? 0}</strong> followers</span>
              <span className="text-sm text-foreground"><strong>{stats?.following ?? 0}</strong> following</span>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground">{profile?.display_name}</p>
              {profile?.bio && <p className="text-sm text-foreground">{profile.bio}</p>}
              {profile?.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-sky-500 font-semibold">
                  {profile.website}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full justify-center border-t border-border rounded-none bg-transparent">
            <TabsTrigger value="posts" className="gap-1 data-[state=active]:border-t-2 data-[state=active]:border-foreground rounded-none">
              <Grid3X3 className="h-3 w-3" /> POSTS
            </TabsTrigger>
            <TabsTrigger value="reels" className="gap-1 data-[state=active]:border-t-2 data-[state=active]:border-foreground rounded-none">
              <Film className="h-3 w-3" /> REELS
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-1 data-[state=active]:border-t-2 data-[state=active]:border-foreground rounded-none">
              <Bookmark className="h-3 w-3" /> SAVED
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            {posts.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Grid3X3 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="font-semibold text-foreground">No Posts Yet</p>
                <p className="text-sm">Share photos and they'll appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 mt-1">
                {posts.map(post => (
                  <div key={post.id} className="aspect-square">
                    <img src={post.media_url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reels">
            {reels.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Film className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="font-semibold text-foreground">No Reels Yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 mt-1">
                {reels.map(reel => (
                  <div key={reel.id} className="aspect-[9/16] bg-muted rounded overflow-hidden">
                    <video src={reel.video_url} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved">
            {saved.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Bookmark className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="font-semibold text-foreground">No Saved Posts</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 mt-1">
                {saved.map((save: any) => (
                  <div key={save.id} className="aspect-square">
                    <img src={save.posts?.media_url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Profile;
