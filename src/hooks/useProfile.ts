import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useProfile(userId?: string) {
  const { user } = useAuth();
  const id = userId || user?.id;

  return useQuery({
    queryKey: ['profile', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: { display_name?: string; bio?: string; website?: string; avatar_url?: string; username?: string; is_private?: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });
}

export function useProfileStats(userId?: string) {
  const { user } = useAuth();
  const id = userId || user?.id;

  return useQuery({
    queryKey: ['profile-stats', id],
    queryFn: async () => {
      if (!id) return { posts: 0, followers: 0, following: 0 };
      
      const [postsRes, followersRes, followingRes] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', id),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', id).eq('status', 'accepted'),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', id).eq('status', 'accepted'),
      ]);

      return {
        posts: postsRes.count || 0,
        followers: followersRes.count || 0,
        following: followingRes.count || 0,
      };
    },
    enabled: !!id,
  });
}
