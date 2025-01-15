import SimplePeer from 'simple-peer';

interface PeerConnection {
  peer: SimplePeer.Instance;
  stream: MediaStream;
}

type StreamCallback = (stream: MediaStream) => void;

export class WebRTCManager {
  public connections: Map<string, PeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private onStreamCallback?: StreamCallback;

  async getLocalStream(): Promise<MediaStream> {
    if (this.localStream) return this.localStream;
    
    try {
      // Ensure we're in a secure context
      if (!window.isSecureContext) {
        throw new Error('WebRTC requires a secure context (HTTPS or localhost)');
      }

      // Check if mediaDevices is supported
      if (!navigator.mediaDevices) {
        throw new Error('getUserMedia is not implemented in this browser');
      }

      // Modern browsers
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });
      
      // Log stream information
      console.log('Local stream obtained:', {
        id: this.localStream.id,
        tracks: this.localStream.getTracks().map(track => ({
          kind: track.kind,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState
        }))
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

  async initializePeer(userId: string, initiator: boolean = false): Promise<SimplePeer.Instance> {
    // Always clean up existing connection first
    this.closeConnection(userId);

    try {
      const stream = await this.getLocalStream();
      console.log('Creating peer with stream:', stream.id, 'as initiator:', initiator);
      
      const peer = new SimplePeer({
        initiator,
        stream,
        trickle: false, // Disable trickle ICE for simpler signaling
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }, // Use just one STUN server for simplicity
          ]
        }
      }) as SimplePeer.Instance;

      // Simplified event handlers
      peer.on('stream', (remoteStream: MediaStream) => {
        console.log('Received remote stream');
        if (this.onStreamCallback) {
          this.onStreamCallback(remoteStream);
        }
      });

      peer.on('error', (err) => console.error('Peer error:', err));
      peer.on('connect', () => console.log('Peer connected'));
      peer.on('close', () => console.log('Peer closed'));
      peer.on('signal', (data) => console.log('Signal:', data.type));

      this.connections.set(userId, { peer, stream });
      return peer;
    } catch (error) {
      console.error('Failed to initialize peer:', error);
      throw error;
    }
  }

  getConnection(userId: string) {
    return this.connections.get(userId);
  }

  async handleSignal(userId: string, signal: SimplePeer.SignalData) {
    try {
      let connection = this.connections.get(userId);
      
      // If receiving an offer and no connection exists, create one
      if (!connection && signal.type === 'offer') {
        await this.initializePeer(userId, false);
        connection = this.connections.get(userId);
      }

      if (!connection) {
        console.error('No peer connection found for:', userId);
        return;
      }

      // Simple signal handling without complex state management
      connection.peer.signal(signal);
    } catch (error) {
      console.error('Failed to handle signal:', error);
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
