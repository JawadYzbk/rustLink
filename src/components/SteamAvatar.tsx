import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { User } from 'lucide-react';

interface SteamAvatarProps {
  steamId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const SteamAvatar: React.FC<SteamAvatarProps> = ({ 
  steamId, 
  size = 'md', 
  className = '', 
  onClick 
}) => {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-14 w-14'
  };

  const avatarUrl = `https://companion-rust.facepunch.com/api/avatar/${steamId}`;

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Avatar 
      className={`${sizeClasses[size]} ${className} ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-orange-500 transition-all' : ''}`}
      onClick={onClick}
    >
      {!imageError ? (
        <AvatarImage 
          src={avatarUrl} 
          alt="Steam Avatar"
          onError={handleImageError}
        />
      ) : null}
      <AvatarFallback className="bg-gray-600 text-gray-300">
        <User className="h-4 w-4" />
      </AvatarFallback>
    </Avatar>
  );
};

export default SteamAvatar;