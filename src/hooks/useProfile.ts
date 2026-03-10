import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  website: string;
  is_private: boolean;
  created_at: any;
}

export function useProfile(userId?: string) {
  const { user } = useAuth();
  const id = userId || user?.uid;

  return useQuery({
    queryKey: ['profile', id],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!id) return null;
      const snap = await getDoc(doc(db, 'users', id));
      if (!snap.exists()) return null;
      return { uid: snap.id, ...snap.data() } as UserProfile;
    },
    enabled: !!id,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<Pick<UserProfile, 'display_name' | 'bio' | 'website' | 'avatar_url' | 'username' | 'is_private'>>) => {
      if (!user) throw new Error('Not authenticated');
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, updates);
      const snap = await getDoc(userRef);
      return { uid: snap.id, ...snap.data() } as UserProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.uid] });
    },
  });
}

export function useProfileStats(userId?: string) {
  const { user } = useAuth();
  const id = userId || user?.uid;

  return useQuery({
    queryKey: ['profile-stats', id],
    queryFn: async () => {
      if (!id) return { posts: 0, followers: 0, following: 0 };
      const { getDocs, collection, query, where } = await import('firebase/firestore');

      const [postsSnap, followersSnap, followingSnap] = await Promise.all([
        getDocs(query(collection(db, 'posts'), where('user_id', '==', id))),
        getDocs(query(collection(db, 'follows'), where('following_id', '==', id), where('status', '==', 'accepted'))),
        getDocs(query(collection(db, 'follows'), where('follower_id', '==', id), where('status', '==', 'accepted'))),
      ]);

      return {
        posts: postsSnap.size,
        followers: followersSnap.size,
        following: followingSnap.size,
      };
    },
    enabled: !!id,
  });
}
