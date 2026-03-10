import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
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

  // Fetch conversations
  useEffect(() => {
    if (!user) return;

    const convoQuery = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid),
      orderBy('updated_at', 'desc')
    );

    const unsubscribe = onSnapshot(convoQuery, async (snapshot) => {
      console.log('[Messages] Conversations:', snapshot.size);
      const convos = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const convo = { id: docSnap.id, ...docSnap.data() };
          const otherUid = (convo as any).participants?.find((p: string) => p !== user.uid);
          let otherProfile = null;
          if (otherUid) {
            const profileSnap = await getDoc(doc(db, 'users', otherUid));
            if (profileSnap.exists()) otherProfile = profileSnap.data();
          }
          // Get last message
          const msgsSnap = await getDocs(query(
            collection(db, 'messages'),
            where('conversation_id', '==', docSnap.id),
            orderBy('created_at', 'desc')
          ));
          const lastMsg = msgsSnap.docs[0]?.data() || null;
          return { ...convo, other: otherProfile, lastMessage: lastMsg };
        })
      );
      setConversations(convos);
    });

    return () => unsubscribe();
  }, [user]);

  // Real-time messages for active conversation
  useEffect(() => {
    if (!activeConvo) return;

    const msgsQuery = query(
      collection(db, 'messages'),
      where('conversation_id', '==', activeConvo),
      orderBy('created_at', 'asc')
    );

    const unsubscribe = onSnapshot(msgsQuery, (snapshot) => {
      console.log('[Messages] Messages:', snapshot.size);
      setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsubscribe();
  }, [activeConvo]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !activeConvo || !user) return;
    try {
      await addDoc(collection(db, 'messages'), {
        conversation_id: activeConvo,
        sender_id: user.uid,
        content: newMsg.trim(),
        created_at: Timestamp.now(),
      });
      setNewMsg('');
    } catch (err) {
      console.error('[Messages] Send error:', err);
    }
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
                  <div key={msg.id} className={`flex ${msg.sender_id === user?.uid ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${
                      msg.sender_id === user?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
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
