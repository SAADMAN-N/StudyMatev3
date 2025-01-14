import { io, Socket } from 'socket.io-client';
import { WebRTCManager } from './webrtc';
import { toast } from '@/components/ui/use-toast';

export class SignalingService {
  private socket: Socket;
  private webrtcManager: WebRTCManager;
  private onPeerConnectedCallback?: () => void;
  private onPeerDisconnectedCallback?: () => void;

  constructor(webrtcManager: WebRTCManager) {
    this.webrtcManager = webrtcManager;
    console.log('Connecting to signaling server...');
    const SIGNALING_SERVER = import.meta.env.VITE_SIGNALING_SERVER || 'http://localhost:3001';
    this.socket = io(SIGNALING_SERVER, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to signaling server with ID:', this.socket.id);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Failed to connect to signaling server:', error);
    });

    this.socket.on('matched', async (peerId: string) => {
      console.log('Matched with peer:', peerId);
      try {
        // Initialize peer with correct initiator flag
        const peer = await this.webrtcManager.initializePeer(peerId, true);
        
        peer.on('signal', (signal) => {
          console.log('Sending signal to peer:', peerId, 'signal type:', signal.type);
          this.socket.emit('signal', { peerId, signal });
        });

        peer.on('error', (err) => {
          console.error('WebRTC peer error:', err);
        });

        peer.on('connect', () => {
          console.log('Direct peer connection established with:', peerId);
          this.onPeerConnectedCallback?.();
        });

      } catch (error) {
        console.error('Failed to initialize peer:', error);
      }
    });

    this.socket.on('signal', async ({ peerId, signal }) => {
      console.log('Received signal from peer:', peerId, 'signal type:', signal.type);
      try {
        // If we don't have a peer instance yet, create one as non-initiator
        let connection = this.webrtcManager.getConnection(peerId);
        if (!connection) {
          console.log('Creating new peer as receiver for:', peerId);
          const peer = await this.webrtcManager.initializePeer(peerId, false);
          
          peer.on('signal', (signal) => {
            console.log('Sending signal back to peer:', peerId, 'signal type:', signal.type);
            this.socket.emit('signal', { peerId, signal });
          });

          peer.on('connect', () => {
            console.log('Direct peer connection established with:', peerId);
            this.onPeerConnectedCallback?.();
          });
        }
        
        await this.webrtcManager.handleSignal(peerId, signal);
      } catch (error) {
        console.error('Failed to handle signal:', error);
      }
    });

    this.socket.on('peer-left', (peerId: string) => {
      console.log('Peer left:', peerId);
      this.webrtcManager.closeConnection(peerId);
      this.onPeerDisconnectedCallback?.();
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from signaling server');
    });
  }

  public findMatch(tags: string[], roomId: string) {
    console.log('Looking for a match with tags:', tags, 'roomId:', roomId);
    this.socket.emit('find-match', { tags, roomId });
  }

  public joinRoom(roomId: string) {
    console.log('Joining room:', roomId);
    this.socket.emit('join-room', { roomId });
    
    // Add error handler for room joining
    this.socket.once('error', (error) => {
      console.error('Failed to join room:', error);
      toast({
        title: "Connection Error",
        description: error.message,
        variant: "destructive",
      });
    });

    // Add timeout to detect if connection is taking too long
    setTimeout(() => {
      const connection = this.webrtcManager.getConnection(roomId);
      if (!connection) {
        console.error('Connection timeout - no peer connection established');
        toast({
          title: "Connection Timeout",
          description: "Failed to establish connection. Please try again.",
          variant: "destructive",
        });
      }
    }, 10000); // 10 second timeout
  }

  public skipPeer(tags: string[]) {
    console.log('Skipping current peer with tags:', tags);
    this.socket.emit('skip', { tags });
  }

  public disconnect() {
    console.log('Disconnecting from signaling server...');
    this.socket.disconnect();
  }

  public onPeerConnected(callback: () => void) {
    this.onPeerConnectedCallback = callback;
  }

  public onPeerDisconnected(callback: () => void) {
    this.onPeerDisconnectedCallback = callback;
  }
}
