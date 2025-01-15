import SimplePeer from 'simple-peer';

export interface PeerConnection {
  peer: SimplePeer.Instance;
  stream: MediaStream;
}

type StreamCallback = (stream: MediaStream) => void;

export class WebRTCManager {
  private connections = new Map<string, PeerConnection>();
  private localStream: MediaStream | null = null;
  private onStreamCallback?: StreamCallback;

  async getLocalStream(): Promise<MediaStream> {
    if (this.localStream) return this.localStream;
    
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      return this.localStream;
    } catch (error) {
      console.error('Failed to get local stream:', error);
      throw error;
    }
  }

  onStream(callback: StreamCallback) {
    this.onStreamCallback = callback;
  }

  async initializePeer(userId: string, initiator: boolean): Promise<SimplePeer.Instance> {
    // Always clean up existing connection first
    this.closeConnection(userId);

    try {
      const stream = await this.getLocalStream();
      
      const peer = new SimplePeer({
        initiator,
        stream,
        trickle: true,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
          ]
        }
      });

      // Handle remote stream
      peer.on('stream', (remoteStream: MediaStream) => {
        console.log('Received remote stream');
        if (this.onStreamCallback) {
          this.onStreamCallback(remoteStream);
        }
      });

      peer.on('error', (err) => {
        console.error('Peer error:', err);
      });

      peer.on('connect', () => {
        console.log('Peer connected successfully');
      });

      peer.on('close', () => {
        console.log('Peer connection closed');
      });

      this.connections.set(userId, { peer, stream });
      return peer;
    } catch (error) {
      console.error('Failed to initialize peer:', error);
      throw error;
    }
  }

  handleSignal(userId: string, signal: SimplePeer.SignalData) {
    const connection = this.connections.get(userId);
    if (connection) {
      connection.peer.signal(signal);
    }
  }

  getConnection(userId: string) {
    return this.connections.get(userId);
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
