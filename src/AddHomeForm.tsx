import { useState } from 'react';

interface AddHomeFormProps {
  onAddHome: (address: string, zillowUrl: string) => void;
}

const AddHomeForm = ({ onAddHome }: AddHomeFormProps) => {
  const [address, setAddress] = useState('');
  const [zillowUrl, setZillowUrl] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim() && zillowUrl.trim()) {
      onAddHome(address.trim(), zillowUrl.trim());
      setAddress('');
      setZillowUrl('');
      setIsFormOpen(false);
    }
  };

  return (
    <div className="mb-6">
      {isFormOpen ? (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="mb-3">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="123 Main St, City, State"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="zillowUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Zillow URL
            </label>
            <input
              type="url"
              id="zillowUrl"
              value={zillowUrl}
              onChange={(e) => setZillowUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="https://www.zillow.com/homedetails/..."
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-3 py-2 text-sm rounded-md border border-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-2 text-sm bg-primary-600 text-white rounded-md"
            >
              Add Home
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsFormOpen(true)}
          className="w-full py-2 bg-primary-600 text-white rounded-md flex items-center justify-center"
        >
          <span className="mr-1">+</span> Add New Home
        </button>
      )}
    </div>
  );
};

export default AddHomeForm; 