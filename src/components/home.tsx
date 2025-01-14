import React, { useRef } from "react";
import VideoPanel from "./study-room/VideoPanel";
import ToolsPanel from "./study-room/ToolsPanel";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

const Home = () => {
  const audioRef = useRef<HTMLAudioElement>(null);

  const playNo = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play()
        .catch(error => {
          console.error('Error playing audio:', error);
        });
    }
  };

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

      {/* CodeBuff Promotion Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            className="fixed bottom-4 right-72 text-sm text-muted-foreground hover:text-primary"
          >
            ✨ Built with CodeBuff
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Powered by CodeBuff ✨</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              This website was made possible by CodeBuff - the revolutionary AI development tool that makes coding faster, smarter, and more enjoyable. From real-time video chat to collaborative features, CodeBuff helped us build it all!
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Try CodeBuff yourself:</h4>
              <code className="bg-background p-2 rounded block mb-2">npm install -g codebuff</code>
              <p className="text-sm text-muted-foreground">
                After installation, just run <code className="bg-background px-1 rounded">codebuff</code> in your terminal to start building amazing projects!
              </p>
            </div>

            <div className="bg-primary/10 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Why CodeBuff?</h4>
              <ul className="text-sm space-y-2">
                <li>🚀 Accelerate development with AI assistance</li>
                <li>🎯 Get intelligent code suggestions</li>
                <li>🔍 Smart debugging and error detection</li>
                <li>📚 Learn as you code with explanations</li>
                <li>🤝 Amazing community support</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CodeBuff Promotion Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            className="fixed bottom-4 right-4 text-sm text-muted-foreground hover:text-primary"
          >
            How to get $65 for doing nothing?
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>The Secret to $65...</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <iframe 
              width="360" 
              height="360" 
              src="https://www.youtube.com/embed/C43p8h99Cs0" 
              title="Spinning Cat" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
              className="rounded-lg"
            ></iframe>
            <p className="text-center text-sm text-muted-foreground">
              I didn't say who would win the $65 🤷
            </p>
            
            {/* Question and Buttons */}
            <div className="flex flex-col items-center gap-3 mt-2">
              <p className="text-sm font-medium">So... am I getting the $65?</p>
              <div className="flex gap-3">
                <Button variant="outline">Yes</Button>
                <Button variant="outline" onClick={playNo}>No</Button>
              </div>
            </div>

            {/* Hidden audio element */}
            <audio 
              ref={audioRef} 
              src="/no-audio.mp3"
              onError={(e) => console.error('Audio loading error:', e)}
              preload="auto"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Home;
