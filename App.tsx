
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Header from './components/Header';
import ClientDetails from './components/ClientDetails';
import RoomCard from './components/RoomCard';
import TabButton from './components/TabButton';
import Questionnaire from './components/Questionnaire';
import RequirementInput from './components/RequirementInput';
import BoqDisplay from './components/BoqDisplay';
import AuthGate from './components/AuthGate';

import { questionnaire } from './data/questionnaireData';
import { generateBoq } from './services/geminiService';
import type { Room, ClientDetails as ClientDetailsType } from './types';

type ViewMode = 'questionnaire' | 'direct';

const App: React.FC = () => {
  const [clientDetails, setClientDetails] = useState<ClientDetailsType>({
    projectName: '',
    clientName: '',
    preparedBy: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [rooms, setRooms] = useState<Room[]>([
    { id: uuidv4(), name: 'Conference Room 1', requirements: '', boq: [] },
  ]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(rooms[0]?.id || null);
  const [viewMode, setViewMode] = useState<ViewMode>('questionnaire');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (rooms.length > 0 && !activeRoomId) {
      setActiveRoomId(rooms[0].id);
    }
  }, [rooms, activeRoomId]);

  const activeRoom = rooms.find(room => room.id === activeRoomId) || null;

  const handleAddRoom = () => {
    const newRoom: Room = {
      id: uuidv4(),
      name: `New Room ${rooms.length + 1}`,
      requirements: '',
      boq: [],
    };
    setRooms([...rooms, newRoom]);
    setActiveRoomId(newRoom.id);
  };

  const handleUpdateRoom = (updatedRoom: Room) => {
    setRooms(rooms.map(room => (room.id === updatedRoom.id ? updatedRoom : room)));
  };

  const handleDeleteRoom = (roomId: string) => {
    const newRooms = rooms.filter(room => room.id !== roomId);
    setRooms(newRooms);
    if (activeRoomId === roomId) {
      setActiveRoomId(newRooms[0]?.id || null);
    }
  };

  const handleGenerateBoq = async (requirements: string) => {
    if (!activeRoom) return;

    setIsLoading(true);
    setError(null);

    try {
      const generatedBoqItems = await generateBoq(requirements);
      const updatedRoom = { ...activeRoom, requirements, boq: generatedBoqItems };
      handleUpdateRoom(updatedRoom);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAnswerChange = (questionId: string, value: string) => {
    if (questionId === 'roomType' && activeRoom) {
      const roomName = questionnaire
        .flatMap(s => s.questions)
        .find(q => q.id === 'roomType')
        ?.options?.find(o => o.value === value)?.label || 'New Room';
      
      const isDefaultName = /^New Room \d+$|^Conference Room \d+$/.test(activeRoom.name);
      
      if(isDefaultName) {
         handleUpdateRoom({ ...activeRoom, name: roomName });
      }
    }
  };

  return (
    <AuthGate>
        <div className="bg-slate-900 text-slate-200 min-h-screen">
          <Header />
          <main className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
            <ClientDetails details={clientDetails} onDetailsChange={setClientDetails} disabled={isLoading} />

            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Rooms</h2>
              <div className="flex flex-wrap items-center gap-4">
                 {rooms.map(room => (
                   <RoomCard
                     key={room.id}
                     room={room}
                     isActive={room.id === activeRoomId}
                     onSelect={() => setActiveRoomId(room.id)}
                     onUpdate={handleUpdateRoom}
                     onDelete={() => handleDeleteRoom(room.id)}
                   />
                 ))}
                 <button 
                   onClick={handleAddRoom}
                   className="p-4 h-[84px] rounded-lg bg-slate-800 hover:bg-slate-700/50 border border-dashed border-slate-600 transition-colors text-slate-400 font-medium sm:min-w-[200px]"
                 >
                   + Add Room
                 </button>
              </div>
            </div>
            
            {activeRoom ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                    <div className="border-b border-slate-700 mb-6">
                        <TabButton isActive={viewMode === 'questionnaire'} onClick={() => setViewMode('questionnaire')}>
                            Guided Questionnaire
                        </TabButton>
                        <TabButton isActive={viewMode === 'direct'} onClick={() => setViewMode('direct')}>
                            Direct Text Input
                        </TabButton>
                    </div>
                    {viewMode === 'questionnaire' ? (
                        <Questionnaire questionnaire={questionnaire} onSubmit={handleGenerateBoq} isLoading={isLoading} onAnswerChange={handleAnswerChange} />
                    ) : (
                        <RequirementInput onSubmit={handleGenerateBoq} isLoading={isLoading} />
                    )}
                </div>
                <div className="lg:col-span-1">
                  {error && (
                    <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg mb-4">
                      <p className="font-bold">Error Generating BOQ</p>
                      <p>{error}</p>
                    </div>
                  )}
                  <BoqDisplay activeRoom={activeRoom} clientDetails={clientDetails} />
                </div>
              </div>
            ) : (
                <div className="text-center py-20 bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-700">
                    <h3 className="text-lg font-medium text-white">No Rooms Created</h3>
                    <p className="mt-1 text-sm text-slate-400">Click "Add Room" to get started.</p>
                </div>
            )}

          </main>
        </div>
    </AuthGate>
  );
};

export default App;
