import React from "react";
import VideoPanel from "./study-room/VideoPanel";
import ToolsPanel from "./study-room/ToolsPanel";

const Home = () => {
  return (
    <div className="flex h-screen w-screen bg-slate-900">
      {/* Video Panel (60%) */}
      <div className="w-[60%] p-4">
        <VideoPanel />
      </div>

      {/* Tools Panel (40%) */}
      <div className="w-[40%]">
        <ToolsPanel />
      </div>
    </div>
  );
};

export default Home;
