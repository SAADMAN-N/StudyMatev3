import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PomodoroTimer from "./tools/PomodoroTimer";
import SpotifyPlayer from "./tools/SpotifyPlayer";
import AiTutorChat from "./tools/AiTutorChat";
import CollaborativeNotes from "./tools/CollaborativeNotes";

interface ToolsPanelProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const ToolsPanel = ({
  activeTab = "pomodoro",
  onTabChange = () => {},
}: ToolsPanelProps) => {
  return (
    <div className="w-[605px] h-[982px] bg-slate-900 border-l border-slate-800 p-4">
      <Tabs
        defaultValue={activeTab}
        className="h-full"
        onValueChange={onTabChange}
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pomodoro">Timer</TabsTrigger>
          <TabsTrigger value="spotify">Music</TabsTrigger>
          <TabsTrigger value="tutor">AI Tutor</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <div className="mt-4 h-[calc(100%-48px)]">
          <TabsContent value="pomodoro" className="h-full">
            <PomodoroTimer />
          </TabsContent>

          <TabsContent value="spotify" className="h-full">
            <SpotifyPlayer />
          </TabsContent>

          <TabsContent value="tutor" className="h-full">
            <AiTutorChat />
          </TabsContent>

          <TabsContent value="notes" className="h-full">
            <CollaborativeNotes />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default ToolsPanel;
