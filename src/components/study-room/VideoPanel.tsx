import React from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Camera,
  Mic,
  MicOff,
  Video,
  VideoOff,
  UserCircle2,
  Settings,
} from "lucide-react";

interface MatchInfo {
  name: string;
  avatar: string;
  interests: string[];
  studyPreferences: {
    subject: string;
    level: string;
  };
  isOnline: boolean;
}

interface VideoPanelProps {
  matchInfo?: MatchInfo;
  isCameraOn?: boolean;
  isMicOn?: boolean;
  onToggleCamera?: () => void;
  onToggleMic?: () => void;
  onOpenSettings?: () => void;
}

const VideoPanel = ({
  matchInfo = {
    name: "Study Buddy",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=buddy",
    interests: ["Mathematics", "Physics", "Computer Science"],
    studyPreferences: {
      subject: "Quantum Mechanics",
      level: "Advanced",
    },
    isOnline: true,
  },
  isCameraOn = true,
  isMicOn = true,
  onToggleCamera = () => {},
  onToggleMic = () => {},
  onOpenSettings = () => {},
}: VideoPanelProps) => {
  return (
    <Card className="w-full h-full bg-slate-900 flex flex-col">
      {/* Main video area */}
      <div className="flex-1 relative">
        {/* Video placeholder or stream */}
        <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
          {isCameraOn ? (
            <video
              className="w-full h-full object-cover"
              poster="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=800&fit=crop"
            />
          ) : (
            <UserCircle2 className="h-24 w-24 text-slate-600" />
          )}
        </div>

        {/* Match info overlay */}
        <div className="absolute top-4 left-4 flex items-center gap-3">
          <Avatar className="h-12 w-12 ring-2 ring-primary">
            <img src={matchInfo.avatar} alt={matchInfo.name} />
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-white font-medium">{matchInfo.name}</h3>
              <Badge
                variant={matchInfo.isOnline ? "default" : "secondary"}
                className="h-2 w-2 rounded-full p-0"
              />
            </div>
            <p className="text-sm text-slate-300">
              {matchInfo.studyPreferences.subject} -{" "}
              {matchInfo.studyPreferences.level}
            </p>
          </div>
        </div>

        {/* Interests overlay */}
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
          {matchInfo.interests.map((interest) => (
            <Badge key={interest} variant="secondary">
              {interest}
            </Badge>
          ))}
        </div>
      </div>

      {/* Control bar */}
      <div className="p-4 bg-muted flex items-center justify-between">
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isCameraOn ? "default" : "destructive"}
                  size="icon"
                  onClick={onToggleCamera}
                >
                  {isCameraOn ? (
                    <Video className="h-5 w-5" />
                  ) : (
                    <VideoOff className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isCameraOn ? "Turn off camera" : "Turn on camera"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isMicOn ? "default" : "destructive"}
                  size="icon"
                  onClick={onToggleMic}
                >
                  {isMicOn ? (
                    <Mic className="h-5 w-5" />
                  ) : (
                    <MicOff className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isMicOn ? "Turn off microphone" : "Turn on microphone"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onOpenSettings}>
                  <Settings className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Open settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </Card>
  );
};

export default VideoPanel;
