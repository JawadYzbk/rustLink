import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Shield, Zap, Users, Server } from 'lucide-react';

const ConnectRustPlus: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { setAuthentication } = useAppStore();

  useEffect(() => {
    // Set up the IPC listener for successful authentication
    const handleRustPlusConnected = (data: { steamId: string; token: string }) => {
      console.log('Rust+ authentication successful:', data);
      setAuthentication(data.steamId, data.token);
      setIsConnecting(false);
    };

    // Set up the IPC listener for cancelled authentication
    const handleRustPlusConnectionCancelled = () => {
      console.log('Rust+ authentication cancelled');
      setIsConnecting(false);
    };

    // Register the listeners
    window.electronAPI?.onRustPlusConnected(handleRustPlusConnected);
    window.electronAPI?.onRustPlusConnectionCancelled(handleRustPlusConnectionCancelled);

    // Cleanup listeners on component unmount
    return () => {
      window.electronAPI?.removeRustPlusListener();
    };
  }, [setAuthentication]);

  const handleConnectWithRustPlus = async () => {
    setIsConnecting(true);
    try {
      // Trigger the Steam authentication flow
      await window.electronAPI?.connectWithRustPlus();
    } catch (error) {
      console.error('Failed to connect with Rust+:', error);
      setIsConnecting(false);
    }
  };

  const features = [
    {
      icon: <Server className="h-5 w-5" />,
      title: "Server Management",
      description: "Connect and manage multiple Rust servers"
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Team Communication",
      description: "Stay connected with your team members"
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Smart Devices",
      description: "Control switches, alarms, and storage monitors"
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Secure Connection",
      description: "Official Rust+ API integration"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full"></div>
              <Avatar className="h-24 w-24 border-4 border-orange-500/30 relative">
                <AvatarImage src="/images/logo-no-text.png" alt="RustLink" />
                <AvatarFallback className="bg-orange-500 text-white text-2xl font-bold">RL</AvatarFallback>
              </Avatar>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome to <span className="text-orange-500">RustLink</span>
          </h1>
          <p className="text-slate-400 text-lg mb-4">
            The ultimate companion for Rust server management
          </p>
          <Badge variant="secondary" className="bg-orange-500/10 text-orange-400 border-orange-500/20">
            Unofficial Native Rust+ Client
          </Badge>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Connection Card */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-500" />
                Connect to Rust+
              </CardTitle>
              <CardDescription className="text-slate-400">
                Authenticate with Steam to access the official Rust+ Companion API and start managing your servers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleConnectWithRustPlus}
                disabled={isConnecting}
                size="lg"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    Connect with Steam
                  </>
                )}
              </Button>
              
              <div className="text-xs text-slate-500 text-center">
                Secure authentication through Steam's official API
              </div>
            </CardContent>
          </Card>

          {/* Features Overview */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">What you can do</CardTitle>
              <CardDescription className="text-slate-400">
                Powerful features to enhance your Rust gaming experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex flex-col items-center text-center p-3 rounded-lg bg-slate-700/30 border border-slate-600/30">
                    <div className="text-orange-500 mb-2">
                      {feature.icon}
                    </div>
                    <h4 className="text-white text-sm font-medium mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-slate-400 text-xs">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-2">
            <span>Developed with</span>
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span>by</span>
            <a 
              href="https://github.com/JawadYzbk" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-orange-400 hover:text-orange-300 transition-colors"
            >
              Jawad Yazbek
            </a>
          </div>
          <Badge variant="outline" className="text-slate-500 border-slate-600">
            v1.0.0
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default ConnectRustPlus;