import { useState, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { uploadFile, generateUploadPath } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ImagePlus, Film, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Create = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [type, setType] = useState<'post' | 'story' | 'reel'>('post');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!file || !user) return;
    setUploading(true);

    try {
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      const folder = type === 'reel' ? 'reels' : type === 'story' ? 'stories' : 'posts';
      const path = generateUploadPath(folder, user.uid, file.name);
      const mediaUrl = await uploadFile(file, path);
      console.log('[Create] File uploaded:', mediaUrl);

      if (type === 'post') {
        const hashtags = caption.match(/#\w+/g)?.map(h => h.slice(1)) || [];
        await addDoc(collection(db, 'posts'), {
          user_id: user.uid,
          media_url: mediaUrl,
          media_type: mediaType,
          caption,
          hashtags: hashtags.length > 0 ? hashtags : [],
          created_at: Timestamp.now(),
        });
        toast.success('Post shared!');
        console.log('[Create] Post created');
      } else if (type === 'story') {
        const expiresAt = Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
        await addDoc(collection(db, 'stories'), {
          user_id: user.uid,
          media_url: mediaUrl,
          media_type: mediaType,
          created_at: Timestamp.now(),
          expires_at: expiresAt,
        });
        toast.success('Story added!');
        console.log('[Create] Story created, expires at', expiresAt.toDate());
      } else if (type === 'reel') {
        await addDoc(collection(db, 'reels'), {
          user_id: user.uid,
          video_url: mediaUrl,
          caption,
          created_at: Timestamp.now(),
        });
        toast.success('Reel shared!');
        console.log('[Create] Reel created');
      }
      navigate('/');
    } catch (err: any) {
      console.error('[Create] Upload error:', err);
      toast.error(err.message || 'Failed to upload');
    }
    setUploading(false);
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto p-4 space-y-4">
        <h1 className="text-xl font-semibold text-foreground">Create</h1>

        <Tabs defaultValue="post" onValueChange={(v) => setType(v as any)}>
          <TabsList className="w-full">
            <TabsTrigger value="post" className="flex-1">Post</TabsTrigger>
            <TabsTrigger value="story" className="flex-1">Story</TabsTrigger>
            <TabsTrigger value="reel" className="flex-1">Reel</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* File Upload */}
        {!preview ? (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-3 hover:border-muted-foreground transition-colors"
          >
            {type === 'reel' ? <Film className="h-12 w-12 text-muted-foreground" /> : <ImagePlus className="h-12 w-12 text-muted-foreground" />}
            <span className="text-sm text-muted-foreground">Click to upload {type === 'reel' ? 'video' : 'photo or video'}</span>
          </button>
        ) : (
          <div className="relative">
            {file?.type.startsWith('video/') ? (
              <video src={preview} className="w-full aspect-square object-cover rounded-lg" controls />
            ) : (
              <img src={preview} alt="Preview" className="w-full aspect-square object-cover rounded-lg" />
            )}
            <button
              onClick={() => { setFile(null); setPreview(null); }}
              className="absolute top-2 right-2 bg-background/80 rounded-full p-1"
            >
              <X className="h-5 w-5 text-foreground" />
            </button>
          </div>
        )}
        <Input
          ref={fileRef}
          type="file"
          accept={type === 'reel' ? 'video/*' : 'image/*,video/*'}
          onChange={handleFile}
          className="hidden"
        />

        {type !== 'story' && (
          <Textarea
            placeholder="Write a caption..."
            value={caption}
            onChange={e => setCaption(e.target.value)}
            className="resize-none"
            rows={3}
          />
        )}

        <Button
          onClick={handleSubmit}
          disabled={!file || uploading}
          className="w-full"
        >
          {uploading ? 'Uploading...' : `Share ${type}`}
        </Button>
      </div>
    </AppLayout>
  );
};

export default Create;
