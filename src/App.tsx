import React, { useState, useEffect } from 'react';
import { useAppStore } from './stores/appStore';
import { rustPlusService } from './services/RustPlusService';
import ConnectRustPlus from './components/ConnectRustPlus';
import NotificationCenter from './components/NotificationCenter';
import NotificationContainer from './components/NotificationContainer';
// import NotificationTester from './components/NotificationTester';
import SteamAvatar from './components/SteamAvatar';
import ServerMenuSheet from './components/ServerMenuSheet';
import AddServerModal from './components/modals/AddServerModal';
import AboutModal from './components/modals/AboutModal';
import LogoutModal from './components/modals/LogoutModal';
import DeviceControlModal from './components/modals/DeviceControlModal';
import PairServerModal from './components/modals/PairServerModal';
import EntityPairingModal from './components/modals/EntityPairingModal';
import { notificationService } from './services/NotificationService';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Toaster } from './components/ui/toaster';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from './components/ui/dialog';
import { 
  Info, 
  LogOut, 
  Settings, 
  Zap, 
  MessageSquare, 
  Map, 
  Server,
  Heart,
  Menu
} from 'lucide-react';

function App() {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  
  const {
    isRustPlusConnected,
    steamId,
    selectedServer,
    entities,
    setModalState,
    logout,
    fcmStatus,
    expoStatus,
    companionPushStatus,
    fcmStatusMessage,
    expoStatusMessage,
    companionPushStatusMessage,
    isShowingAddServerModal,
    isShowingAboutModal,
    isShowingLogoutModal,
    isShowingDeviceControlModal,
    isShowingPairServerModal,
    isShowingEntityPairingModal,
    initializeServices,
  } = useAppStore();

  // Initialize services on app start
  useEffect(() => {
    console.log('App: Initializing services...');
    
    // Initialize all services first (this sets up event listeners)
    initializeServices();
    
    // Then check RustPlusService status and update state accordingly
    console.log('App: Checking RustPlusService status...');
    const isReady = rustPlusService.isReady();
    console.log('App: RustPlusService ready status:', isReady);
    
    // Manually update the state if RustPlusService is already ready
    if (isReady) {
      console.log('App: RustPlusService is ready, updating state...');
      // Use the store's set function directly since there's no setCompanionPushStatus method
      useAppStore.setState({
        companionPushStatus: 'ready',
        companionPushStatusMessage: 'Ready'
      });
    }

    // Listen for pairing notifications to auto-show modals
    const handleNotificationAdded = (notification: any) => {
      console.log('App: Notification added:', notification);
      
      if (notification.type === 'server_pairing') {
        console.log('App: Auto-showing server pairing modal');
        setModalState('PairServer', true);
      } else if (notification.type === 'entity_pairing') {
        console.log('App: Auto-showing entity pairing modal');
        setModalState('EntityPairing', true);
      }
    };

    // Subscribe to notification events
    notificationService.on('notificationAdded', handleNotificationAdded);

    // Cleanup function
    return () => {
      notificationService.off('notificationAdded', handleNotificationAdded);
    };
  }, [initializeServices, setModalState]);

  // Initialize authentication and load saved data
  useEffect(() => {
    // Check if user is already authenticated
    const storedSteamId = localStorage.getItem('steamId');
    const storedToken = localStorage.getItem('rustplusToken');
    
    if (storedSteamId && storedToken) {
      console.log('App: Found stored authentication, restoring session...');
      // We need to get the store instance to call setAuthentication
      const { setAuthentication } = useAppStore.getState();
      setAuthentication(storedSteamId, storedToken);
    }
    
    // Load saved servers
    const savedServers = localStorage.getItem('servers');
    if (savedServers) {
      try {
        const servers = JSON.parse(savedServers);
        console.log('App: Loading saved servers:', servers.length);
        const { addServer } = useAppStore.getState();
        servers.forEach((server: any) => addServer(server));
      } catch (error) {
        console.error('App: Failed to load saved servers:', error);
      }
    }
  }, []);

  // Show connection screen if not authenticated
  if (!isRustPlusConnected || !steamId) {
    return <ConnectRustPlus />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return '●';
      case 'error':
        return '⚠';
      default:
        return '○';
    }
  };

  const handleLogout = () => {
    logout();
    setShowLogoutDialog(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <ServerMenuSheet>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-gray-700/50"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </ServerMenuSheet>
          
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold">RustLink</h1>
            <p className="text-xs text-gray-400">Rust+ Companion</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <NotificationCenter />
          
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            onClick={() => setModalState('About', true)}
          >
            <Info className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center space-x-3">
            <SteamAvatar 
              steamId={steamId || ''} 
              size="md"
              onClick={() => setShowLogoutDialog(true)}
            />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setModalState('Logout', true)}
              className="text-gray-400 hover:text-white hover:bg-gray-700/50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {selectedServer ? (
              <div className="space-y-6">
                {/* Server Header */}
                <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl font-bold flex items-center gap-3">
                          <Server className="h-6 w-6 text-orange-500" />
                          {selectedServer.name}
                        </CardTitle>
                        <CardDescription className="text-gray-400 mt-2">
                          {selectedServer.ip}:{selectedServer.port}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={selectedServer.isConnected ? "default" : "destructive"}
                        className={selectedServer.isConnected ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        {selectedServer.isConnected ? 'Connected' : 'Disconnected'}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:bg-gray-800/70 transition-all duration-200 group">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <div className="p-2 bg-blue-600/20 rounded-lg group-hover:bg-blue-600/30 transition-colors">
                          <Zap className="h-5 w-5 text-blue-400" />
                        </div>
                        Smart Devices
                      </CardTitle>
                      <CardDescription>
                        Manage your smart switches, alarms, and storage monitors
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        View Devices
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:bg-gray-800/70 transition-all duration-200 group">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <div className="p-2 bg-green-600/20 rounded-lg group-hover:bg-green-600/30 transition-colors">
                          <MessageSquare className="h-5 w-5 text-green-400" />
                        </div>
                        Team Chat
                      </CardTitle>
                      <CardDescription>
                        Send and receive team messages
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full bg-green-600 hover:bg-green-700">
                        Open Chat
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:bg-gray-800/70 transition-all duration-200 group">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <div className="p-2 bg-purple-600/20 rounded-lg group-hover:bg-purple-600/30 transition-colors">
                          <Map className="h-5 w-5 text-purple-400" />
                        </div>
                        Map
                      </CardTitle>
                      <CardDescription>
                        View server map with markers and team locations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full bg-purple-600 hover:bg-purple-700">
                        View Map
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 max-w-md w-full">
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-4 bg-gray-700/50 rounded-full w-fit">
                      <Server className="h-12 w-12 text-gray-400" />
                    </div>
                    <CardTitle className="text-2xl">No Server Selected</CardTitle>
                    <CardDescription>
                      Select a server from the sidebar or add a new one to get started
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button
                      onClick={() => setModalState('AddServer', true)}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      Add Your First Server
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Device Control Button */}
            {selectedServer && entities.length > 0 && (
              <div className="mt-6">
                <Button
                  onClick={() => setModalState('DeviceControl', true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Control Devices ({entities.filter(e => e.serverId === selectedServer.id).length})
                </Button>
              </div>
            )}
          </div>

          {/* Notification Tester - Development Tool */}
          {/* <div className="mt-6 px-6">
            <NotificationTester />
          </div> */}
        </main>

        {/* Notification Container */}
        <NotificationContainer />
      </div>

      {/* Status Bar */}
      <footer className="bg-gray-800/50 backdrop-blur-sm border-t border-gray-700/50 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${getStatusColor(fcmStatus)}`}>
                {getStatusIcon(fcmStatus)}
              </span>
              <span className="text-sm text-gray-400">FCM: {fcmStatusMessage}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${getStatusColor(expoStatus)}`}>
                {getStatusIcon(expoStatus)}
              </span>
              <span className="text-sm text-gray-400">Expo: {expoStatusMessage}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${getStatusColor(companionPushStatus)}`}>
                {getStatusIcon(companionPushStatus)}
              </span>
              <span className="text-sm text-gray-400">
                Rust+: {companionPushStatusMessage}
                {companionPushStatus === 'error' && (
                  <span className="ml-2 text-xs text-red-400">
                    (Check console for details)
                  </span>
                )}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <span>RustLink v1.0.0 by JawadYzbk</span>
            <Heart className="h-4 w-4 text-red-500" />
          </div>
        </div>
      </footer>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-orange-500" />
              Confirm Logout
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to logout? You'll need to reconnect with Steam to access your servers again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowLogoutDialog(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Server Modal */}
      <AddServerModal
        isOpen={isShowingAddServerModal}
        onClose={() => setModalState('AddServer', false)}
      />

      {/* About Modal */}
      <AboutModal
        isOpen={isShowingAboutModal}
        onClose={() => setModalState('About', false)}
      />

      {/* Logout Modal */}
      <LogoutModal
        isOpen={isShowingLogoutModal}
        onClose={() => setModalState('Logout', false)}
        onLogout={() => {
          logout();
          setModalState('Logout', false);
        }}
      />

      {/* Device Control Modal */}
      <DeviceControlModal
        isOpen={isShowingDeviceControlModal}
        onClose={() => setModalState('DeviceControl', false)}
        devices={selectedServer ? entities.filter(e => e.serverId === selectedServer.id).map(entity => ({
          id: entity.id,
          entityId: entity.entityId.toString(),
          entityName: entity.name,
          customName: entity.customName,
          type: entity.type,
          status: entity.isOnline ? 'online' : 'offline',
          lastValue: entity.lastValue,
          lastUpdated: entity.lastUpdated
        })) : []}
      />

      {/* Pair Server Modal */}
      <PairServerModal
        isOpen={isShowingPairServerModal}
        onClose={() => setModalState('PairServer', false)}
      />

      {/* Entity Pairing Modal */}
      <EntityPairingModal
        isOpen={isShowingEntityPairingModal}
        onClose={() => setModalState('EntityPairing', false)}
      />

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}

export default App;