import React, { useEffect, useState } from "react";

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music2, Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { loginUrl, getAccessTokenFromUrl, spotifyApi } from "@/lib/spotify";
import { Slider } from "@/components/ui/slider";

declare global {
  interface Window {
    Spotify: {
      Player: any;
    };
  }
}

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
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [likedSongs, setLikedSongs] = useState<any[]>([]);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("playlists");
  const [volume, setVolume] = useState(50);

  // Initialize Spotify Web Playback SDK
  useEffect(() => {
    if (!token || !window.Spotify) return;

    const player = new window.Spotify.Player({
      name: 'Study Room Web Player',
      getOAuthToken: cb => { cb(token); },
      volume: 0.5
    });

    // Error handling
    player.addListener('initialization_error', ({ message }) => {
      console.error('Failed to initialize:', message);
    });

    player.addListener('authentication_error', ({ message }) => {
      console.error('Failed to authenticate:', message);
      setError('Failed to authenticate with Spotify. Please try reconnecting.');
    });

    player.addListener('account_error', ({ message }) => {
      console.error('Failed to validate Spotify account:', message);
    });

    player.addListener('playback_error', ({ message }) => {
      console.error('Failed to perform playback:', message);
    });

    player.addListener('ready', ({ device_id }) => {
      console.log('Ready with Device ID', device_id);
      setDeviceId(device_id);
      
      // Transfer playback to our new device
      fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_ids: [device_id],
          play: false,
        }),
      }).catch(console.error);
    });

    player.addListener('not_ready', ({ device_id }) => {
      console.log('Device ID has gone offline', device_id);
    });

    player.addListener('player_state_changed', (state) => {
      if (state) {
        setCurrentTrack({
          item: state.track_window.current_track,
          is_playing: !state.paused
        });
      }
    });

    player.connect();
    setPlayer(player);

    return () => {
      player.disconnect();
    };
  }, [token]);

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
        const [playlistsData, likedData, playbackData, devicesData] = await Promise.all([
          spotifyApi.getPlaylists(token),
          spotifyApi.getLikedSongs(token),
          spotifyApi.getCurrentPlayback(token),
          spotifyApi.getDevices(token),
        ]);

        setPlaylists(playlistsData.items || []);
        setLikedSongs(likedData.items || []);
        setCurrentTrack(playbackData);

        // Check if there are any active devices
        const devices = devicesData.devices || [];
        if (devices.length === 0) {
          setError("No Spotify devices found. Please open Spotify on your device first.");
        }
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
    if (!player) return;
    try {
      await player.togglePlay();
    } catch (error) {
      console.error("Error controlling playback:", error);
    }
  };

  const handleNext = async () => {
    if (!token || !deviceId) return;
    try {
      await fetch(`https://api.spotify.com/v1/me/player/next?device_id=${deviceId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      // Small delay to allow Spotify to update the state
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Fetch updated playback state
      const playback = await spotifyApi.getCurrentPlayback(token);
      setCurrentTrack(playback);
    } catch (error) {
      console.error("Error skipping track:", error);
    }
  };

  const handlePrevious = async () => {
    if (!token || !deviceId) return;
    try {
      await fetch(`https://api.spotify.com/v1/me/player/previous?device_id=${deviceId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      // Small delay to allow Spotify to update the state
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Fetch updated playback state
      const playback = await spotifyApi.getCurrentPlayback(token);
      setCurrentTrack(playback);
    } catch (error) {
      console.error("Error going to previous track:", error);
    }
  };

  const handlePlayPlaylist = async (playlist: any) => {
    if (!token || !deviceId) return;
    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context_uri: playlist.uri
        })
      });
    } catch (error) {
      console.error("Error playing playlist:", error);
      alert("Error playing playlist. Please try again.");
    }
  };

  const handlePlayTrack = async (track: any, index: number) => {
    if (!token || !deviceId) return;
    try {
      console.log("Attempting to play track:", track.uri);
      // Create an array of URIs from all liked songs
      const trackUris = likedSongs.map(item => item.track.uri);
      
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: trackUris,
          offset: { position: index }
        })
      });
    } catch (error: any) {
      console.error("Error playing track:", error);
      alert("Error playing track. Please try again.");
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
      {currentTrack && (          <div className="space-y-4 pb-4 border-b">
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
            <div className="space-y-2">
              {currentTrack?.item && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      {formatTime(Math.floor(currentTrack.progress_ms / 1000))}
                    </span>
                    <span>
                      {formatTime(Math.floor(currentTrack.item.duration_ms / 1000))}
                    </span>
                  </div>
                  <Slider
                    value={[currentTrack.progress_ms]}
                    max={currentTrack.item.duration_ms}
                    step={1000}
                    onValueChange={(value) => {
                      if (!deviceId) return;
                      fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${value[0]}&device_id=${deviceId}`, {
                        method: 'PUT',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json',
                        },
                      }).catch(console.error);
                    }}
                  />
                </div>
              )}
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
              <div className="flex items-center gap-2 px-4">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <Slider 
                  defaultValue={[volume]} 
                  max={100} 
                  step={1}
                  className="w-32"
                  onValueChange={(value) => {
                    const newVolume = value[0];
                    setVolume(newVolume);
                    if (player) {
                      player.setVolume(newVolume / 100);
                    }
                  }}
                />
              </div>
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
              {likedSongs.map((item, index) => (
                <div
                  key={item.track.id}
                  className={`flex items-center gap-3 p-2 hover:bg-muted rounded-md cursor-pointer ${
                    currentTrack?.item?.id === item.track.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => handlePlayTrack(item.track, index)}
                >
                  <div className="relative">
                    <img
                      src={
                        item.track?.album?.images?.[2]?.url ||
                        item.track?.album?.images?.[0]?.url ||
                        "https://images.unsplash.com/photo-1611339555312-e607c8352fd7?w=400&h=400&fit=crop"
                      }
                      alt={item.track.name}
                      className="w-10 h-10 rounded"
                    />
                    {currentTrack?.item?.id === item.track.id && currentTrack?.is_playing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${
                      currentTrack?.item?.id === item.track.id ? 'text-primary' : ''
                    }`}>
                      {item.track.name}
                    </p>
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
