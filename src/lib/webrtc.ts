import SimplePeer from 'simple-peer';

interface PeerConnection {
  peer: SimplePeer.Instance;
  stream: MediaStream;
}

type StreamCallback = (stream: MediaStream) => void;

export class WebRTCManager {
  private connections: Map<string, PeerConnection> = new Map();
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
          height: { ideal: 720 }
        },
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

  async initializePeer(userId: string, initiator: boolean = false): Promise<SimplePeer.Instance> {
    try {
      const stream = await this.getLocalStream();
      
      console.log('Creating peer with stream:', stream.id, 'as initiator:', initiator);
      
      // Create SimplePeer instance directly without using call
      const peer = new SimplePeer({
        initiator,
        stream,
        trickle: false,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      }) as SimplePeer.Instance;

      peer.on('stream', (remoteStream: MediaStream) => {
        console.log('Received remote stream from peer:', remoteStream.id);
        console.log('Stream tracks:', remoteStream.getTracks().map(t => ({
          kind: t.kind,
          enabled: t.enabled,
          muted: t.muted,
          readyState: t.readyState
        })));
        
        if (this.onStreamCallback) {
          console.log('Calling stream callback with remote stream');
          this.onStreamCallback(remoteStream);
        } else {
          console.warn('No stream callback registered');
        }
      });

      peer.on('error', (err) => {
        console.error('Peer connection error:', err);
      });

      peer.on('connect', () => {
        console.log('Peer connection established');
      });

      peer.on('close', () => {
        console.log('Peer connection closed');
      });

      peer.on('signal', (data) => {
        console.log('Generated signal data:', data.type);
      });

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

  handleSignal(userId: string, signal: SimplePeer.SignalData) {
    const connection = this.connections.get(userId);
    if (connection) {
      console.log('Handling signal for peer:', userId, 'signal type:', signal.type);
      connection.peer.signal(signal);
    } else {
      console.error('No peer connection found for:', userId);
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
