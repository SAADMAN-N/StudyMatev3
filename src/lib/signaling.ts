import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { WebRTCManager } from './webrtc';
import { toast } from '@/components/ui/use-toast';

export class SignalingService {
  private socket: Socket;
  private webrtcManager: WebRTCManager;
  private onPeerConnectedCallback?: () => void;
  private onPeerDisconnectedCallback?: () => void;
  private joinTimeoutId?: NodeJS.Timeout;

  constructor(webrtcManager: WebRTCManager) {
    this.webrtcManager = webrtcManager;
    
    // In production, force HTTPS
    const SIGNALING_SERVER = import.meta.env.VITE_SIGNALING_SERVER || 
      (window.location.hostname === 'localhost' ? 'http://localhost:3002' : 'https://studymate-signaling.onrender.com');
    
    console.log('Connecting to signaling server:', SIGNALING_SERVER);
    console.log('Environment:', import.meta.env.MODE);
    console.log('VITE_SIGNALING_SERVER:', import.meta.env.VITE_SIGNALING_SERVER);

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
      toast({
        title: "Connected",
        description: "Successfully connected to signaling server",
        variant: "default",
      });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Failed to connect to signaling server:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to signaling server. Please check your internet connection.",
        variant: "destructive",
        duration: 5000,
      });
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from signaling server');
      toast({
        title: "Disconnected",
        description: "Lost connection to signaling server",
        variant: "destructive",
        duration: 5000,
      });
    });

    this.socket.on('matched', async (peerId: string) => {
      console.log('Matched with peer:', peerId);
      console.log('Local socket ID:', this.socket.id);
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

    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log('Reconnected to signaling server after', attemptNumber, 'attempts');
      toast({
        title: "Reconnected",
        description: "Connection to signaling server restored",
        variant: "default",
      });
    });
  }

  public findMatch(tags: string[]) {
    console.log('Looking for a match with tags:', tags);
    console.log('Current socket ID:', this.socket.id);
    console.log('Socket connection status:', this.socket.connected);
    this.socket.emit('find-match', { tags });
  }

  public joinRoom(roomId: string) {
    console.log('Joining room:', roomId);
    console.log('Current socket ID:', this.socket.id);
    console.log('Socket connection status:', this.socket.connected);
    
    // Clear any existing timeouts
    if (this.joinTimeoutId) {
      clearTimeout(this.joinTimeoutId);
    }
    
    // Reset connection state
    const existingConnection = this.webrtcManager.getConnection(roomId);
    if (existingConnection) {
      this.webrtcManager.closeConnection(roomId);
    }
    
    this.socket.emit('join-room', { roomId });
    
    // Add error handler for room joining
    const errorHandler = (error: any) => {
      console.error('Failed to join room:', error);
      toast({
        title: "Connection Error",
        description: error.message || "Failed to join room",
        variant: "destructive",
      });
    };
    
    this.socket.once('error', errorHandler);
    
    // Add timeout to detect if connection is taking too long
    this.joinTimeoutId = setTimeout(() => {
      const connection = this.webrtcManager.getConnection(roomId);
      if (!connection) {
        console.error('Connection timeout - no peer connection established');
        toast({
          title: "Connection Timeout",
          description: "Failed to establish connection. Please try again.",
          variant: "destructive",
        });
        // Clean up the error handler
        this.socket.off('error', errorHandler);
        // Close any partial connections
        this.webrtcManager.closeConnection(roomId);
      }
    }, 15000); // 15 second timeout
  }

  public skipPeer(tags: string[]) {
    console.log('Skipping current peer with tags:', tags);
    this.socket.emit('skip', { tags });
  }

  public disconnect() {
    console.log('Disconnecting from signaling server...');
    if (this.joinTimeoutId) {
      clearTimeout(this.joinTimeoutId);
    }
    this.socket.disconnect();
  }

  public onPeerConnected(callback: () => void) {
    this.onPeerConnectedCallback = callback;
  }

  public onPeerDisconnected(callback: () => void) {
    this.onPeerDisconnectedCallback = callback;
  }
}
