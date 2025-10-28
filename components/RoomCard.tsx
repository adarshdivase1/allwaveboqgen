
import React, { useState, useRef, useEffect } from 'react';
import type { Room } from '../types';

interface RoomCardProps {
  room: Room;
  isActive: boolean;
  onSelect: () => void;
  onUpdate: (room: Room) => void;
  onDelete: () => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, isActive, onSelect, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(room.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);
  
  useEffect(() => {
    setName(room.name);
  }, [room.name]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleBlur = () => {
    if (name.trim()) {
        onUpdate({ ...room, name });
    } else {
        setName(room.name); // Revert if name is empty
    }
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setName(room.name);
      setIsEditing(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent onSelect from firing
    if (window.confirm(`Are you sure you want to delete "${room.name}"?`)) {
      onDelete();
    }
  };

  const baseClasses = "p-4 rounded-lg cursor-pointer transition-all duration-200 flex justify-between items-center w-full sm:w-auto sm:min-w-[200px]";
  const activeClasses = "bg-blue-600/80 ring-2 ring-blue-400 shadow-lg";
  const inactiveClasses = "bg-slate-800 hover:bg-slate-700/50 border border-slate-700";

  return (
    <div onClick={onSelect} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
      <div className="flex-grow">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={handleNameChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-slate-900 text-white rounded p-1"
          />
        ) : (
          <p className="font-medium text-white" onDoubleClick={() => setIsEditing(true)}>
            {room.name}
          </p>
        )}
        <p className="text-xs text-slate-400">{room.boq.length} items generated</p>
      </div>
      <button onClick={handleDelete} className="ml-4 text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export default RoomCard;