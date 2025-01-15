import React, { useEffect, useRef, useState } from "react";
import { WebRTCManager } from "@/lib/webrtc";
import { SignalingService } from "@/lib/signaling";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Video, VideoOff, UserCircle2, Settings, SkipForward } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const AVAILABLE_TAGS = [
  'Mathematics',
  'Physics',
  'Computer Science',
  'Chemistry',
  'Biology',
  'Literature',
  'History',
  'Economics',
  'Psychology',
  'Art',
  'Music',
  'Languages'
] as const;

export default function VideoPanel() {
  const { toast } = useToast();
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
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
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
          }
        });
      } catch (error) {
        console.error('Failed to get camera/microphone access:', error);
        toast({
          title: "Camera Access Error",
          description: "Please ensure you've granted camera and microphone permissions.",
          variant: "destructive",
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
    signalingService.current?.findMatch(selectedTags);
    
    toast({
      title: "Finding Partner",
      description: selectedTags.length > 0 
        ? "Looking for someone with similar interests..." 
        : "Looking for any available study partner...",
      duration: 3000,
    });
  };

  const handleSkip = () => {
    setIsSearching(true);
    signalingService.current?.skipPeer(selectedTags);
  };

  const handleToggleCamera = () => {
    const newState = !isCameraOn;
    setIsCameraOn(newState);
    webrtcManager.current.toggleVideo(newState);
  };

  const handleToggleMic = () => {
    const newState = !isMicOn;
    setIsMicOn(newState);
    webrtcManager.current.toggleAudio(newState);
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
                muted
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
              />
            ) : (
              <div className="text-center">
                <UserCircle2 className="h-24 w-24 text-slate-600 mx-auto mb-4" />
                
                {/* Tag Selection */}
                <div className="mb-4 max-w-sm mx-auto">
                  <Select
                    onValueChange={(value) => {
                      if (!selectedTags.includes(value)) {
                        setSelectedTags([...selectedTags, value]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your interests" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_TAGS.map((tag) => (
                        <SelectItem 
                          key={tag} 
                          value={tag}
                          disabled={selectedTags.includes(tag)}
                        >
                          {tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Selected Tags */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTags.map((tag) => (
                      <Badge 
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleFindMatch}
                  disabled={isSearching}
                  className="w-full max-w-sm"
                >
                  {isSearching ? 'Searching...' : selectedTags.length > 0 ? 'Find Study Partner' : 'Find Random Partner'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div className="p-4 bg-muted flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant={isCameraOn ? "default" : "destructive"}
            size="icon"
            onClick={handleToggleCamera}
          >
            {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>

          <Button
            variant={isMicOn ? "default" : "destructive"}
            size="icon"
            onClick={handleToggleMic}
          >
            {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

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
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
