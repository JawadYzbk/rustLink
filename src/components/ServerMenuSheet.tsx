import React from 'react';
import { useAppStore } from '../stores/appStore';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Menu,
  Server,
  Plus,
  Users,
  Wifi,
  WifiOff
} from 'lucide-react';

interface ServerMenuSheetProps {
  children: React.ReactNode;
}

const ServerMenuSheet: React.FC<ServerMenuSheetProps> = ({ children }) => {
  const { 
    servers, 
    selectedServer, 
    selectServer, 
    setModalState,
    isRustPlusConnected 
  } = useAppStore();

  const handleServerSelect = (serverId: string) => {
    selectServer(serverId);
  };

  const handleAddServer = () => {
    setModalState('AddServer', true);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="left" className="w-[400px] sm:w-[540px] bg-gray-800 border-gray-700">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3 text-white">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            Server List
          </SheetTitle>
          <SheetDescription className="text-gray-400">
            Select a server to connect to or add a new one
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Add Server Button */}
          <Button
            onClick={handleAddServer}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Server
          </Button>

          {/* Server List */}
          <div className="space-y-3">
            {servers.length === 0 ? (
              <div className="text-center py-8">
                <Server className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">No servers added yet</p>
                <Button
                  onClick={handleAddServer}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Add Your First Server
                </Button>
              </div>
            ) : (
              servers.map((server) => (
                <div
                  key={server.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedServer?.id === server.id
                      ? 'bg-orange-600/20 border-orange-500/50 shadow-lg'
                      : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700 hover:border-gray-500'
                  }`}
                  onClick={() => handleServerSelect(server.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                          <Server className="h-5 w-5 text-gray-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white truncate">
                            {server.name}
                          </h3>
                          <p className="text-sm text-gray-400 truncate">
                            {server.ip}:{server.port}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-3">
                      {/* Connection Status */}
                      <div className="flex items-center gap-1">
                        {selectedServer?.id === server.id && isRustPlusConnected ? (
                          <Wifi className="h-4 w-4 text-green-400" />
                        ) : (
                          <WifiOff className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                      
                      {/* Player Count Badge */}
                      <Badge 
                        variant="secondary" 
                        className="bg-gray-600 text-gray-200 text-xs"
                      >
                        <Users className="h-3 w-3 mr-1" />
                        {server.playerCount || 0}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Server Description */}
                  {server.description && (
                    <p className="mt-2 text-sm text-gray-400 line-clamp-2">
                      {server.description}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ServerMenuSheet;