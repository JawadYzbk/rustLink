import React from 'react';
import { useAppStore } from '../stores/appStore';

const ServerSidePanel: React.FC = () => {
  const {
    servers,
    selectedServer,
    selectServer,
    setModalState,
    fcmStatus,
    expoStatus,
    companionPushStatus,
    fcmStatusMessage,
    expoStatusMessage,
    companionPushStatusMessage,
  } = useAppStore();

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
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
        );
    }
  };

  return (
    <aside className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Servers</h2>
        
        <button
          onClick={() => setModalState('AddServer', true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Server</span>
        </button>
      </div>

      {/* Server List */}
      <div className="flex-1 overflow-y-auto">
        {servers.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
            <p className="text-sm">No servers added yet</p>
            <p className="text-xs mt-1">Click "Add Server" to get started</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {servers.map((server) => (
              <div
                key={server.id}
                onClick={() => selectServer(server)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedServer?.id === server.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium truncate">{server.name}</h3>
                  <div className={`w-2 h-2 rounded-full ${
                    server.isConnected ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                </div>
                
                <div className="text-xs opacity-75">
                  <div>{server.ip}:{server.port}</div>
                  {server.lastSeen && (
                    <div className="mt-1">
                      Last seen: {server.lastSeen.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Section */}
      <div className="p-4 border-t border-gray-700 space-y-3">
        <h3 className="text-sm font-medium text-gray-300">Service Status</h3>
        
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">FCM</span>
            <div className={`flex items-center space-x-1 ${getStatusColor(fcmStatus)}`}>
              {getStatusIcon(fcmStatus)}
              <span>{fcmStatusMessage}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Expo</span>
            <div className={`flex items-center space-x-1 ${getStatusColor(expoStatus)}`}>
              {getStatusIcon(expoStatus)}
              <span>{expoStatusMessage}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Rust+</span>
            <div className={`flex items-center space-x-1 ${getStatusColor(companionPushStatus)}`}>
              {getStatusIcon(companionPushStatus)}
              <span>{companionPushStatusMessage}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ServerSidePanel;