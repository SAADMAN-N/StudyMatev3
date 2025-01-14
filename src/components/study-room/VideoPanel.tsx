import React, { useEffect, useRef, useState } from "react";
import SimplePeer from "simple-peer";
import { WebRTCManager } from "@/lib/webrtc";
import { SignalingService } from "@/lib/signaling";
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
  SkipForward,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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
  isCameraOn: initialCameraState = true,
  isMicOn: initialMicState = true,
  onToggleCamera,
  onToggleMic,
  onOpenSettings,
}: VideoPanelProps) => {
  const { toast } = useToast();
  const [isCameraOn, setIsCameraOn] = useState(initialCameraState);
  const [isMicOn, setIsMicOn] = useState(initialMicState);
  const [isSearching, setIsSearching] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const webrtcManager = useRef<WebRTCManager>(new WebRTCManager());
  const signalingService = useRef<SignalingService>();

  useEffect(() => {
    const initializeStream = async () => {
      try {
        const stream = await webrtcManager.current.getLocalStream();
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Initialize signaling service after getting local stream
        signalingService.current = new SignalingService(webrtcManager.current);
        
        signalingService.current.onPeerConnected(() => {
          setIsConnected(true);
          setIsSearching(false);
        });

        signalingService.current.onPeerDisconnected(() => {
          setIsConnected(false);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
        });

        // Handle remote stream
        webrtcManager.current.onStream((stream) => {
          console.log('Received remote stream in VideoPanel');
          // Use a small delay to ensure ref is mounted
          setTimeout(() => {
            if (remoteVideoRef.current) {
              console.log('Setting remote video source');
              remoteVideoRef.current.srcObject = stream;
              // Ensure video starts playing
              const playPromise = remoteVideoRef.current.play();
              if (playPromise !== undefined) {
                playPromise.catch(error => {
                  console.error('Failed to play remote video:', error);
                });
              }
            } else {
              console.warn('Remote video ref not available');
            }
          }, 100);
        });
      } catch (error) {
        console.error('Failed to get camera/microphone access:', error);
        
        let errorMessage = "Failed to access camera and microphone.";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        
        toast({
          title: "Camera Access Error",
          description: errorMessage + " Please ensure you're using a modern browser and have granted the necessary permissions.",
          variant: "destructive",
          duration: 5000,
        });
      }
    };

    initializeStream();

    return () => {
      signalingService.current?.disconnect();
      webrtcManager.current.cleanup();
    };
  }, []);

  const handleFindMatch = () => {
    setIsSearching(true);
    signalingService.current?.findMatch();
  };

  const handleSkip = () => {
    setIsSearching(true);
    signalingService.current?.skipPeer();
  };

  const handleToggleCamera = () => {
    const newState = !isCameraOn;
    setIsCameraOn(newState);
    webrtcManager.current.toggleVideo(newState);
    onToggleCamera?.();
  };

  const handleToggleMic = () => {
    const newState = !isMicOn;
    setIsMicOn(newState);
    webrtcManager.current.toggleAudio(newState);
    onToggleMic?.();
  };

  return (
    <Card className="w-full h-full bg-slate-800 flex flex-col">
      {/* Main video area */}
      <div className="flex-1 relative">
        {/* Video streams */}
        <div className="absolute inset-0 bg-slate-800 flex">
          {/* Local video */}
          <div className="absolute top-4 right-4 w-48 h-36 bg-slate-700 rounded-lg overflow-hidden">
            {isCameraOn ? (
              <video
                ref={localVideoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted // Mute local video to prevent feedback
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UserCircle2 className="h-12 w-12 text-slate-600" />
              </div>
            )}
          </div>

          {/* Remote video (main view) */}
          <div className="w-full h-full flex items-center justify-center">
            {isConnected ? (
              <video
                ref={remoteVideoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted={false}
              />
            ) : (
              <div className="text-center">
                <UserCircle2 className="h-24 w-24 text-slate-600 mx-auto mb-4" />
                <Button
                  onClick={handleFindMatch}
                  disabled={isSearching}
                  className="mb-2"
                >
                  {isSearching ? 'Searching...' : 'Find Study Partner'}
                </Button>
                {isSearching && (
                  <p className="text-sm text-slate-400">Looking for someone to study with...</p>
                )}
              </div>
            )}
          </div>
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
        <div className="flex items-center gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isCameraOn ? "default" : "destructive"}
                  size="icon"
                  onClick={handleToggleCamera}
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
                  onClick={handleToggleMic}
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
          {isConnected && (
            <Button
              variant="secondary"
              onClick={handleSkip}
              className="flex items-center gap-2"
            >
              <SkipForward className="h-4 w-4" />
              Skip
            </Button>
          )}
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
