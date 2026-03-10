import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, getDoc, getDocs, where, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Bookmark, Send, MoreHorizontal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<any[]>([]);

  // Real-time posts listener
  useEffect(() => {
    if (!user) return;

    const postsQuery = query(
      collection(db, 'posts'),
      orderBy('created_at', 'desc'),
      limit(30)
    );

    const unsubscribe = onSnapshot(postsQuery, async (snapshot) => {
      console.log('[Home] Posts snapshot:', snapshot.size, 'docs');
      const postsData = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const post = { id: docSnap.id, ...docSnap.data() };
          // Fetch author profile
          const authorSnap = await getDoc(doc(db, 'users', (post as any).user_id));
          const author = authorSnap.exists() ? authorSnap.data() : null;

          // Fetch like/save/comment counts
          const likesSnap = await getDocs(query(collection(db, 'likes'), where('post_id', '==', docSnap.id)));
          const commentsSnap = await getDocs(query(collection(db, 'comments'), where('post_id', '==', docSnap.id)));
          const userLike = await getDocs(query(collection(db, 'likes'), where('post_id', '==', docSnap.id), where('user_id', '==', user.uid)));
          const userSave = await getDocs(query(collection(db, 'saves'), where('post_id', '==', docSnap.id), where('user_id', '==', user.uid)));

          return {
            ...post,
            profiles: author,
            likes_count: likesSnap.size,
            comments_count: commentsSnap.size,
            is_liked: !userLike.empty,
            is_saved: !userSave.empty,
          };
        })
      );
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error('[Home] Posts listener error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Real-time stories listener (only stories not expired)
  useEffect(() => {
    if (!user) return;

    const storiesQuery = query(
      collection(db, 'stories'),
      where('expires_at', '>', Timestamp.now()),
      orderBy('expires_at', 'desc'),
      limit(30)
    );

    const unsubscribe = onSnapshot(storiesQuery, async (snapshot) => {
      console.log('[Home] Stories snapshot:', snapshot.size, 'docs');
      const storiesData = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const story = { id: docSnap.id, ...docSnap.data() };
          const authorSnap = await getDoc(doc(db, 'users', (story as any).user_id));
          return { ...story, profiles: authorSnap.exists() ? authorSnap.data() : null };
        })
      );
      setStories(storiesData);
    }, (error) => {
      console.error('[Home] Stories listener error:', error);
    });

    return () => unsubscribe();
  }, [user]);

  const toggleLike = async (postId: string, isLiked: boolean) => {
    if (!user) return;
    const likeId = `${user.uid}_${postId}`;
    const likeRef = doc(db, 'likes', likeId);
    try {
      if (isLiked) {
        await deleteDoc(likeRef);
      } else {
        await setDoc(likeRef, { user_id: user.uid, post_id: postId, created_at: Timestamp.now() });
      }
      // Optimistic update
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, is_liked: !isLiked, likes_count: p.likes_count + (isLiked ? -1 : 1) } : p
      ));
    } catch (err) {
      console.error('[Home] Toggle like error:', err);
    }
  };

  const toggleSave = async (postId: string, isSaved: boolean) => {
    if (!user) return;
    const saveId = `${user.uid}_${postId}`;
    const saveRef = doc(db, 'saves', saveId);
    try {
      if (isSaved) {
        await deleteDoc(saveRef);
      } else {
        await setDoc(saveRef, { user_id: user.uid, post_id: postId, created_at: Timestamp.now() });
      }
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, is_saved: !isSaved } : p
      ));
    } catch (err) {
      console.error('[Home] Toggle save error:', err);
    }
  };

  const timeAgo = (date: any) => {
    const ts = date?.toDate ? date.toDate() : new Date(date);
    const seconds = Math.floor((Date.now() - ts.getTime()) / 1000);
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
