## Project Structure

## Deployment

### Signaling Server (Render.com)
- Deploy server directory as a Node.js service
- Set PORT environment variable to 3001
- Enable CORS for frontend domain
- Automatic Deployment:
  - Webhook URL available at: /deploy/srv-[id]?key=[key]
  - Can be added to GitHub repository webhooks
  - Triggers new deployment when code is pushed

### Frontend (Vercel)
- Environment Variables:
  - VITE_SIGNALING_SERVER: URL of the signaling server (e.g., https://studymate-signaling.onrender.com)
  - Must use HTTPS URL in production
  - Must include full URL with protocol (https://)
  - Local development can use http://localhost:3001
  - After deploying signaling server:
    1. Add VITE_SIGNALING_SERVER env var in Vercel
    2. Enable for all environments (Production, Preview, Development)
    3. Redeploy after adding the environment variable
    4. Never use localhost in production environment variables
- Build Command: npm run build
- Output Directory: dist
- Node.js Version: >=18.0.0
- Build Settings:
  - Add .npmrc with legacy-peer-deps=true
  - Use engine-strict=true to enforce Node version
- After deploying signaling server:
  1. Add VITE_SIGNALING_SERVER env var in Vercel
  2. Enable for all environments (Production, Preview, Development)
  3. Redeploy after adding the environment variable
- Authentication:
  1. Go to project Settings > Authentication
  2. Disable "Require Authentication" to make site public
  3. This allows users to access without Vercel sign-in
- Redeploying Latest Changes:
  1. Dashboard Method (Recommended):
     - Go to project on vercel.com
     - Click "Deployments" tab
     - Click "Redeploy" on latest deployment
     - Choose "Use the same Build Cache" for faster builds
  2. CLI Method (Requires login):
     - Run: vercel deploy --prod

### Local Development
1. Copy .env.example to .env
2. Set VITE_SIGNALING_SERVER to local or deployed signaling server
3. Run server: cd server && npm start
4. Run frontend: npm run dev

```
src/
  components/     # React components
    ui/          # shadcn/ui components
    study-room/  # Study room specific components
      tools/     # Individual study tools
  lib/           # Utility functions and API clients
  types/         # TypeScript type definitions
  stories/       # Storybook stories
```

## Study Room Features

### Video Panel (60% width)
- Video chat interface
- Camera/microphone controls
- User information display
- Theme toggle
- Settings access

### Tools Panel (40% width)
1. Pomodoro Timer
   - Customizable intervals
   - Visual progress
   - Preset configurations

2. Spotify Integration
   - Web Playback SDK
   - Playlist management
   - Playback controls
   - Volume control

3. AI Tutor Chat
   - OpenAI integration
   - Chat interface
   - Study assistance
   - API key management

4. Collaborative Notes
   - Real-time collaboration
   - Rich text editing

## Authentication
- Spotify OAuth
- OpenAI API key management
- Supabase authentication (planned)

## Real-time Collaboration
For collaborative editing features:
- Use wss://y-websocket-eu.fly.dev for WebSocket connections (most reliable public Yjs WebSocket server)
- Each collaborative document should have a unique room name to prevent conflicts
- Add awareness information to help with debugging collaboration issues
- When using Yjs with WebSocket:
  - Set maxBackoffTime to reduce reconnection delay
  - Handle connection errors with retries
  - Keep room names short and simple
  - Monitor WebSocket connection state
  - Explicitly set WebSocketPolyfill to avoid polyfill issues
  - Use resyncInterval for better consistency
  - If public WebSocket servers are unreliable, use your own signaling server:
    1. Reuse existing signaling server for WebSocket connections
    2. Convert HTTP URL to WS/WSS (http->ws, https->wss)
    3. Ensure server supports WebSocket upgrade
    4. Keep room names short and simple
    5. Monitor WebSocket connection state
- When using Yjs with TipTap:
  - Disable history plugin as it's handled by Yjs
  - Set initial content through editor configuration, not collaboration options
  - Add reconnection logic for WebSocket disconnects
  - Handle connection-close events separately from status events
  - Keep awareness data minimal to avoid type errors
  - Set awareness state after provider creation, not in provider options
  - Only use the 'user' field in awareness state to avoid type errors

## State Management
- React Context for theme
- Local storage for preferences
- Real-time updates for collaboration

## Video Chat Implementation
- Room Sharing Options:
  - Random matching with tags
  - Direct room joining via ID
  - URL sharing with room parameter
  - Manual room ID copy/paste  - When testing WebRTC connections:
    - Check browser console for connection logs
    - Ensure both peers have camera/microphone permissions
    - Verify STUN/TURN servers are reachable
    - Both peers must be on HTTPS or localhost
    - Check NAT traversal by testing on different networks
    - When handling WebRTC streams:
      - Both peers must handle signal events in both directions
      - Remote stream must be played explicitly with .play()
      - Stream callbacks must be set before peer connection is established
      - Remote video element needs:
        - autoPlay and playsInline attributes
        - muted={false} to hear remote audio
        - Small delay when setting srcObject to ensure ref is mounted
      - When testing on different browsers:
        - Safari should initiate the connection
        - Both peers must handle signal events in both directions
        - Remote stream must be played explicitly with .play()
        - Handle autoplay restrictions:
          - Call play() after setting srcObject
          - Catch play() promise rejection
          - Provide fallback play button for browsers blocking autoplay
          - Check track states when receiving stream
        - When handling WebRTC connections:
          - Close existing connections before creating new ones
          - Add delay between signal operations
          - Check peer state before applying signals
          - Use sdpTransform to monitor SDP negotiation
          - Handle connection errors with retry logic
    - Check browser console for connection logs
    - Ensure both peers have camera/microphone permissions
    - Verify STUN/TURN servers are reachable
    - Both peers must be on HTTPS or localhost
    - Check NAT traversal by testing on different networks
  - Check browser console for connection logs
  - Ensure both peers have camera/microphone permissions
  - Verify STUN/TURN servers are reachable
  - Both peers must be on HTTPS or localhost
  - Check NAT traversal by testing on different networks
- Uses WebRTC via simple-peer library for peer-to-peer video calls
- Local media streams are cleaned up on component unmount
- Video/audio tracks can be individually toggled  - When using simple-peer with Vite:
    - Need to polyfill global with globalThis in vite.config.ts
    - Create SimplePeer instance directly without using call
    - Use type assertion for proper TypeScript support
    - Required Node.js polyfills:
      - stream-browserify
      - events
      - inherits
      - readable-stream
      - util (must be aliased as 'util' not 'util/')
      - process (must be aliased as 'process/browser')
    - In vite.config.ts:
      - Set define.global = 'globalThis'
      - Set define['process.env'] = process.env
      - Set define['process.nextTick'] = '(fn) => setTimeout(fn, 0)' // Must be valid JSON syntax
      - When using simple-peer with Vite:
        - Need to polyfill global with globalThis in vite.config.ts
        - Create SimplePeer instance directly without using call
        - Use type assertion for proper TypeScript support
        - Required Node.js polyfills:
          - stream-browserify
          - events
          - inherits
          - readable-stream
          - util (must be aliased as 'util' not 'util/')
          - process (must be aliased as 'process/browser')
        - In vite.config.ts:
          - Set define.global = 'globalThis'
          - Set define['process.env'] = process.env
          - Create a custom polyfill file for process.nextTick instead of using Vite's define
          - Import polyfills before any other imports in main entry point
          - Ensure polyfills are not tree-shaken by exporting and using a function
          - Define process.nextTick as a regular function, not an arrow function
          - Return the setTimeout call to match Node.js behavior
          - When using simple-peer with Vite:
            - Need to polyfill global with globalThis in vite.config.ts
            - Create SimplePeer instance directly without using call
            - Use type assertion for proper TypeScript support
            - Required Node.js polyfills:
              - stream-browserify
              - events
              - inherits
              - readable-stream
              - util (must be aliased as 'util' not 'util/')
              - process (must be aliased as 'process/browser')
            - In vite.config.ts:
              - Set define.global = 'globalThis'
              - Set define['process.env'] = process.env
              - Set define['process.nextTick'] = 'function(fn) { setTimeout(fn, 0); }'
              - Add all polyfills to resolve.alias
          - Add all polyfills to resolve.alias
      - Add all polyfills to resolve.alias
    - Required Node.js polyfills:
      - stream-browserify
      - events
      - inherits
      - readable-stream
      - util (must be aliased as 'util' not 'util/')
- Random matching system similar to Omegle requires:
  - Signaling server for WebRTC handshake
  - Socket.io for real-time communication
  - Peer connection management for video streams
- Requirements for WebRTC:
  - HTTPS or localhost for getUserMedia API
  - Browser support for MediaDevices API (Chrome, Firefox, Safari, Edge supported)
  - Camera and microphone permissions
  - When testing on different devices:
    - Must use HTTPS (not IP addresses)
    - Configure Vite with https: true and host: true
    - Accept self-signed certificates in development
    - For local development:
      - Use localhost instead of IP address
      - Access via http://localhost:5173
      - WebRTC will work on localhost without HTTPS
      - When testing on different devices:
        - Must use HTTPS (not IP addresses)
        - Configure Vite with https: true and host: true
        - Accept self-signed certificates in development
  - STUN/TURN servers for NAT traversal
  - Polyfills needed for older browsers (webkitGetUserMedia, mozGetUserMedia)
  - Must check for secure context and browser compatibility before accessing media devices
  - When handling WebRTC streams:
    - Both peers must handle signal events in both directions
    - Remote stream must be played explicitly with .play()
    - Stream callbacks must be set before peer connection is established
    - Remote video element needs:
      - autoPlay and playsInline attributes
      - muted={false} to hear remote audio
      - Small delay when setting srcObject to ensure ref is mounted
      - Both peers must handle signal events in both directions
      - Remote stream must be played explicitly with .play()
      - Stream callbacks must be set before peer connection is established
      - Remote video element needs:
        - autoPlay and playsInline attributes
        - muted={false} to hear remote audio
        - Small delay when setting srcObject to ensure ref is mounted
      - Both peers must handle signal events in both directions
      - Remote stream must be played explicitly with .play()
      - Stream callbacks must be set before peer connection is established
      - Remote video element needs:
        - autoPlay and playsInline attributes
        - muted={false} to hear remote audio
        - Small delay when setting srcObject to ensure ref is mounted
      - When testing on different browsers:
        - Safari should initiate the connection
        - Both peers must handle signal events in both directions
        - Remote stream must be played explicitly with .play()
        - Handle autoplay restrictions:
          - Call play() after setting srcObject
          - Catch play() promise rejection
          - Provide fallback play button for browsers blocking autoplay
          - Check track states when receiving stream
