import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { 
  X, 
  Link
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

interface ServerNotification {
  id: string;
  name?: string;
  ip?: string;
  port?: string;
  playerId?: string;
  playerToken?: string;
  desc?: string;
  img?: string;
}

interface PairServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification?: ServerNotification;
  onPair?: (serverData: any) => void;
}

const PairServerModal: React.FC<PairServerModalProps> = ({
  isOpen,
  onClose,
  notification,
  onPair,
}) => {
  const { connectToServer } = useAppStore();

  const handlePair = async () => {
    if (notification) {
      try {
        // Use the new ServerService to add and connect to the server
        await connectToServer({
          id: notification.id,
          name: notification.name || "Unknown Server",
          ip: notification.ip || '',
          port: parseInt(notification.port || '28082'),
          playerToken: notification.playerToken || '',
          isConnected: false,
          lastSeen: undefined
        });

        // Call the legacy onPair callback if provided for backward compatibility
        if (onPair) {
          onPair({
            id: notification.id,
            ip: notification.ip,
            name: notification.name || "No Server Name",
            port: notification.port,
            playerId: notification.playerId,
            playerToken: notification.playerToken,
          });
        }
      } catch (error) {
        console.error('Failed to pair server:', error);
      }
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-800 text-white border-gray-600">
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Server Banner */}
        <div className="relative bg-gradient-to-br from-orange-400 to-red-500 -m-6 mb-6 h-48 overflow-hidden rounded-t-lg">
          <img 
            src={notification?.img || '/images/default_server_banner.jpg'} 
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== '/images/default_server_banner.jpg') {
                target.src = '/images/default_server_banner.jpg';
              }
            }}
            className="w-full h-full object-cover"
            alt={notification?.name || 'Server Banner'}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          <div className="absolute top-4 left-4 bg-orange-500 rounded-full p-3 shadow-lg animate-pulse">
            <Link className="w-6 h-6 text-white" />
          </div>
        </div>

        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-2">
            {notification?.name || 'Unknown Server'}
          </DialogTitle>
          <div className="flex items-center justify-center space-x-2 text-orange-400">
            <Link className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-wide">
              Server Pairing Request
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Server Info */}
          <div className="bg-gray-700 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Server IP:</span>
              <span className="text-white font-mono text-sm">
                {notification?.ip || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Port:</span>
              <span className="text-white font-mono text-sm">
                {notification?.port || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Player ID:</span>
              <span className="text-white font-mono text-sm">
                {notification?.playerId || 'N/A'}
              </span>
            </div>
          </div>

          {/* Description */}
          {notification?.desc && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Description:</h4>
              <div 
                className="text-gray-100 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: notification.desc.replace(/\\n/g, '<br/>') 
                }}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={handlePair}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <div className="flex items-center justify-center space-x-2">
                <Link className="w-5 h-5" />
                <span>Pair Server</span>
              </div>
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 bg-gray-600 hover:bg-gray-500 text-white border-gray-600"
            >
              Cancel
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-center">
            <p className="text-xs text-gray-400">
              Pairing will connect this server to your Rust+ companion app
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PairServerModal;