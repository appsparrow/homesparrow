import type { Home, HomeChecklist, HomeImage } from './lib/supabase';

interface AddressListProps {
  homes: Home[];
  selectedHome: Home | null;
  homeChecklists: Record<string, HomeChecklist>;
  checkIfMeetsCriteria: (checklist: HomeChecklist) => boolean;
  onSelectHome: (home: Home) => void;
  homeImages: Record<string, HomeImage[]>;
}

const AddressList = ({ 
  homes, 
  selectedHome, 
  homeChecklists, 
  checkIfMeetsCriteria, 
  onSelectHome,
  homeImages
}: AddressListProps) => {
  const getChecklistCompletion = (checklist: HomeChecklist): { met: number; total: number } => {
    const criteria = [
      checklist.three_bed,
      checklist.two_bath,
      checklist.under_200k,
      checklist.no_basement,
      checklist.no_trees_back,
      checklist.brick,
      checklist.updated,
      checklist.ranch
    ];
    
    const met = criteria.filter(Boolean).length;
    return { met, total: criteria.length };
  };

  return (
    <div className="space-y-2">
      {homes.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No homes added yet</p>
      ) : (
        homes.map((home) => {
          const isSelected = selectedHome?.id === home.id;
          const checklist = homeChecklists[home.id];
          const meetsCriteria = checklist ? checkIfMeetsCriteria(checklist) : false;
          const images = homeImages[home.id] || [];
          const primaryImage = images.find(img => img.is_primary);
          const completion = checklist ? getChecklistCompletion(checklist) : { met: 0, total: 8 };
          
          return (
            <div
              key={home.id}
              onClick={() => onSelectHome(home)}
              className={`p-3 rounded-md cursor-pointer transition ${
                isSelected
                  ? 'bg-primary-100 border-primary-300'
                  : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
              } ${meetsCriteria ? 'border-l-4 border-primary-500' : 'border'}`}
            >
              <div className="flex items-start space-x-3">
                {primaryImage && (
                  <div className="w-16 h-16 flex-shrink-0">
                    <img
                      src={primaryImage.image_url}
                      alt={home.address}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{home.address}</div>
                  <div className="text-sm text-gray-600 mt-1 flex items-center justify-between">
                    <div className="flex items-center">
                      <span className={`mr-2 text-xs font-medium ${
                        meetsCriteria ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {completion.met}/{completion.total} Criteria
                      </span>
                      {meetsCriteria && <span className="text-green-600">✅</span>}
                    </div>
                    <a 
                      href={home.zillow_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-600 hover:underline text-xs truncate ml-2"
                    >
                      View on Zillow
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default AddressList; 