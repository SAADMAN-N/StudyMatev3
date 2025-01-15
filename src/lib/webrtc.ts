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
  private localStream: MediaStream | null = null;
  private onStreamCallback?: StreamCallback;

  async getLocalStream(): Promise<MediaStream> {
    if (this.localStream) return this.localStream;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      this.localStream = stream;
      return stream;
    } catch (error) {
      console.error('Failed to get local stream:', error);
      throw error;
    }
  }

  onStream(callback: StreamCallback) {
    this.onStreamCallback = callback;
  }

  async initializePeer(userId: string, initiator: boolean, retryCount = 0): Promise<SimplePeer.Instance> {
    // Always clean up existing connection first
    this.closeConnection(userId);

    try {
      const stream = await this.getLocalStream();
      
      if (retryCount >= 3) {
        throw new Error('Max retry attempts reached');
      }

      console.log(`Initializing peer (attempt ${retryCount + 1}/3):`, { userId, initiator });
      
      const peer = new SimplePeer({
        initiator,
        stream,
        trickle: false, // Disable trickle ICE for simpler signaling
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
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

      peer.on('error', async (err) => {
        console.error('Peer error:', err);
        if (err.message.includes('setLocalDescription') || err.message.includes('setRemoteDescription')) {
          if (retryCount < 3) {
            console.log('Retrying peer connection...');
            await this.initializePeer(userId, initiator, retryCount + 1);
          }
        }
      });

      // Connection events
      peer.on('connect', () => {
        console.log('Peer connected successfully');
      });

      peer.on('close', () => {
        console.log('Peer connection closed');
        this.closeConnection(userId);
      });

      // Store the connection
      this.connections.set(userId, { peer, stream });
      return peer;
    } catch (error) {
      console.error('Failed to initialize peer:', error);
      throw error;
    }
  }

  async handleSignal(userId: string, signal: SimplePeer.SignalData) {
    try {
      const connection = this.connections.get(userId);
      if (!connection) {
        // Only create new connection for offer signals
        if (signal.type === 'offer') {
          console.log('Creating new peer for offer');
          await this.initializePeer(userId, false);
          const newConnection = this.connections.get(userId);
          if (newConnection) {
            newConnection.peer.signal(signal);
          }
        }
        return;
      }

      // Get the RTCPeerConnection instance
      const pc = (connection.peer as any).pc;
      if (pc) {
        const signalingState = pc.signalingState;
        console.log('Current signaling state:', signalingState);

        // Handle different signal types based on current state
        if (signal.type === 'offer') {
          if (signalingState !== 'stable') {
            console.log('Handling offer in non-stable state');
            await pc.setLocalDescription({type: 'rollback'});
          }
        } else if (signal.type === 'answer') {
          if (signalingState !== 'have-local-offer') {
            console.log('Ignoring answer in wrong state:', signalingState);
            return;
          }
        }
      }

      // Apply the signal
      connection.peer.signal(signal);
    } catch (error) {
      console.error('Error handling signal:', error);
    }
  }

  getConnection(userId: string): PeerConnection | undefined {
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
