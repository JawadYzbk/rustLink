import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { AlertTriangle } from 'lucide-react';

interface RemoveServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRemove: () => void;
}

const RemoveServerModal: React.FC<RemoveServerModalProps> = ({
  isOpen,
  onClose,
  onRemove,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-2">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <DialogTitle className="text-center">Remove Server</DialogTitle>
          <DialogDescription className="text-center">
            Are you sure you want to remove this server?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:flex-row sm:justify-center sm:space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="sm:order-1"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onRemove}
            className="sm:order-2"
          >
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RemoveServerModal;