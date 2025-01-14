import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RotateCcw, Settings } from "lucide-react";

interface PomodoroTimerProps {
  initialTime?: number;
  onTimerComplete?: () => void;
  presetIntervals?: number[];
}

const PomodoroTimer = ({
  initialTime = 25 * 60, // 25 minutes in seconds
  onTimerComplete = () => {},
  presetIntervals = [15, 25, 30, 45], // minutes
}: PomodoroTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isActive, setIsActive] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(25);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      onTimerComplete();
      setIsActive(false);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, onTimerComplete]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(selectedPreset * 60);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const calculateProgress = () => {
    return ((selectedPreset * 60 - timeLeft) / (selectedPreset * 60)) * 100;
  };

  return (
    <Card className="w-full h-[400px] p-6 bg-background flex flex-col items-center justify-between">
      <Tabs defaultValue="timer" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timer">Timer</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="timer" className="space-y-8">
          <div className="relative w-64 h-64 mx-auto mt-4 flex items-center justify-center">
            <div className="absolute inset-0">
              <Progress 
                value={calculateProgress()} 
                className="h-full w-full rounded-full"
              />
            </div>
            <span className="text-4xl font-bold relative z-10">
              {formatTime(timeLeft)}
            </span>
          </div>

          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTimer}
              className="h-12 w-12"
            >
              {isActive ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={resetTimer}
              className="h-12 w-12"
            >
              <RotateCcw className="h-6 w-6" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Preset Intervals</h3>
              <div className="flex flex-wrap gap-2">
                {presetIntervals.map((interval) => (
                  <Button
                    key={interval}
                    variant={
                      selectedPreset === interval ? "default" : "outline"
                    }
                    onClick={() => {
                      setSelectedPreset(interval);
                      setTimeLeft(interval * 60);
                    }}
                  >
                    {interval}m
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">Custom Duration</h3>
              <Slider
                defaultValue={[selectedPreset]}
                max={60}
                min={1}
                step={1}
                onValueChange={(value) => {
                  setSelectedPreset(value[0]);
                  setTimeLeft(value[0] * 60);
                }}
              />
              <p className="text-sm text-muted-foreground text-center">
                {selectedPreset} minutes
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default PomodoroTimer;
