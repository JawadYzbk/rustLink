import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface AddServerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddServerModal: React.FC<AddServerModalProps> = ({ isOpen, onClose }) => {
  const { steamId, connectToServer } = useAppStore();
  
  const [formData, setFormData] = useState({
    ip: '',
    port: '',
    playerToken: ''
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        ip: '',
        port: '',
        playerToken: ''
      });
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAdd = async () => {
    // Validate all fields are provided
    if (!formData.ip || !formData.port || !formData.playerToken) {
      return;
    }

    try {
      // Use the new ServerService to connect to the server
      await connectToServer({
        id: Date.now().toString(), // Simple ID generation
        name: `${formData.ip}:${formData.port}`, // Default name
        ip: formData.ip,
        port: parseInt(formData.port),
        playerToken: formData.playerToken,
        isConnected: false,
        lastSeen: undefined
      });

      handleClose();
    } catch (error) {
      console.error('Failed to add server:', error);
    }
  };

  const handleClose = () => {
    // Clear form data
    setFormData({
      ip: '',
      port: '',
      playerToken: ''
    });
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Server</DialogTitle>
          <DialogDescription>
            Add a new Rust server to connect to
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="server-ip">Server IP</Label>
            <Input
              id="server-ip"
              type="text"
              value={formData.ip}
              onChange={(e) => handleInputChange('ip', e.target.value)}
              placeholder="Enter server IP address"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="server-port">Server Port (app.port)</Label>
            <Input
              id="server-port"
              type="text"
              value={formData.port}
              onChange={(e) => handleInputChange('port', e.target.value)}
              placeholder="Enter server port"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="player-token">Player Token</Label>
            <Input
              id="player-token"
              type="text"
              value={formData.playerToken}
              onChange={(e) => handleInputChange('playerToken', e.target.value)}
              placeholder="Enter player token"
            />
          </div>
        </div>
        
        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddServerModal;