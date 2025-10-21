import React from 'react';
import { useAppStore } from './stores/appStore';
import ConnectRustPlus from './components/ConnectRustPlus';
import ServerSidePanel from './components/ServerSidePanel';
import NotificationCenter from './components/NotificationCenter';

function App() {
  const {
    isRustPlusConnected,
    steamId,
    selectedServer,
    setModalState,
    logout,
    fcmStatus,
    expoStatus,
    companionPushStatus,
    fcmStatusMessage,
    expoStatusMessage,
    companionPushStatusMessage,
  } = useAppStore();

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

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">R</span>
          </div>
          <h1 className="text-xl font-semibold">RustLink</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <NotificationCenter />
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            
            <button
              onClick={() => setModalState('Logout', true)}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <ServerSidePanel />

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {selectedServer ? (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">{selectedServer.name}</h2>
                  <p className="text-gray-400">
                    {selectedServer.ip}:{selectedServer.port}
                  </p>
                  
                  <div className="mt-4 flex items-center space-x-4">
                    <div className={`flex items-center space-x-2 ${
                      selectedServer.isConnected ? 'text-green-400' : 'text-red-400'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        selectedServer.isConnected ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      <span className="text-sm">
                        {selectedServer.isConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Server Management Interface */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Smart Devices</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Manage your smart switches, alarms, and storage monitors
                    </p>
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors">
                      View Devices
                    </button>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Team Chat</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Send and receive team messages
                    </p>
                    <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors">
                      Open Chat
                    </button>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Map</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      View server map with markers and team locations
                    </p>
                    <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors">
                      View Map
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
                <h2 className="text-2xl font-bold mb-4">No Server Selected</h2>
                <p className="text-gray-400 mb-8">
                  Select a server from the sidebar or add a new one to get started
                </p>
                
                <button
                  onClick={() => setModalState('AddServer', true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                >
                  Add Your First Server
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Status Bar */}
      <footer className="bg-gray-800 px-6 py-2 text-sm text-gray-400 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className={getStatusColor(fcmStatus)}>FCM: {fcmStatusMessage}</span>
          <span className={getStatusColor(expoStatus)}>Expo: {expoStatusMessage}</span>
          <span className={getStatusColor(companionPushStatus)}>Rust+: {companionPushStatusMessage}</span>
        </div>
        <div>
          RustLink v1.0.0 by liamcottle
        </div>
      </footer>
    </div>
  );
}

export default App;