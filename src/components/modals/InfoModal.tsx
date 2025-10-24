import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

const InfoModal: React.FC<InfoModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          {title && (
            <DialogTitle className="text-center">{title}</DialogTitle>
          )}
          {message && (
            <DialogDescription className="text-center mt-2">
              {message}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InfoModal;