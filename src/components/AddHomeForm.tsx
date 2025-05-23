import { useState } from 'react';

interface AddHomeFormProps {
  onAddHome: (data: {
    address: string;
    zillowUrl: string;
    askingPrice: number;
    agentName?: string;
  }) => void;
}

const AddHomeForm = ({ onAddHome }: AddHomeFormProps) => {
  const [address, setAddress] = useState('');
  const [zillowUrl, setZillowUrl] = useState('');
  const [askingPrice, setAskingPrice] = useState('');
  const [agentName, setAgentName] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim() && zillowUrl.trim() && askingPrice) {
      onAddHome({
        address: address.trim(),
        zillowUrl: zillowUrl.trim(),
        askingPrice: parseFloat(askingPrice),
        agentName: agentName.trim() || undefined
      });
      setAddress('');
      setZillowUrl('');
      setAskingPrice('');
      setAgentName('');
      setIsFormOpen(false);
    }
  };

  const formatPrice = (value: string) => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    if (!numericValue) return '';
    
    // Convert to number and format with commas
    const formatted = new Intl.NumberFormat('en-US').format(parseInt(numericValue));
    return formatted;
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPrice(e.target.value);
    setAskingPrice(formatted);
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
          <div className="mb-3">
            <label htmlFor="askingPrice" className="block text-sm font-medium text-gray-700 mb-1">
              Asking Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="text"
                id="askingPrice"
                value={askingPrice}
                onChange={handlePriceChange}
                className="w-full px-3 py-2 pl-6 border border-gray-300 rounded-md"
                placeholder="200,000"
                required
              />
            </div>
          </div>
          <div className="mb-3">
            <label htmlFor="agentName" className="block text-sm font-medium text-gray-700 mb-1">
              Agent Name (optional)
            </label>
            <input
              type="text"
              id="agentName"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="John Doe"
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
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md"
            >
              Add Home
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsFormOpen(true)}
          className="w-full py-2 bg-blue-600 text-white rounded-md flex items-center justify-center"
        >
          <span className="mr-1">+</span> Add New Home
        </button>
      )}
    </div>
  );
};

export default AddHomeForm; 