import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { PlusCircle, Share2, Save } from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  lastEdited: string;
}

interface CollaborativeNotesProps {
  notes?: Note[];
  onCreateNote?: () => void;
  onEditNote?: (id: string, content: string) => void;
  onShareNote?: (id: string) => void;
}

const defaultNotes: Note[] = [
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
];

const CollaborativeNotes = ({
  notes = defaultNotes,
  onCreateNote = () => {},
  onEditNote = () => {},
  onShareNote = () => {},
}: CollaborativeNotesProps) => {
  return (
    <Card className="w-full h-full bg-slate-900 p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">
          Collaborative Notes
        </h2>
        <Button
          onClick={onCreateNote}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
        >
          <PlusCircle className="h-4 w-4" />
          New Note
        </Button>
      </div>

      <Tabs defaultValue="all" className="flex-1">
        <TabsList className="bg-slate-800">
          <TabsTrigger value="all">All Notes</TabsTrigger>
          <TabsTrigger value="shared">Shared</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="flex-1 h-[calc(100%-40px)]">
          <ScrollArea className="h-full">
            <div className="space-y-4">
              {notes.map((note) => (
                <Card key={note.id} className="p-4 bg-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-white">
                      {note.title}
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onShareNote(note.id)}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditNote(note.id, note.content)}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mb-2">
                    <Input
                      defaultValue={note.content}
                      className="bg-slate-700 border-slate-600"
                      onChange={(e) => onEditNote(note.id, e.target.value)}
                    />
                  </div>
                  <p className="text-sm text-slate-400">
                    Last edited: {note.lastEdited}
                  </p>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="shared" className="flex-1 h-[calc(100%-40px)]">
          <div className="h-full flex items-center justify-center text-slate-400">
            No shared notes yet
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default CollaborativeNotes;
