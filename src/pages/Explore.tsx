import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search as SearchIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Explore = () => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Load explore grid
    supabase.from('posts')
      .select('*, profiles!posts_user_id_fkey(username, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => setPosts(data || []));
  }, []);

  useEffect(() => {
    if (!query.trim()) { setUsers([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(10);
      setUsers(data || []);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-10 bg-muted/50"
          />
        </div>

        {/* Search Results */}
        {query.trim() && users.length > 0 && (
          <div className="border border-border rounded-lg bg-card divide-y divide-border">
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => navigate(`/user/${u.id}`)}
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
        {!query.trim() && (
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
