import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';

interface Item {
  id: number;
  name: string;
  shortname: string;
  description?: string;
}

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId?: number;
}

const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  itemId,
}) => {
  const [item, setItem] = useState<Item | null>(null);

  useEffect(() => {
    if (itemId) {
      // In a real implementation, you would fetch items from a JSON file or API
      // For now, we'll create a mock item
      const mockItem: Item = {
        id: itemId,
        name: 'Unknown Item',
        shortname: 'unknown',
        description: 'Item information not available.',
      };
      setItem(mockItem);
    } else {
      setItem(null);
    }
  }, [itemId]);

  const getItemImage = () => {
    if (item) {
      return `images/items/${item.shortname}.png`;
    }
    return 'images/unknown_item.png';
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex justify-center p-4">
            <img
              className="mx-auto"
              src={getItemImage()}
              width={100}
              height={100}
              alt={item.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'images/unknown_item.png';
              }}
            />
          </div>
          <DialogTitle className="text-center">
            {item.name || 'Unknown Item'}
          </DialogTitle>
          {item.description && (
            <DialogDescription className="text-left">
              <div
                dangerouslySetInnerHTML={{
                  __html: item.description.replace(/\\n/g, '<br/>'),
                }}
              />
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

export default ItemModal;