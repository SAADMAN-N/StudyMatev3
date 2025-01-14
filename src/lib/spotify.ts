const CLIENT_ID = "05c0b3929ba24882a527304104272769";
const REDIRECT_URI = "http://localhost:5173";
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const RESPONSE_TYPE = "token";
const SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "user-library-read",
  "playlist-read-private",
  "app-remote-control",
].join(" ");

export const loginUrl = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=${RESPONSE_TYPE}&scope=${encodeURIComponent(SCOPES)}`;

export const getAccessTokenFromUrl = () => {
  try {
    const hash = window.location.hash;
    if (!hash) return null;

    const params = new URLSearchParams(hash.substring(1));
    const token = params.get("access_token");
    const error = params.get("error");

    if (error) {
      console.error("Spotify auth error:", error);
      return null;
    }

    return token;
  } catch (error) {
    console.error("Error parsing Spotify token:", error);
    return null;
  }
};

export const spotifyApi = {
  async getDevices(token: string) {
    const response = await fetch("https://api.spotify.com/v1/me/player/devices", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      (error as any).status = response.status;
      throw error;
    }
    return response.json();
  },

  async getCurrentUser(token: string) {
    const response = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      (error as any).status = response.status;
      throw error;
    }
    return response.json();
  },

  async getPlaylists(token: string) {
    const response = await fetch("https://api.spotify.com/v1/me/playlists", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      (error as any).status = response.status;
      throw error;
    }
    return response.json();
  },

  async getLikedSongs(token: string) {
    const response = await fetch(
      "https://api.spotify.com/v1/me/tracks?limit=50",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      (error as any).status = response.status;
      throw error;
    }
    return response.json();
  },

  async getCurrentPlayback(token: string) {
    const response = await fetch("https://api.spotify.com/v1/me/player", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 204) return null;
    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      (error as any).status = response.status;
      throw error;
    }
    return response.json();
  },

  async playTrack(token: string, uri?: string, context_uri?: string) {
    const response = await fetch("https://api.spotify.com/v1/me/player/play", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(
        context_uri ? { context_uri } : uri ? { uris: [uri] } : {},
      ),
    });
    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      (error as any).status = response.status;
      throw error;
    }
  },

  async pausePlayback(token: string) {
    const response = await fetch("https://api.spotify.com/v1/me/player/pause", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      (error as any).status = response.status;
      throw error;
    }
  },

  async nextTrack(token: string) {
    const response = await fetch("https://api.spotify.com/v1/me/player/next", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      (error as any).status = response.status;
      throw error;
    }
  },

  async previousTrack(token: string) {
    const response = await fetch(
      "https://api.spotify.com/v1/me/player/previous",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      (error as any).status = response.status;
      throw error;
    }
  },

  async setVolume(token: string, volumePercent: number) {
    const response = await fetch(
      `https://api.spotify.com/v1/me/player/volume?volume_percent=${volumePercent}`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      (error as any).status = response.status;
      throw error;
    }
  },
};
