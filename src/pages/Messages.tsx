import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (!activeConvo) return;
    fetchMessages(activeConvo);

    const channel = supabase
      .channel(`messages-${activeConvo}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConvo}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeConvo]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    if (!user) return;
    const { data: parts } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (!parts?.length) return;
    const convoIds = parts.map(p => p.conversation_id);

    const { data: convos } = await supabase
      .from('conversations')
      .select('*')
      .in('id', convoIds)
      .order('updated_at', { ascending: false });

    if (!convos) return;

    // Get other participants
    const enriched = await Promise.all(convos.map(async (c) => {
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('user_id, profiles:user_id(username, avatar_url, display_name)')
        .eq('conversation_id', c.id)
        .neq('user_id', user.id);

      const { data: lastMsg } = await supabase
        .from('messages')
        .select('content, created_at')
        .eq('conversation_id', c.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return { ...c, other: participants?.[0]?.profiles, lastMessage: lastMsg };
    }));

    setConversations(enriched);
  };

  const fetchMessages = async (convoId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*, profiles:sender_id(username, avatar_url)')
      .eq('conversation_id', convoId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !activeConvo || !user) return;
    await supabase.from('messages').insert({
      conversation_id: activeConvo,
      sender_id: user.id,
      content: newMsg,
    });
    setNewMsg('');
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-60px)] md:h-screen">
        {/* Conversation List */}
        <div className={`w-full md:w-80 border-r border-border flex flex-col ${activeConvo ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">No conversations yet</div>
            ) : (
              conversations.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveConvo(c.id)}
                  className={`flex items-center gap-3 p-3 w-full hover:bg-muted/50 ${activeConvo === c.id ? 'bg-muted' : ''}`}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={c.other?.avatar_url || ''} />
                    <AvatarFallback>{c.other?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold text-foreground truncate">{c.other?.username || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.lastMessage?.content || 'No messages'}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${!activeConvo ? 'hidden md:flex' : 'flex'}`}>
          {!activeConvo ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Select a conversation to start messaging</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 border-b border-border md:hidden">
                <Button variant="ghost" size="sm" onClick={() => setActiveConvo(null)}>← Back</Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${
                      msg.sender_id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEnd} />
              </div>
              <div className="p-3 border-t border-border flex gap-2">
                <Input
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  placeholder="Message..."
                  className="flex-1"
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                />
                <Button size="icon" onClick={sendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Messages;
