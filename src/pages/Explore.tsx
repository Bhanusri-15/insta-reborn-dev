import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search as SearchIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const navigate = useNavigate();

  // Real-time explore grid
  useEffect(() => {
    const postsQuery = query(
      collection(db, 'posts'),
      orderBy('created_at', 'desc'),
      limit(30)
    );

    const unsubscribe = onSnapshot(postsQuery, async (snapshot) => {
      console.log('[Explore] Posts snapshot:', snapshot.size);
      const postsData = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const post = { id: docSnap.id, ...docSnap.data() };
          const authorSnap = await getDoc(doc(db, 'users', (post as any).user_id));
          return { ...post, profiles: authorSnap.exists() ? authorSnap.data() : null };
        })
      );
      setPosts(postsData);
    });

    return () => unsubscribe();
  }, []);

  // Search users
  useEffect(() => {
    if (!searchQuery.trim()) { setUsers([]); return; }
    const timer = setTimeout(async () => {
      try {
        // Firestore doesn't support ilike, so we do a prefix search
        const q = searchQuery.trim().toLowerCase();
        const usersSnap = await getDocs(collection(db, 'users'));
        const matched = usersSnap.docs
          .map(d => ({ uid: d.id, ...d.data() }))
          .filter((u: any) =>
            u.username?.toLowerCase().includes(q) ||
            u.display_name?.toLowerCase().includes(q)
          )
          .slice(0, 10);
        setUsers(matched);
      } catch (err) {
        console.error('[Explore] Search error:', err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50"
          />
        </div>

        {/* Search Results */}
        {searchQuery.trim() && users.length > 0 && (
          <div className="border border-border rounded-lg bg-card divide-y divide-border">
            {users.map(u => (
              <button
                key={u.uid}
                onClick={() => navigate(`/user/${u.uid}`)}
                className="flex items-center gap-3 p-3 w-full hover:bg-muted/50 text-left"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={u.avatar_url || ''} />
                  <AvatarFallback>{u.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">{u.username}</p>
                  <p className="text-xs text-muted-foreground">{u.display_name}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Explore Grid */}
        {!searchQuery.trim() && (
          <div className="grid grid-cols-3 gap-1">
            {posts.map(post => (
              <div key={post.id} className="aspect-square cursor-pointer">
                {post.media_type === 'video' ? (
                  <video src={post.media_url} className="w-full h-full object-cover" />
                ) : (
                  <img src={post.media_url} alt="" className="w-full h-full object-cover" />
                )}
              </div>
            ))}
            {posts.length === 0 && (
              <div className="col-span-3 text-center py-16 text-muted-foreground">
                <p>No posts to explore yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Explore;
