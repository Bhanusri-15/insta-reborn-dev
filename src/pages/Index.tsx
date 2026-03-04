import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Bookmark, Send, MoreHorizontal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchFeed();
      fetchStories();
    }
  }, [user]);

  const fetchFeed = async () => {
    if (!user) return;
    setLoading(true);
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)
      .eq('status', 'accepted');

    const followedIds = follows?.map(f => f.following_id) || [];
    followedIds.push(user.id);

    const { data: postsData } = await supabase
      .from('posts')
      .select('*, profiles!posts_user_id_fkey(username, avatar_url, display_name)')
      .in('user_id', followedIds)
      .order('created_at', { ascending: false })
      .limit(20);

    if (postsData) {
      const enriched = await Promise.all(postsData.map(async (post: any) => {
        const [likesRes, commentsRes, likedRes, savedRes] = await Promise.all([
          supabase.from('likes').select('id', { count: 'exact', head: true }).eq('post_id', post.id),
          supabase.from('comments').select('id', { count: 'exact', head: true }).eq('post_id', post.id),
          supabase.from('likes').select('id').eq('post_id', post.id).eq('user_id', user.id).maybeSingle(),
          supabase.from('saves').select('id').eq('post_id', post.id).eq('user_id', user.id).maybeSingle(),
        ]);
        return {
          ...post,
          likes_count: likesRes.count || 0,
          comments_count: commentsRes.count || 0,
          is_liked: !!likedRes.data,
          is_saved: !!savedRes.data,
        };
      }));
      setPosts(enriched);
    }
    setLoading(false);
  };

  const fetchStories = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('stories')
      .select('*, profiles!stories_user_id_fkey(username, avatar_url)')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    setStories(data || []);
  };

  const toggleLike = async (postId: string, isLiked: boolean) => {
    if (!user) return;
    if (isLiked) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
    } else {
      await supabase.from('likes').insert({ user_id: user.id, post_id: postId });
    }
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, is_liked: !isLiked, likes_count: p.likes_count + (isLiked ? -1 : 1) } : p
    ));
  };

  const toggleSave = async (postId: string, isSaved: boolean) => {
    if (!user) return;
    if (isSaved) {
      await supabase.from('saves').delete().eq('post_id', postId).eq('user_id', user.id);
    } else {
      await supabase.from('saves').insert({ user_id: user.id, post_id: postId });
    }
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, is_saved: !isSaved } : p
    ));
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  const storyUsers = stories.reduce((acc: any[], story: any) => {
    if (!acc.find((s: any) => s.user_id === story.user_id)) acc.push(story);
    return acc;
  }, []);

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto">
        {storyUsers.length > 0 && (
          <div className="flex gap-4 p-4 overflow-x-auto border-b border-border">
            {storyUsers.map((story: any) => (
              <div key={story.user_id} className="flex flex-col items-center gap-1 min-w-[66px]">
                <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600">
                  <Avatar className="w-full h-full border-2 border-background">
                    <AvatarImage src={story.profiles?.avatar_url || ''} />
                    <AvatarFallback>{story.profiles?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                  </Avatar>
                </div>
                <span className="text-xs text-foreground truncate w-16 text-center">{story.profiles?.username}</span>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="space-y-6 p-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-80 w-full rounded" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg font-semibold text-foreground">Welcome to Network</p>
            <p className="text-sm text-muted-foreground mt-1">Follow people or create a post to see your feed.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {posts.map(post => (
              <article key={post.id} className="pb-4">
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={post.profiles?.avatar_url || ''} />
                      <AvatarFallback>{post.profiles?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-semibold text-foreground">{post.profiles?.username}</span>
                    <span className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
                  </div>
                  <MoreHorizontal className="h-5 w-5 text-muted-foreground cursor-pointer" />
                </div>
                {post.media_type === 'video' ? (
                  <video src={post.media_url} className="w-full aspect-square object-cover bg-muted" controls />
                ) : (
                  <img src={post.media_url} alt="" className="w-full aspect-square object-cover bg-muted" />
                )}
                <div className="flex items-center justify-between px-3 pt-3">
                  <div className="flex items-center gap-4">
                    <button onClick={() => toggleLike(post.id, post.is_liked)}>
                      <Heart className={`h-6 w-6 ${post.is_liked ? 'fill-destructive text-destructive' : 'text-foreground'}`} />
                    </button>
                    <MessageCircle className="h-6 w-6 text-foreground cursor-pointer" />
                    <Send className="h-6 w-6 text-foreground cursor-pointer" />
                  </div>
                  <button onClick={() => toggleSave(post.id, post.is_saved)}>
                    <Bookmark className={`h-6 w-6 ${post.is_saved ? 'fill-foreground text-foreground' : 'text-foreground'}`} />
                  </button>
                </div>
                <div className="px-3 pt-1 space-y-1">
                  <p className="text-sm font-semibold text-foreground">{post.likes_count} likes</p>
                  {post.caption && (
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">{post.profiles?.username}</span>{' '}
                      {post.caption}
                    </p>
                  )}
                  {post.comments_count > 0 && (
                    <p className="text-sm text-muted-foreground cursor-pointer">
                      View all {post.comments_count} comments
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Index;
