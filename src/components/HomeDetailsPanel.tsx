import { useState } from 'react';
import type { Home, HomeNote, StatusUpdate, Status, HomeImage } from '../lib/supabase';

interface HomeDetailsPanelProps {
  selectedHome: Home;
  onUpdateStatus: (status: Status, note?: string, offerAmount?: number, date?: string) => Promise<void>;
  onAddNote: (note: string) => Promise<void>;
  onUploadImage: (homeId: string, file: File) => Promise<void>;
  onDeleteImage: (imageId: string, homeId: string) => Promise<void>;
  onSetPrimaryImage: (imageId: string, homeId: string) => Promise<void>;
  onUpdateHome: (data: Partial<Home>) => void;
  statusHistory: StatusUpdate[];
  notes: HomeNote[];
  images: HomeImage[];
  onDeleteStatusHistory: (id: string) => void;
}

const statusOrder: Status[] = ['New', 'Contacted', 'Seen', 'Liked', 'Disliked', 'Offer Made', 'Accepted'];

export default function HomeDetailsPanel({
  selectedHome,
  onUpdateStatus,
  onAddNote,
  onUploadImage,
  onDeleteImage,
  onSetPrimaryImage,
  onUpdateHome,
  statusHistory,
  notes,
  images,
  onDeleteStatusHistory
}: HomeDetailsPanelProps) {
  const [newNote, setNewNote] = useState('');
  const [offerAmount, setOfferAmount] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<Status>(selectedHome.current_status || 'New');
  const [showHistory, setShowHistory] = useState(false);
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [dateEdits, setDateEdits] = useState<Record<string, string>>({});
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<Status | null>(null);
  const [statusDate, setStatusDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const handleStatusClick = (status: Status) => {
    setPendingStatus(status);
    setStatusDate(new Date().toISOString().split('T')[0]);
    setShowStatusModal(true);
  };

  const handleStatusConfirm = async () => {
    if (pendingStatus) {
      setSelectedStatus(pendingStatus);
      await onUpdateStatus(pendingStatus, newNote, offerAmount ? parseFloat(offerAmount) : undefined, statusDate);
      setShowStatusModal(false);
      setPendingStatus(null);
      setStatusDate(new Date().toISOString().split('T')[0]);
      setNewNote('');
      setOfferAmount('');
    }
  };

  const handleAddNote = async () => {
    if (newNote.trim()) {
      await onAddNote(newNote.trim());
      setNewNote('');
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await onUploadImage(selectedHome.id, file);
    }
  };

  const handleDateEdit = (id: string, value: string) => {
    setDateEdits((prev) => ({ ...prev, [id]: value }));
  };

  const handleDateSave = (id: string) => {
    // Here you would call an update function to save the new date to the backend
    setEditingDateId(null);
  };

  return (
    <div className="p-4">
      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs">
            <h4 className="font-semibold mb-2">Set Status: {pendingStatus}</h4>
            <label className="block mb-2 text-sm">Date</label>
            <input
              type="date"
              value={statusDate}
              onChange={e => setStatusDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowStatusModal(false)} className="px-3 py-1 rounded bg-gray-200">Cancel</button>
              <button onClick={handleStatusConfirm} className="px-3 py-1 rounded bg-blue-600 text-white">Set</button>
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Home Details</h3>
        {selectedHome.zillow_url && (
          <a
            href={selectedHome.zillow_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            View on Zillow
          </a>
        )}
      </div>

      <div className="mb-6">
        <h4 className="font-medium mb-2">Status Updates</h4>
        <div className="flex flex-wrap gap-2 mb-4">
          {statusOrder.map((status) => (
            <button
              key={status}
              onClick={() => handleStatusClick(status)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                selectedStatus === status
                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-500'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {selectedStatus === 'Offer Made' && (
          <div className="mb-4">
            <input
              type="number"
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              placeholder="Offer Amount"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddNote}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Add Note
          </button>
        </div>

        {/* Collapsible Status History */}
        <div className="mt-4">
          <button
            onClick={() => setShowHistory((prev) => !prev)}
            className="text-blue-600 hover:underline text-sm mb-2"
          >
            {showHistory ? 'Hide History' : 'Show History'}
          </button>
          {showHistory && (
            <div className="space-y-4">
              {[...statusHistory].reverse().map((update) => (
                <div
                  key={update.id}
                  className="p-3 bg-gray-50 rounded-md"
                >
                  <div className="flex justify-between text-sm text-gray-600 items-center">
                    <span>{update.status}</span>
                    {editingDateId === update.id ? (
                      <span className="flex items-center gap-2">
                        <input
                          type="date"
                          value={dateEdits[update.id] || update.date.split('T')[0]}
                          onChange={(e) => handleDateEdit(update.id, e.target.value)}
                          className="border px-2 py-1 rounded"
                        />
                        <button
                          onClick={() => handleDateSave(update.id)}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingDateId(null)}
                          className="text-gray-400 hover:text-gray-600 text-xs"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span>{new Date(update.date).toLocaleDateString()}</span>
                        <button
                          onClick={() => setEditingDateId(update.id)}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteStatusHistory(update.id)}
                          className="text-red-500 hover:text-red-700 text-xs ml-2"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </span>
                    )}
                  </div>
                  {update.notes && (
                    <p className="mt-1 text-gray-700">{update.notes}</p>
                  )}
                  {update.offer_amount && (
                    <p className="mt-1 font-medium text-green-700">
                      Offer: ${update.offer_amount.toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-medium mb-2">Images</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <img
                src={image.image_url}
                alt="Home"
                className="w-full h-32 object-cover rounded-md"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => onSetPrimaryImage(image.id, selectedHome.id)}
                  className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                >
                  Set Primary
                </button>
                <button
                  onClick={() => onDeleteImage(image.id, selectedHome.id)}
                  className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          <label className="border-2 border-dashed border-gray-300 rounded-md p-4 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <span className="text-gray-600">Upload Image</span>
          </label>
        </div>
      </div>
    </div>
  );
} 