import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { WebRTCManager } from './webrtc';

export class SignalingService {
  private socket: Socket;
  private webrtcManager: WebRTCManager;
  private onPeerConnectedCallback?: () => void;
  private onPeerDisconnectedCallback?: () => void;

  constructor(webrtcManager: WebRTCManager) {
    this.webrtcManager = webrtcManager;
    
    const SIGNALING_SERVER = import.meta.env.VITE_SIGNALING_SERVER || 
      (window.location.hostname === 'localhost' ? 'http://localhost:3002' : 'https://studymate-signaling.onrender.com');
    
    this.socket = io(SIGNALING_SERVER, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    this.socket.on('connect', () => console.log('Connected to signaling server'));
    this.socket.on('disconnect', () => console.log('Disconnected from signaling server'));
    this.socket.on('connect_error', (error) => console.error('Connection error:', error));

    this.socket.on('matched', async (peerId: string) => {
      try {
        const peer = await this.webrtcManager.initializePeer(peerId, true);
        peer.on('signal', (signal) => {
          this.socket.emit('signal', { peerId, signal });
        });
        peer.on('connect', () => {
          if (this.onPeerConnectedCallback) {
            this.onPeerConnectedCallback();
          }
        });
      } catch (error) {
        console.error('Failed to initialize peer:', error);
      }
    });

    this.socket.on('signal', async ({ peerId, signal }) => {
      try {
        let connection = this.webrtcManager.getConnection(peerId);
        if (!connection) {
          const peer = await this.webrtcManager.initializePeer(peerId, false);
          peer.on('signal', (signal) => {
            this.socket.emit('signal', { peerId, signal });
          });
          peer.on('connect', () => {
            if (this.onPeerConnectedCallback) {
              this.onPeerConnectedCallback();
            }
          });
        }
        this.webrtcManager.handleSignal(peerId, signal);
      } catch (error) {
        console.error('Failed to handle signal:', error);
      }
    });

    this.socket.on('peer-left', (peerId: string) => {
      this.webrtcManager.closeConnection(peerId);
      if (this.onPeerDisconnectedCallback) {
        this.onPeerDisconnectedCallback();
      }
    });
  }

  public findMatch(tags: string[]) {
    this.socket.emit('find-match', { tags });
  }

  public skipPeer(tags: string[]) {
    this.socket.emit('skip', { tags });
  }

  public disconnect() {
    this.socket.disconnect();
  }

  public onPeerConnected(callback: () => void) {
    this.onPeerConnectedCallback = callback;
  }

  public onPeerDisconnected(callback: () => void) {
    this.onPeerDisconnectedCallback = callback;
  }
}
