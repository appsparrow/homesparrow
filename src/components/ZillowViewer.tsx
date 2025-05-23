import { useState } from 'react';
import type { Home, HomeNote, StatusUpdate, Status, HomeImage } from '../lib/supabase';

interface ZillowViewerProps {
  selectedHome: Home;
  onUpdateStatus: (status: Status, note?: string, offerAmount?: number) => Promise<void>;
  onAddNote: (note: string) => Promise<void>;
  onUploadImage: (homeId: string, file: File) => Promise<void>;
  onDeleteImage: (imageId: string, homeId: string) => Promise<void>;
  onSetPrimaryImage: (imageId: string, homeId: string) => Promise<void>;
  statusHistory: StatusUpdate[];
  notes: HomeNote[];
  images: HomeImage[];
}

const statusOrder: Status[] = ['New', 'Contacted', 'Seen', 'Liked', 'Disliked', 'Offer Made', 'Accepted'];

export default function ZillowViewer({
  selectedHome,
  onUpdateStatus,
  onAddNote,
  onUploadImage,
  onDeleteImage,
  onSetPrimaryImage,
  statusHistory,
  notes,
  images
}: ZillowViewerProps) {
  const [newNote, setNewNote] = useState('');
  const [offerAmount, setOfferAmount] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<Status>(selectedHome.current_status || 'New');

  const handleStatusChange = async (status: Status) => {
    setSelectedStatus(status);
    if (status === 'Offer Made' && offerAmount) {
      await onUpdateStatus(status, newNote, parseFloat(offerAmount));
    } else {
      await onUpdateStatus(status, newNote);
    }
    setNewNote('');
    setOfferAmount('');
  };

  const handleAddNote = async () => {
    if (newNote.trim()) {
      await onAddNote(newNote);
      setNewNote('');
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await onUploadImage(selectedHome.id, file);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Zillow Details</h3>
        <a
          href={selectedHome.zillow_url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          View on Zillow
        </a>
      </div>

      <div className="mb-6">
        <h4 className="font-medium mb-2">Status Updates</h4>
        <div className="flex flex-wrap gap-2 mb-4">
          {statusOrder.map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
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

      <div>
        <h4 className="font-medium mb-2">History</h4>
        <div className="space-y-4">
          {[...statusHistory].reverse().map((update) => (
            <div
              key={update.id}
              className="p-3 bg-gray-50 rounded-md"
            >
              <div className="flex justify-between text-sm text-gray-600">
                <span>{update.status}</span>
                <span>{new Date(update.date).toLocaleDateString()}</span>
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
      </div>
    </div>
  );
} 