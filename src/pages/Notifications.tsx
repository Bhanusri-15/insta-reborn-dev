import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, UserPlus } from 'lucide-react';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('notifications')
      .select('*, actor:actor_id(username, avatar_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => setNotifications(data || []));

    // Mark as read
    supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false).then(() => {});

    // Realtime
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => setNotifications(prev => [payload.new as any, ...prev])
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const icon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="h-4 w-4 text-red-500" />;
      case 'comment': return <MessageCircle className="h-4 w-4 text-sky-500" />;
      case 'follow': case 'follow_request': return <UserPlus className="h-4 w-4 text-green-500" />;
      default: return null;
    }
  };

  const text = (type: string) => {
    switch (type) {
      case 'like': return 'liked your post';
      case 'comment': return 'commented on your post';
      case 'follow': return 'started following you';
      case 'follow_request': return 'requested to follow you';
      case 'message': return 'sent you a message';
      default: return '';
    }
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto">
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-semibold text-foreground">Notifications</h1>
        </div>
        {notifications.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">No notifications yet</div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map(n => (
              <div key={n.id} className={`flex items-center gap-3 p-3 ${!n.is_read ? 'bg-muted/30' : ''}`}>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={n.actor?.avatar_url || ''} />
                  <AvatarFallback>{n.actor?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{n.actor?.username}</span>{' '}
                    {text(n.type)}
                  </p>
                </div>
                {icon(n.type)}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Notifications;
