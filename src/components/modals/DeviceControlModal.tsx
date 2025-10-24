import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  X, 
  Search, 
  Zap, 
  Shield, 
  Archive, 
  RotateCcw,
  Edit2
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

interface Device {
  id: string;
  entityId: number;
  entityType: 'smart_switch' | 'raid_alarm' | 'storage_monitor';
  entityName?: string;
  customName?: string;
  status?: string;
  serverId: string;
}

interface DeviceControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices?: Device[];
}

const DeviceControlModal: React.FC<DeviceControlModalProps> = ({
  isOpen,
  onClose,
  devices = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [editingDeviceName, setEditingDeviceName] = useState('');
  const { updateEntity, controlEntity } = useAppStore();

  const getDeviceIcon = (entityType: string) => {
    switch (entityType) {
      case 'smart_switch':
        return <Zap className="w-5 h-5 text-white" />;
      case 'raid_alarm':
        return <Shield className="w-5 h-5 text-white" />;
      case 'storage_monitor':
        return <Archive className="w-5 h-5 text-white" />;
      default:
        return <RotateCcw className="w-5 h-5 text-white" />;
    }
  };

  const getDeviceIconBg = (entityType: string) => {
    switch (entityType) {
      case 'smart_switch':
        return 'bg-yellow-500';
      case 'raid_alarm':
        return 'bg-red-500';
      case 'storage_monitor':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getEntityTypeLabel = (entityType: string) => {
    switch (entityType) {
      case 'smart_switch':
        return 'Smart Switch';
      case 'raid_alarm':
        return 'Raid Alarm';
      case 'storage_monitor':
        return 'Storage Monitor';
      default:
        return 'Unknown Device';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'online':
        return 'text-green-400';
      case 'offline':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const filteredDevices = devices.filter(device =>
    (device.customName || device.entityName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.entityId.toString().includes(searchQuery)
  );

  const startEditDeviceName = (device: Device) => {
    setEditingDeviceId(device.id);
    setEditingDeviceName(device.customName || device.entityName || '');
  };

  const saveDeviceName = (device: Device) => {
    // Update the entity name using the EntityService
    updateEntity(device.id, { customName: editingDeviceName });
    setEditingDeviceId(null);
    setEditingDeviceName('');
  };

  const handleControlDevice = async (device: Device) => {
    try {
      // Use the EntityService to control the device
      await controlEntity(device.id);
    } catch (error) {
      console.error('Failed to control device:', error);
    }
  };

  const cancelEditDeviceName = () => {
    setEditingDeviceId(null);
    setEditingDeviceName('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-gray-800 text-white border-gray-600">
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

        {/* Header */}
        <div className="relative bg-gradient-to-br from-green-500 to-blue-600 -m-6 mb-6 h-24 overflow-hidden rounded-t-lg">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          <div className="absolute top-4 left-4 bg-green-500 rounded-full p-3 shadow-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>

          <div className="absolute top-4 right-16">
            <Badge variant="secondary" className="bg-gray-800/80">
              {devices.length} Devices
            </Badge>
          </div>
        </div>

        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-2">
            Device Control Center
          </DialogTitle>
          <div className="flex items-center justify-center space-x-2 text-green-400">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-wide">
              Manage Paired Devices
            </span>
          </div>
        </DialogHeader>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search devices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Device List */}
        <div className="max-h-96 overflow-y-auto space-y-3">
          {filteredDevices.length === 0 ? (
            <div className="text-center py-8">
              <Archive className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">
                {searchQuery ? 'No devices match your search' : 'No paired devices found'}
              </p>
            </div>
          ) : (
            filteredDevices.map((device) => (
              <div
                key={device.id}
                className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getDeviceIconBg(device.entityType)}`}>
                        {getDeviceIcon(device.entityType)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          {editingDeviceId === device.id ? (
                            <Input
                              value={editingDeviceName}
                              onChange={(e) => setEditingDeviceName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveDeviceName(device);
                                if (e.key === 'Escape') cancelEditDeviceName();
                              }}
                              onBlur={() => saveDeviceName(device)}
                              className="bg-gray-600 text-white text-sm font-medium flex-1 focus:ring-green-500"
                              autoFocus
                            />
                          ) : (
                            <>
                              <h4
                                className="text-white font-medium truncate cursor-pointer hover:text-green-400 transition-colors"
                                onClick={() => startEditDeviceName(device)}
                              >
                                {device.customName || device.entityName || 'Unknown Device'}
                              </h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditDeviceName(device)}
                                className="p-1 h-auto hover:bg-gray-600"
                              >
                                <Edit2 className="w-4 h-4 text-gray-400 hover:text-white" />
                              </Button>
                            </>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                          <span>{getEntityTypeLabel(device.entityType)}</span>
                          <span>ID: {device.entityId}</span>
                          <div className="flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-green-400' : 'bg-red-400'}`} />
                            <span className={getStatusColor(device.status)}>
                              {device.status || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleControlDevice(device)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-600"
                    >
                      Control
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceControlModal;