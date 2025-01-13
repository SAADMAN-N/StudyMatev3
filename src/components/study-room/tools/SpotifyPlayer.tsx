import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music2, Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { loginUrl, getAccessTokenFromUrl, spotifyApi } from "@/lib/spotify";

interface SpotifyPlayerProps {
  playlists?: Array<{
    id: string;
    name: string;
    imageUrl: string;
  }>;
  currentTrack?: {
    title: string;
    artist: string;
    imageUrl: string;
    duration: number;
    progress: number;
  };
  isPlaying?: boolean;
}

const SpotifyPlayer = () => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("spotify_token"),
  );
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [likedSongs, setLikedSongs] = useState<any[]>([]);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("playlists");

  useEffect(() => {
    const token = getAccessTokenFromUrl();
    if (token) {
      localStorage.setItem("spotify_token", token);
      setToken(token);
      window.location.hash = "";
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [playlistsData, likedData, playbackData] = await Promise.all([
          spotifyApi.getPlaylists(token),
          spotifyApi.getLikedSongs(token),
          spotifyApi.getCurrentPlayback(token),
        ]);

        setPlaylists(playlistsData.items || []);
        setLikedSongs(likedData.items || []);
        setCurrentTrack(playbackData);
      } catch (error: any) {
        console.error("Error fetching Spotify data:", error);
        setError("Failed to load Spotify data. Please try reconnecting.");
        if (error.status === 401) {
          localStorage.removeItem("spotify_token");
          setToken(null);
          setError("Spotify session expired. Please reconnect.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const handlePlayPause = async () => {
    if (!token || !currentTrack) return;
    try {
      if (currentTrack.is_playing) {
        await spotifyApi.pausePlayback(token);
      } else {
        await spotifyApi.playTrack(token);
      }
      const playback = await spotifyApi.getCurrentPlayback(token);
      setCurrentTrack(playback);
    } catch (error) {
      console.error("Error controlling playback:", error);
    }
  };

  const handleNext = async () => {
    if (!token) return;
    try {
      await spotifyApi.nextTrack(token);
      const playback = await spotifyApi.getCurrentPlayback(token);
      setCurrentTrack(playback);
    } catch (error) {
      console.error("Error skipping track:", error);
    }
  };

  const handlePrevious = async () => {
    if (!token) return;
    try {
      await spotifyApi.previousTrack(token);
      const playback = await spotifyApi.getCurrentPlayback(token);
      setCurrentTrack(playback);
    } catch (error) {
      console.error("Error going to previous track:", error);
    }
  };

  const handlePlayPlaylist = async (playlist: any) => {
    if (!token) return;
    try {
      await spotifyApi.playTrack(token, undefined, playlist.uri);
      const playback = await spotifyApi.getCurrentPlayback(token);
      setCurrentTrack(playback);
    } catch (error) {
      console.error("Error playing playlist:", error);
    }
  };

  const handlePlayTrack = async (track: any) => {
    if (!token) return;
    try {
      await spotifyApi.playTrack(token, track.uri);
      const playback = await spotifyApi.getCurrentPlayback(token);
      setCurrentTrack(playback);
    } catch (error) {
      console.error("Error playing track:", error);
    }
  };

  if (!token) {
    return (
      <Card className="w-full h-full bg-background flex flex-col items-center justify-center gap-4 p-6">
        <Music2 className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Connect to Spotify</h2>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Connect your Spotify account to control playback and access your
          playlists
        </p>
        <Button asChild>
          <a href={loginUrl}>Connect Spotify</a>
        </Button>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full h-full bg-background flex flex-col items-center justify-center gap-4 p-6">
        <Music2 className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold text-destructive">{error}</h2>
        <Button
          onClick={() => {
            setError(null);
            window.location.href = loginUrl;
          }}
        >
          Reconnect to Spotify
        </Button>
      </Card>
    );
  }

  if (isLoading && !playlists.length) {
    return (
      <Card className="w-full h-full bg-background flex items-center justify-center p-6">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full bg-background p-6 flex flex-col gap-6">
      {currentTrack && (
        <div className="space-y-4 pb-4 border-b">
          <div className="flex gap-4 items-center">
            <img
              src={
                currentTrack?.item?.album?.images?.[0]?.url ||
                "https://images.unsplash.com/photo-1611339555312-e607c8352fd7?w=400&h=400&fit=crop"
              }
              alt={currentTrack.item?.name}
              className="w-16 h-16 rounded-md"
            />
            <div className="flex-1">
              <h3 className="font-medium">{currentTrack.item?.name}</h3>
              <p className="text-sm text-muted-foreground">
                {currentTrack.item?.artists?.map((a: any) => a.name).join(", ")}
              </p>
            </div>
          </div>
          <div className="flex justify-center gap-2">
            <Button variant="ghost" size="icon" onClick={handlePrevious}>
              <SkipBack className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handlePlayPause}>
              {currentTrack.is_playing ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNext}>
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
          <TabsTrigger value="liked">Liked Songs</TabsTrigger>
        </TabsList>

        <TabsContent value="playlists" className="mt-4">
          <ScrollArea className="h-[calc(100vh-400px)]">
            <div className="grid grid-cols-2 gap-4">
              {playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  className="group relative aspect-square overflow-hidden rounded-md cursor-pointer"
                  onClick={() => handlePlayPlaylist(playlist)}
                >
                  <img
                    src={
                      playlist.images?.[0]?.url ||
                      "https://images.unsplash.com/photo-1611339555312-e607c8352fd7?w=400&h=400&fit=crop"
                    }
                    alt={playlist.name}
                    className="object-cover w-full h-full transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-end p-3">
                    <span className="text-white font-medium">
                      {playlist.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="liked" className="mt-4">
          <ScrollArea className="h-[calc(100vh-400px)]">
            <div className="space-y-2">
              {likedSongs.map((item) => (
                <div
                  key={item.track.id}
                  className="flex items-center gap-3 p-2 hover:bg-muted rounded-md cursor-pointer"
                  onClick={() => handlePlayTrack(item.track)}
                >
                  <img
                    src={
                      item.track?.album?.images?.[2]?.url ||
                      item.track?.album?.images?.[0]?.url ||
                      "https://images.unsplash.com/photo-1611339555312-e607c8352fd7?w=400&h=400&fit=crop"
                    }
                    alt={item.track.name}
                    className="w-10 h-10 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.track.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {item.track.artists.map((a: any) => a.name).join(", ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <Button
        variant="ghost"
        className="mt-auto"
        onClick={() => {
          localStorage.removeItem("spotify_token");
          setToken(null);
        }}
      >
        Disconnect
      </Button>
    </Card>
  );
};

export default SpotifyPlayer;
