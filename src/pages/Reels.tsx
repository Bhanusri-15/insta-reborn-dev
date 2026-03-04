import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle } from 'lucide-react';

const Reels = () => {
  const { user } = useAuth();
  const [reels, setReels] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('reels')
      .select('*, profiles!reels_user_id_fkey(username, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setReels(data || []));
  }, []);

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto">
        {reels.length === 0 ? (
          <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
            <p>No reels yet. Be the first to share one!</p>
          </div>
        ) : (
          <div className="snap-y snap-mandatory h-[calc(100vh-120px)] overflow-y-scroll">
            {reels.map(reel => (
              <div key={reel.id} className="snap-start h-[calc(100vh-120px)] relative bg-black">
                <video
                  src={reel.video_url}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                  muted
                  loop
                />
                {/* Overlay info */}
                <div className="absolute bottom-16 left-4 right-16 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-8 w-8 border border-white">
                      <AvatarImage src={reel.profiles?.avatar_url || ''} />
                      <AvatarFallback>{reel.profiles?.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-sm">{reel.profiles?.username}</span>
                  </div>
                  {reel.caption && <p className="text-sm">{reel.caption}</p>}
                </div>
                {/* Side actions */}
                <div className="absolute right-3 bottom-24 flex flex-col gap-6 items-center">
                  <button className="flex flex-col items-center">
                    <Heart className="h-7 w-7 text-white" />
                  </button>
                  <button className="flex flex-col items-center">
                    <MessageCircle className="h-7 w-7 text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Reels;
