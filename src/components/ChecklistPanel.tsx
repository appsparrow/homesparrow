import type { HomeChecklist } from '../lib/supabase';

interface ChecklistPanelProps {
  checklist: HomeChecklist;
  onUpdateChecklist: (field: keyof HomeChecklist, value: boolean | string) => void;
}

const ChecklistPanel = ({ checklist, onUpdateChecklist }: ChecklistPanelProps) => {
  const checklistItems = [
    { id: 'three_bed', label: '3 Bedroom' },
    { id: 'two_bath', label: '2 Bathroom' },
    { id: 'under_200k', label: 'Under $200K' },
    { id: 'no_basement', label: 'No Basement' },
    { id: 'no_trees_back', label: 'No Trees in Back' },
    { id: 'brick', label: 'Brick Construction' },
    { id: 'updated', label: 'Updated' },
    { id: 'ranch', label: 'Ranch Style' },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="divide-y divide-gray-200">
        {checklistItems.map((item) => (
          <div key={item.id} className="py-3">
            <div className="flex items-center justify-between">
              <label className="text-gray-800 font-medium">{item.label}</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => onUpdateChecklist(item.id, true)}
                  className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${
                    checklist[item.id]
                      ? 'bg-green-100 text-green-800 border-2 border-green-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => onUpdateChecklist(item.id, false)}
                  className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${
                    checklist[item.id] === false
                      ? 'bg-red-100 text-red-800 border-2 border-red-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-200">
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          id="notes"
          value={checklist.notes || ''}
          onChange={(e) => onUpdateChecklist('notes', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md h-32 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Add any additional notes about this property..."
        />
      </div>
    </div>
  );
};

export default ChecklistPanel; 