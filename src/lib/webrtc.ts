import SimplePeer from 'simple-peer';

export interface PeerConnection {
  peer: SimplePeer.Instance;
  stream: MediaStream;
}

type StreamCallback = (stream: MediaStream) => void;

export interface WebRTCManager {
  connections: Map<string, PeerConnection>;
  getLocalStream(): Promise<MediaStream>;
  onStream(callback: StreamCallback): void;
  initializePeer(userId: string, initiator: boolean): Promise<SimplePeer.Instance>;
  handleSignal(userId: string, signal: SimplePeer.SignalData): void;
  getConnection(userId: string): PeerConnection | undefined;
  closeConnection(userId: string): void;
  toggleAudio(enabled: boolean): void;
  toggleVideo(enabled: boolean): void;
  cleanup(): void;
}

export class WebRTCManagerImpl implements WebRTCManager {
  public readonly connections = new Map<string, PeerConnection>();
  private readonly localStream: MediaStream | null = null;
  private onStreamCallback?: StreamCallback;

  async getLocalStream(): Promise<MediaStream> {
    if (this.localStream) return this.localStream;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      (this as any).localStream = stream;
      return stream;
    } catch (error) {
      console.error('Failed to get local stream:', error);
      throw error;
    }
  }

  onStream(callback: StreamCallback) {
    this.onStreamCallback = callback;
  }

  async initializePeer(userId: string, initiator: boolean): Promise<SimplePeer.Instance> {
    this.closeConnection(userId);

    try {
      const stream = await this.getLocalStream();
      
      const peer = new SimplePeer({
        initiator,
        stream,
        trickle: false,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
          ]
        }
      }) as SimplePeer.Instance;

      peer.on('stream', (remoteStream: MediaStream) => {
        if (this.onStreamCallback) {
          this.onStreamCallback(remoteStream);
        }
      });

      peer.on('error', (err) => console.error('Peer error:', err));
      peer.on('connect', () => console.log('Peer connected'));
      peer.on('close', () => console.log('Peer closed'));

      this.connections.set(userId, { peer, stream });
      return peer;
    } catch (error) {
      console.error('Failed to initialize peer:', error);
      throw error;
    }
  }

  getConnection(userId: string): PeerConnection | undefined {
    return this.connections.get(userId);
  }

  handleSignal(userId: string, signal: SimplePeer.SignalData) {
    const connection = this.connections.get(userId);
    if (connection) {
      connection.peer.signal(signal);
    }
  }

  closeConnection(userId: string) {
    const connection = this.connections.get(userId);
    if (connection) {
      connection.peer.destroy();
      this.connections.delete(userId);
    }
  }

  toggleAudio(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  toggleVideo(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    this.connections.forEach(connection => {
      connection.peer.destroy();
    });
    this.connections.clear();
  }
}
