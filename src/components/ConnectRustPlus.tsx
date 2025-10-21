import React, { useState } from 'react';
import { useAppStore } from '../stores/appStore';

const ConnectRustPlus: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const setAuthentication = useAppStore((state) => state.setAuthentication);

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      // Simulate authentication process
      // In the real app, this would integrate with Steam/Rust+ authentication
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock authentication data
      const mockSteamId = '76561198000000000';
      const mockToken = 'mock-rust-plus-token';
      
      setAuthentication(mockSteamId, mockToken);
    } catch (error) {
      console.error('Authentication failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto h-24 w-24 bg-orange-500 rounded-full flex items-center justify-center mb-8">
            <svg className="h-12 w-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome to RustLink
          </h2>
          
          <p className="text-gray-400 mb-8">
            Connect your Steam account to access Rust+ features and manage your servers remotely.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">
              Getting Started
            </h3>
            
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <span>Connect your Steam account</span>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <span>Pair with your Rust+ mobile app</span>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <span>Manage your servers and devices</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            {isConnecting ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span>Connect with Steam</span>
              </>
            )}
          </button>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              By connecting, you agree to share your Steam ID with RustLink for Rust+ integration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectRustPlus;