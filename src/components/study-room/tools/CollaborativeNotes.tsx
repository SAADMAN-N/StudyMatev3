import React, { useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { PlusCircle, Share2, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

interface Note {
  id: string;
  title: string;
  content: string;
  lastEdited: string;
}

const CollaborativeNotes = () => {
  const { toast } = useToast();
  const [isSharedDocActive, setIsSharedDocActive] = React.useState(false);
  const [notes, setNotes] = React.useState<Note[]>([
    {
      id: "1",
      title: "Study Session Notes",
      content: "Key points from today's study session...",
      lastEdited: "2 mins ago",
    },
    {
      id: "2",
      title: "Math Formulas", 
      content: "Important formulas to remember...",
      lastEdited: "5 mins ago",
    },
  ]);
  const [newNoteTitle, setNewNoteTitle] = React.useState("");
  const [editingTitleId, setEditingTitleId] = React.useState<string | null>(null);

  const handleCreateNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: newNoteTitle || `Note ${notes.length + 1}`,
      content: "",
      lastEdited: new Date().toLocaleString(),
    };
    setNotes([...notes, newNote]);
    setNewNoteTitle("");
  };

  const handleEditNote = (id: string, content: string) => {
    setNotes(notes.map(note => 
      note.id === id ? {...note, content, lastEdited: new Date().toLocaleString()} : note
    ));
  };

  const handleShareNote = async (id: string) => {
    const noteToShare = notes.find(note => note.id === id);
    if (!noteToShare) return;

    try {
      await navigator.clipboard.writeText(
        `${noteToShare.title}\n\n${noteToShare.content}\n\nLast edited: ${noteToShare.lastEdited}`
      );
      toast({
        title: "Note shared!",
        description: "The note has been copied to your clipboard.",
        duration: 2000,
      });
    } catch (err) {
      console.error("Failed to copy note:", err);
      toast({
        title: "Failed to share note",
        description: "Could not copy the note to clipboard.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleSaveNote = (id: string) => {
    const noteToSave = notes.find(note => note.id === id);
    if (!noteToSave) return;

    // Create a blob with the note content
    const blob = new Blob(
      [`${noteToSave.title}\n\n${noteToSave.content}\n\nLast edited: ${noteToSave.lastEdited}`], 
      { type: 'text/plain' }
    );
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.download = `${noteToSave.title.toLowerCase().replace(/\s+/g, '-')}.txt`;
    
    // Append link to body, click it, and remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL
    URL.revokeObjectURL(url);
  };
  return (
    <Card className="w-full h-full bg-slate-900 p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">
          Collaborative Notes
        </h2>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Note title..."
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            className="max-w-[200px]"
          />
          <Button
            onClick={handleCreateNote}
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            New Note
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="flex-1">
        <TabsList className="bg-slate-800">
          <TabsTrigger value="all">All Notes</TabsTrigger>
          <TabsTrigger value="shared">Shared</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="flex-1 h-[calc(100%-40px)]">
          <ScrollArea className="h-full">
            <div className="space-y-4">
              {notes.length === 0 ? (
                <div className="text-center text-muted-foreground p-4">
                  No notes yet. Create your first note!
                </div>
              ) : (
                notes.map((note) => (
                <Card key={note.id} className="p-4 bg-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    {editingTitleId === note.id ? (
                      <Input
                        className="max-w-[200px] bg-slate-700 border-slate-600"
                        value={note.title}
                        onChange={(e) => {
                          setNotes(notes.map(n => 
                            n.id === note.id ? {...n, title: e.target.value, lastEdited: new Date().toLocaleString()} : n
                          ));
                        }}
                        onBlur={() => setEditingTitleId(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setEditingTitleId(null);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <h3 
                        className="text-lg font-medium text-white cursor-pointer hover:text-slate-300"
                        onClick={() => setEditingTitleId(note.id)}
                      >
                        {note.title}
                      </h3>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShareNote(note.id)}
                        title="Copy to clipboard"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSaveNote(note.id)}
                        title="Save as text file"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mb-2">
                    <Input
                      defaultValue={note.content}
                      className="bg-slate-700 border-slate-600"
                      onChange={(e) => handleEditNote(note.id, e.target.value)}
                    />
                  </div>
                  <p className="text-sm text-slate-400">
                    Last edited: {note.lastEdited}
                  </p>
                </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="shared" className="flex-1 h-[calc(100%-40px)]">
          <Card className="p-4 bg-slate-800 h-full">
            {!isSharedDocActive ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <h3 className="text-lg font-medium text-white">
                  Create or Join a Shared Document
                </h3>
                <Button 
                  onClick={() => setIsSharedDocActive(true)}
                  className="flex items-center gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  Create New Shared Document
                </Button>
              </div>
            ) : (
              <SharedEditor />
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

// Random color generator for cursors
const getRandomColor = () => {
  const colors = [
    '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff',
    '#ff8000', '#0080ff', '#8000ff', '#ff0080', '#80ff00', '#00ff80'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const SharedEditor = () => {
  const [status, setStatus] = React.useState('connecting');
  const { toast } = useToast();

  // Initialize Yjs document
  const ydoc = React.useMemo(() => new Y.Doc(), []);
  // Define a shared text type
  const ytext = React.useMemo(() => ydoc.getText('shared-note'), [ydoc]);

  // Generate a random user name and color
  const user = React.useMemo(() => ({
    name: `User ${Math.floor(Math.random() * 1000)}`,
    color: getRandomColor(),
  }), []);

  // Initialize WebSocket provider
  const provider = React.useMemo(() => {
    try {      // Use our existing signaling server for WebSocket connection
      const wsUrl = import.meta.env.VITE_SIGNALING_SERVER?.replace('http', 'ws') || 
        (window.location.hostname === 'localhost' ? 'ws://localhost:3002' : 'wss://studymate-signaling.onrender.com');
      
      console.log('Connecting to WebSocket server:', wsUrl);
      
      const provider = new WebsocketProvider(
        wsUrl,
        'studymate-shared-note-' + Math.floor(Math.random() * 1000), // Unique room name
        ydoc,
        { 
          connect: true,
          maxBackoffTime: 2500, // Reduce reconnection delay
          WebSocketPolyfill: WebSocket,
          resyncInterval: 3000
        }
      );

      // Set the awareness state after provider creation
      provider.awareness.setLocalState({
        user: {
          name: user.name,
          color: user.color,
        }
      });

      // Add more detailed status handling
      provider.on('status', ({ status: newStatus }: { status: string }) => {
        console.log('WebSocket status:', newStatus);
        setStatus(newStatus);
        if (newStatus === 'connected') {
          toast({
            title: "Connected to shared document",
            description: "You can now collaborate with others in real-time",
            duration: 3000,
          });
        } else if (newStatus === 'disconnected') {
          toast({
            title: "Disconnected",
            description: "Trying to reconnect...",
            variant: "destructive",
          });
          // Try to reconnect
          setTimeout(() => {
            provider.connect();
          }, 1000);
        }
      });

      provider.on('sync', (isSynced: boolean) => {
        console.log('Document synced:', isSynced);
        if (isSynced) {
          setStatus('connected');
        }
      });

      provider.on('connection-error', (event: Event) => {
        console.error('Connection error occurred:', event);
        setStatus('connection-error');
        toast({
          title: "Connection error",
          description: "Failed to connect to collaboration server. Retrying...",
          variant: "destructive",
          duration: 3000,
        });
        // Try to reconnect after error
        setTimeout(() => {
          provider.connect();
        }, 3000);
      });

      // Add connection close handler
      provider.on('connection-close', () => {
        console.log('Connection closed');
        setStatus('disconnected');
        // Try to reconnect
        setTimeout(() => {
          provider.connect();
        }, 1000);
      });

      return provider;
    } catch (error) {
      console.error('Failed to create WebSocket provider:', error);
      setStatus('error');
      return null;
    }
  }, [ydoc, user.name, user.color, toast]);

  // Cleanup provider on unmount
  React.useEffect(() => {
    return () => {
      if (provider) {
        provider.destroy();
      }
    };
  }, [provider]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false // Disable history as it's handled by Yjs
      }),
      Collaboration.configure({
        document: ydoc,
        field: 'content'
      }),
      ...(provider ? [
        CollaborationCursor.configure({
          provider,
          user: {
            name: user.name,
            color: user.color,
          },
        }),
      ] : []),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm w-full max-w-none focus:outline-none min-h-[200px] p-4',
      },
    },
  });

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">
          Shared Document
        </h3>
        <span className={`text-sm ${
          status === 'connected' ? 'text-green-400' : 'text-yellow-400'
        }`}>
          {status === 'connected' ? 'Connected' : 'Connecting...'}
        </span>
      </div>
      
      <div className="bg-slate-700 rounded-lg p-4">
        <div className="prose prose-invert prose-sm w-full max-w-none">
          {status === 'connecting' ? (
            <div className="flex items-center justify-center min-h-[300px] text-slate-400">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <p>Connecting to collaboration server...</p>
              </div>
            </div>
          ) : status === 'connection-error' || status === 'error' ? (
            <div className="flex items-center justify-center min-h-[300px] text-red-400">
              <p>Failed to connect to collaboration server. Please try refreshing the page.</p>
            </div>
          ) : (
            <EditorContent editor={editor} className="min-h-[300px] focus:outline-none" />
          )}
        </div>
      </div>

      <div className="text-sm text-slate-400">
        Connected as {user.name}
      </div>
    </div>
  );
};

export default CollaborativeNotes;
