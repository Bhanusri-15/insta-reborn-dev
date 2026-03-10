import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, getDocs, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Grid3X3 } from 'lucide-react';
import { toast } from 'sonner';

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [followStatus, setFollowStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetchProfile();
    fetchStats();
    if (user) checkFollowing();
  }, [userId, user]);

  // Real-time posts
  useEffect(() => {
    if (!userId) return;
    const postsQuery = query(collection(db, 'posts'), where('user_id', '==', userId), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(postsQuery, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [userId]);

  const fetchProfile = async () => {
    const snap = await getDoc(doc(db, 'users', userId!));
    if (snap.exists()) setProfile({ uid: snap.id, ...snap.data() });
  };

  const fetchStats = async () => {
    const [postsSnap, followersSnap, followingSnap] = await Promise.all([
      getDocs(query(collection(db, 'posts'), where('user_id', '==', userId!))),
      getDocs(query(collection(db, 'follows'), where('following_id', '==', userId!), where('status', '==', 'accepted'))),
      getDocs(query(collection(db, 'follows'), where('follower_id', '==', userId!), where('status', '==', 'accepted'))),
    ]);
    setStats({ posts: postsSnap.size, followers: followersSnap.size, following: followingSnap.size });
  };

  const checkFollowing = async () => {
    if (!user || !userId) return;
    const followSnap = await getDocs(query(
      collection(db, 'follows'),
      where('follower_id', '==', user.uid),
      where('following_id', '==', userId)
    ));
    if (!followSnap.empty) {
      const data = followSnap.docs[0].data();
      setIsFollowing(true);
      setFollowStatus(data.status);
    }
  };

  const handleFollow = async () => {
    if (!user || !userId) return;
    const followId = `${user.uid}_${userId}`;
    const followRef = doc(db, 'follows', followId);
    try {
      if (isFollowing) {
        await deleteDoc(followRef);
        setIsFollowing(false);
        setFollowStatus(null);
        setStats(prev => ({ ...prev, followers: prev.followers - 1 }));
      } else {
        const status = profile?.is_private ? 'pending' : 'accepted';
        await setDoc(followRef, {
          follower_id: user.uid,
          following_id: userId,
          status,
          created_at: Timestamp.now(),
        });
        setIsFollowing(true);
        setFollowStatus(status);
        if (status === 'accepted') setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
        else toast.info('Follow request sent');
      }
    } catch (err) {
      console.error('[UserProfile] Follow error:', err);
    }
  };

  if (!profile) return <AppLayout><div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div></AppLayout>;

  const isOwnProfile = user?.uid === userId;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-start gap-8 mb-6">
          <Avatar className="h-20 w-20 md:h-36 md:w-36">
            <AvatarImage src={profile.avatar_url || ''} />
            <AvatarFallback className="text-2xl">{profile.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="text-xl font-normal text-foreground">{profile.username}</h1>
              {!isOwnProfile && (
                <Button
                  variant={isFollowing ? 'secondary' : 'default'}
                  size="sm"
                  onClick={handleFollow}
                >
                  {isFollowing ? (followStatus === 'pending' ? 'Requested' : 'Following') : 'Follow'}
                </Button>
              )}
            </div>

            <div className="flex gap-8">
              <span className="text-sm text-foreground"><strong>{stats.posts}</strong> posts</span>
              <span className="text-sm text-foreground"><strong>{stats.followers}</strong> followers</span>
              <span className="text-sm text-foreground"><strong>{stats.following}</strong> following</span>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground">{profile.display_name}</p>
              {profile.bio && <p className="text-sm text-foreground">{profile.bio}</p>}
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        <div className="border-t border-border pt-4">
          {posts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Grid3X3 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p>No Posts Yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {posts.map(post => (
                <div key={post.id} className="aspect-square">
                  <img src={post.media_url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default UserProfile;
