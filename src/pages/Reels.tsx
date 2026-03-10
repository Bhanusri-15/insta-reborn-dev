import { useState, useEffect, useRef, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, getDoc, getDocs, where, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Volume2, VolumeX } from 'lucide-react';

const ReelItem = ({ reel, isActive, globalMuted, onToggleMute }: { reel: any; isActive: boolean; globalMuted: boolean; onToggleMute: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isActive]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = globalMuted;
    }
  }, [globalMuted]);

  // Fetch like status
  useEffect(() => {
    if (!user || !reel.id) return;
    getDocs(query(collection(db, 'likes'), where('post_id', '==', reel.id), where('user_id', '==', user.uid)))
      .then(snap => setLiked(!snap.empty));
    getDocs(query(collection(db, 'likes'), where('post_id', '==', reel.id)))
      .then(snap => setLikesCount(snap.size));
  }, [user, reel.id]);

  const toggleLike = async () => {
    if (!user) return;
    const likeId = `${user.uid}_${reel.id}`;
    const likeRef = doc(db, 'likes', likeId);
    if (liked) {
      await deleteDoc(likeRef);
      setLiked(false);
      setLikesCount(c => c - 1);
    } else {
      await setDoc(likeRef, { user_id: user.uid, post_id: reel.id, created_at: Timestamp.now() });
      setLiked(true);
      setLikesCount(c => c + 1);
    }
  };

  return (
    <div className="snap-start h-[calc(100vh-120px)] relative bg-black">
      <video
        ref={videoRef}
        src={reel.video_url}
        className="w-full h-full object-contain"
        loop
        playsInline
        muted={globalMuted}
        onClick={onToggleMute}
      />
      {/* Sound toggle */}
      <button
        onClick={onToggleMute}
        className="absolute top-4 right-4 bg-black/50 rounded-full p-2 z-10"
      >
        {globalMuted ? <VolumeX className="h-5 w-5 text-white" /> : <Volume2 className="h-5 w-5 text-white" />}
      </button>
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
        <button className="flex flex-col items-center" onClick={toggleLike}>
          <Heart className={`h-7 w-7 ${liked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          <span className="text-white text-xs mt-1">{likesCount}</span>
        </button>
        <button className="flex flex-col items-center">
          <MessageCircle className="h-7 w-7 text-white" />
        </button>
      </div>
    </div>
  );
};

const Reels = () => {
  const [reels, setReels] = useState<any[]>([]);
  const [muted, setMuted] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reelsQuery = query(
      collection(db, 'reels'),
      orderBy('created_at', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(reelsQuery, async (snapshot) => {
      console.log('[Reels] Snapshot:', snapshot.size, 'reels');
      const reelsData = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const reel = { id: docSnap.id, ...docSnap.data() };
          const authorSnap = await getDoc(doc(db, 'users', (reel as any).user_id));
          return { ...reel, profiles: authorSnap.exists() ? authorSnap.data() : null };
        })
      );
      setReels(reelsData);
    }, (error) => {
      console.error('[Reels] Listener error:', error);
    });

    return () => unsubscribe();
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const scrollTop = scrollRef.current.scrollTop;
    const itemHeight = scrollRef.current.clientHeight;
    const idx = Math.round(scrollTop / itemHeight);
    setActiveIndex(idx);
  }, []);

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto">
        {reels.length === 0 ? (
          <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
            <p>No reels yet. Be the first to share one!</p>
          </div>
        ) : (
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="snap-y snap-mandatory h-[calc(100vh-120px)] overflow-y-scroll"
          >
            {reels.map((reel, index) => (
              <ReelItem
                key={reel.id}
                reel={reel}
                isActive={index === activeIndex}
                globalMuted={muted}
                onToggleMute={() => setMuted(m => !m)}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Reels;
