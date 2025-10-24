import { EventEmitter } from 'events';
import { rustPlusService, RustPlusServer, ServerInfo, TeamInfo } from './RustPlusService';
import { notificationService } from './NotificationService';
import { entityService } from './EntityService';
import { v4 as uuidv4 } from 'uuid';

export interface ServerConnection extends RustPlusServer {
  serverInfo?: ServerInfo;
  teamInfo?: TeamInfo;
  lastConnected?: Date;
  connectionAttempts: number;
  autoReconnect: boolean;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
}

export interface ServerStats {
  totalConnections: number;
  totalUptime: number;
  lastSeen: Date;
  averageLatency?: number;
}

export class ServerService extends EventEmitter {
  private servers: Map<string, ServerConnection> = new Map();
  private currentServer: ServerConnection | null = null;
  private connectionHistory: Array<{ serverId: string; timestamp: Date; action: 'connect' | 'disconnect' }> = [];

  constructor() {
    super();
    this.loadServers();
    this.setupRustPlusListeners();
  }

  /**
   * Add a new server
   */
  addServer(
    name: string,
    ip: string,
    port: number,
    playerId: string,
    playerToken: string,
    autoReconnect = true
  ): ServerConnection {
    // Check if server already exists
    const existingServer = this.findServerByConnection(ip, port, playerId);
    if (existingServer) {
      throw new Error('Server with this connection already exists');
    }

    const server: ServerConnection = {
      id: uuidv4(),
      name,
      ip,
      port,
      playerId,
      playerToken,
      isConnected: false,
      connectionAttempts: 0,
      autoReconnect,
      status: 'disconnected'
    };

    this.servers.set(server.id, server);
    this.saveServers();
    this.emit('serverAdded', server);

    notificationService.showSuccess(
      'Server Added',
      `Server "${name}" has been added to your list`
    );

    return server;
  }

  /**
   * Remove a server
   */
  async removeServer(serverId: string): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error('Server not found');
    }

    // Disconnect if currently connected
    if (server.isConnected && this.currentServer?.id === serverId) {
      await this.disconnectFromServer();
    }

    // Clear entities for this server
    entityService.clearEntitiesForServer(serverId);

    this.servers.delete(serverId);
    this.saveServers();
    this.emit('serverRemoved', server);

    notificationService.showInfo(
      'Server Removed',
      `Server "${server.name}" has been removed`
    );
  }

  /**
   * Update server information
   */
  updateServer(serverId: string, updates: Partial<ServerConnection>): void {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error('Server not found');
    }

    const updatedServer = { ...server, ...updates };
    this.servers.set(serverId, updatedServer);
    this.saveServers();
    this.emit('serverUpdated', updatedServer);
  }

  /**
   * Get all servers
   */
  getServers(): ServerConnection[] {
    return Array.from(this.servers.values());
  }

  /**
   * Get server by ID
   */
  getServer(serverId: string): ServerConnection | undefined {
    return this.servers.get(serverId);
  }

  /**
   * Get currently connected server
   */
  getCurrentServer(): ServerConnection | null {
    return this.currentServer;
  }

  /**
   * Connect to a server
   */
  async connectToServer(serverId: string): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error('Server not found');
    }

    // Disconnect from current server if connected
    if (this.currentServer && this.currentServer.isConnected) {
      await this.disconnectFromServer();
    }

    try {
      server.status = 'connecting';
      server.connectionAttempts++;
      this.updateServer(serverId, { status: 'connecting', connectionAttempts: server.connectionAttempts });

      await rustPlusService.connect(server);
      
      server.status = 'connected';
      server.isConnected = true;
      server.lastConnected = new Date();
      this.currentServer = server;
      
      this.updateServer(serverId, {
        status: 'connected',
        isConnected: true,
        lastConnected: new Date()
      });

      // Add to connection history
      this.connectionHistory.unshift({
        serverId,
        timestamp: new Date(),
        action: 'connect'
      });

      // Fetch server info
      this.fetchServerInfo();

      notificationService.showConnectionStatus('connected', server.name);
      this.emit('serverConnected', server);

    } catch (error) {
      server.status = 'error';
      server.isConnected = false;
      this.updateServer(serverId, { status: 'error', isConnected: false });

      notificationService.showConnectionStatus('error', server.name);
      this.emit('serverConnectionFailed', server, error);
      throw error;
    }
  }

  /**
   * Disconnect from current server
   */
  async disconnectFromServer(): Promise<void> {
    if (!this.currentServer) {
      return;
    }

    const server = this.currentServer;
    
    try {
      rustPlusService.disconnect();
      
      server.status = 'disconnected';
      server.isConnected = false;
      this.updateServer(server.id, { status: 'disconnected', isConnected: false });

      // Add to connection history
      this.connectionHistory.unshift({
        serverId: server.id,
        timestamp: new Date(),
        action: 'disconnect'
      });

      notificationService.showConnectionStatus('disconnected', server.name);
      this.emit('serverDisconnected', server);
      
      this.currentServer = null;

    } catch (error) {
      console.error('Error disconnecting from server:', error);
    }
  }

  /**
   * Test server connection
   */
  async testServerConnection(serverId: string): Promise<boolean> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error('Server not found');
    }

    try {
      // Create a temporary connection to test
      const testService = new (rustPlusService.constructor as any)();
      await testService.connect(server);
      
      // Try to get server info
      await testService.getServerInfo();
      
      testService.disconnect();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get server connection history
   */
  getConnectionHistory(): Array<{ serverId: string; timestamp: Date; action: 'connect' | 'disconnect' }> {
    return [...this.connectionHistory];
  }

  /**
   * Get server statistics
   */
  getServerStats(serverId: string): ServerStats | null {
    const server = this.servers.get(serverId);
    if (!server) {
      return null;
    }

    const connections = this.connectionHistory.filter(h => h.serverId === serverId);
    const connectEvents = connections.filter(h => h.action === 'connect');
    
    return {
      totalConnections: connectEvents.length,
      totalUptime: this.calculateTotalUptime(serverId),
      lastSeen: server.lastConnected || new Date(0),
      averageLatency: undefined // TODO: Implement latency tracking
    };
  }

  /**
   * Refresh server information
   */
  async refreshServerInfo(): Promise<void> {
    if (!this.currentServer || !this.currentServer.isConnected) {
      throw new Error('No server connected');
    }

    await this.fetchServerInfo();
  }

  /**
   * Get team information
   */
  async getTeamInfo(): Promise<TeamInfo> {
    if (!this.currentServer || !this.currentServer.isConnected) {
      throw new Error('No server connected');
    }

    try {
      const teamInfo = await rustPlusService.getTeamInfo();
      this.currentServer.teamInfo = teamInfo;
      this.updateServer(this.currentServer.id, { teamInfo });
      return teamInfo;
    } catch (error) {
      throw new Error(`Failed to get team info: ${error}`);
    }
  }

  /**
   * Send team message
   */
  async sendTeamMessage(message: string): Promise<void> {
    if (!this.currentServer || !this.currentServer.isConnected) {
      throw new Error('No server connected');
    }

    try {
      await rustPlusService.sendTeamMessage(message);
      notificationService.showSuccess('Message Sent', 'Team message sent successfully');
    } catch (error) {
      notificationService.showError('Message Failed', `Failed to send message: ${error}`);
      throw error;
    }
  }

  /**
   * Find server by connection details
   */
  private findServerByConnection(ip: string, port: number, playerId: string): ServerConnection | undefined {
    return Array.from(this.servers.values()).find(
      server => server.ip === ip && server.port === port && server.playerId === playerId
    );
  }

  /**
   * Setup Rust+ service listeners
   */
  private setupRustPlusListeners(): void {
    rustPlusService.on('connected', (server: RustPlusServer) => {
      // Server connection established
    });

    rustPlusService.on('disconnected', (server: RustPlusServer) => {
      if (this.currentServer) {
        this.currentServer.status = 'disconnected';
        this.currentServer.isConnected = false;
        this.updateServer(this.currentServer.id, {
          status: 'disconnected',
          isConnected: false
        });
      }
    });

    rustPlusService.on('error', (error: Error) => {
      if (this.currentServer) {
        this.currentServer.status = 'error';
        this.updateServer(this.currentServer.id, { status: 'error' });
      }
    });

    rustPlusService.on('teamMessage', (message: any) => {
      notificationService.showTeamMessage(
        message.name || 'Unknown',
        message.message,
        message.steamId?.toString()
      );
    });

    rustPlusService.on('serverInfoUpdated', (serverInfo: ServerInfo) => {
      if (this.currentServer) {
        this.currentServer.serverInfo = serverInfo;
        this.updateServer(this.currentServer.id, { serverInfo });
        this.emit('serverInfoUpdated', this.currentServer, serverInfo);
      }
    });
  }

  /**
   * Fetch server information
   */
  private async fetchServerInfo(): Promise<void> {
    if (!this.currentServer) return;

    try {
      const serverInfo = await rustPlusService.getServerInfo();
      this.currentServer.serverInfo = serverInfo;
      this.updateServer(this.currentServer.id, { serverInfo });
      this.emit('serverInfoUpdated', this.currentServer, serverInfo);
    } catch (error) {
      console.error('Failed to fetch server info:', error);
    }
  }

  /**
   * Calculate total uptime for a server
   */
  private calculateTotalUptime(serverId: string): number {
    const connections = this.connectionHistory.filter(h => h.serverId === serverId);
    let totalUptime = 0;
    let lastConnect: Date | null = null;

    // Sort by timestamp (newest first)
    connections.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    for (const event of connections) {
      if (event.action === 'connect') {
        lastConnect = event.timestamp;
      } else if (event.action === 'disconnect' && lastConnect) {
        totalUptime += event.timestamp.getTime() - lastConnect.getTime();
        lastConnect = null;
      }
    }

    // If still connected, add current session time
    if (lastConnect && this.currentServer?.id === serverId && this.currentServer.isConnected) {
      totalUptime += Date.now() - lastConnect.getTime();
    }

    return totalUptime;
  }

  /**
   * Load servers from localStorage
   */
  private loadServers(): void {
    try {
      const saved = localStorage.getItem('rustlink-servers');
      if (saved) {
        const servers = JSON.parse(saved) as ServerConnection[];
        servers.forEach(server => {
          // Convert date strings back to Date objects
          if (server.lastConnected) {
            server.lastConnected = new Date(server.lastConnected);
          }
          // Ensure server is marked as disconnected on load
          server.isConnected = false;
          server.status = 'disconnected';
          this.servers.set(server.id, server);
        });
      }

      // Load connection history
      const historyData = localStorage.getItem('rustlink-connection-history');
      if (historyData) {
        this.connectionHistory = JSON.parse(historyData).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load servers:', error);
    }
  }

  /**
   * Save servers to localStorage
   */
  private saveServers(): void {
    try {
      const servers = Array.from(this.servers.values());
      localStorage.setItem('rustlink-servers', JSON.stringify(servers));
      
      // Save connection history (keep only last 100 entries)
      const recentHistory = this.connectionHistory.slice(0, 100);
      localStorage.setItem('rustlink-connection-history', JSON.stringify(recentHistory));
    } catch (error) {
      console.error('Failed to save servers:', error);
    }
  }
}

// Export singleton instance
export const serverService = new ServerService();