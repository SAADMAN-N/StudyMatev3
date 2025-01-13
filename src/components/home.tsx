import React from "react";
import VideoPanel from "./study-room/VideoPanel";
import ToolsPanel from "./study-room/ToolsPanel";

interface HomeProps {
  activeToolTab?: string;
  isCameraOn?: boolean;
  isMicOn?: boolean;
  onToolTabChange?: (tab: string) => void;
  onToggleCamera?: () => void;
  onToggleMic?: () => void;
  onOpenSettings?: () => void;
}

const Home = ({
  activeToolTab = "pomodoro",
  isCameraOn = true,
  isMicOn = true,
  onToolTabChange = () => {},
  onToggleCamera = () => {},
  onToggleMic = () => {},
  onOpenSettings = () => {},
}: HomeProps) => {
  return (
    <div className="flex h-screen w-screen bg-background">
      {/* Video Panel (60%) */}
      <div className="w-[60%] p-4">
        <VideoPanel
          isCameraOn={isCameraOn}
          isMicOn={isMicOn}
          onToggleCamera={onToggleCamera}
          onToggleMic={onToggleMic}
          onOpenSettings={onOpenSettings}
        />
      </div>

      {/* Tools Panel (40%) */}
      <div className="w-[40%]">
        <ToolsPanel activeTab={activeToolTab} onTabChange={onToolTabChange} />
      </div>
    </div>
  );
};

export default Home;
