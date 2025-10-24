import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  X, 
  Link, 
  Zap, 
  Shield, 
  Archive, 
  RotateCcw
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

interface EntityData {
  entityId: number;
  entityName?: string;
  entityType: string;
  serverId?: string;
  serverName?: string;
  name?: string;
  desc?: string;
}

interface EntityPairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityData?: EntityData;
  onPairEntity?: (entityData: any) => void;
}

const EntityPairingModal: React.FC<EntityPairingModalProps> = ({
  isOpen,
  onClose,
  entityData,
  onPairEntity,
}) => {
  const [customName, setCustomName] = useState('');
  const { addEntity } = useAppStore();

  useEffect(() => {
    if (entityData) {
      setCustomName(entityData.entityName || '');
    }
  }, [entityData]);

  const getEntityType = () => {
    if (!entityData?.entityType) return 'unknown';
    
    // Map entity types based on Rust+ API
    const typeMap: { [key: string]: string } = {
      '1': 'smart_switch',
      '2': 'smart_alarm', 
      '3': 'storage_monitor',
    };
    
    return typeMap[entityData.entityType] || 'unknown';
  };

  const getEntityTypeLabel = () => {
    const typeLabels: { [key: string]: string } = {
      'smart_switch': 'Smart Switch',
      'smart_alarm': 'Smart Alarm',
      'raid_alarm': 'Raid Alarm',
      'storage_monitor': 'Storage Monitor',
      'unknown': 'Unknown Entity',
    };
    
    return typeLabels[getEntityType()] || 'Unknown Entity';
  };

  const getEntityIcon = () => {
    const entityType = getEntityType();
    switch (entityType) {
      case 'smart_switch':
        return <Zap className="w-6 h-6 text-white" />;
      case 'smart_alarm':
      case 'raid_alarm':
        return <Shield className="w-6 h-6 text-white" />;
      case 'storage_monitor':
        return <Archive className="w-6 h-6 text-white" />;
      default:
        return <RotateCcw className="w-6 h-6 text-white" />;
    }
  };

  const handlePairEntity = async () => {
    try {
      const pairedEntityData = {
        id: `${entityData?.serverId}_${entityData?.entityId}`,
        entityId: entityData?.entityId || 0,
        name: entityData?.entityName || entityData?.name || 'Unknown Entity',
        customName: customName,
        type: getEntityType() as 'smart_switch' | 'smart_alarm' | 'storage_monitor',
        isOnline: false,
        lastValue: undefined,
        lastUpdated: Date.now(),
        serverId: entityData?.serverId || ''
      };

      // Use the new EntityService to add the entity
      addEntity(pairedEntityData);

      // Call the legacy onPairEntity callback if provided for backward compatibility
      if (onPairEntity) {
        onPairEntity({
          entityId: entityData?.entityId,
          entityName: customName || entityData?.entityName || entityData?.name,
          entityType: entityData?.entityType,
          serverId: entityData?.serverId,
          customName: customName,
          originalData: entityData,
          pairedAt: Date.now(),
          status: 'unknown'
        });
      }

      // Close modal
      onClose();
    } catch (error) {
      console.error('Failed to pair entity:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-gray-800 text-white border-gray-600">
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

        {/* Entity Header */}
        <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 -m-6 mb-6 h-32 overflow-hidden rounded-t-lg">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          <div className="absolute top-4 left-4 bg-blue-500 rounded-full p-3 shadow-lg animate-pulse">
            {getEntityIcon()}
          </div>

          <div className="absolute top-4 right-16 bg-gray-800/80 rounded-full px-3 py-1">
            <span className="text-xs text-white font-medium">{getEntityTypeLabel()}</span>
          </div>
        </div>

        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-2">
            {entityData?.entityName || 'Unknown Entity'}
          </DialogTitle>
          <div className="flex items-center justify-center space-x-2 text-blue-400">
            <Link className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-wide">
              Entity Pairing Request
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Server Info */}
          <div className="bg-gray-700 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Server:</span>
              <span className="text-white text-sm font-medium">
                {entityData?.serverName || entityData?.name || 'Unknown Server'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Entity ID:</span>
              <span className="text-white font-mono text-sm">
                {entityData?.entityId || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Entity Type:</span>
              <span className="text-white text-sm">{getEntityTypeLabel()}</span>
            </div>
          </div>

          {/* Custom Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Custom Name (Optional)
            </label>
            <Input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={entityData?.entityName || 'Enter custom name'}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              This name will be used to identify the entity in your dashboard
            </p>
          </div>

          {/* Description */}
          {entityData?.desc && (
            <div className="bg-gray-700 rounded-lg p-4 max-h-32 overflow-y-auto">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Server Description:</h4>
              <div 
                className="text-gray-100 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: entityData.desc.replace(/\\n/g, '<br/>') 
                }}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={handlePairEntity}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <div className="flex items-center justify-center space-x-2">
                <Link className="w-5 h-5" />
                <span>Pair Entity</span>
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
              Pairing will allow you to control and monitor this {getEntityTypeLabel().toLowerCase()} remotely
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EntityPairingModal;