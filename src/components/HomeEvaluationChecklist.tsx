import { useState } from 'react';
import type { Home } from '../lib/supabase';

interface HomeEvaluationChecklistProps {
  home: Home;
  onSave: (data: any) => void;
}

type Condition = 'Good' | 'OK' | 'Bad';
type FlooringType = 'Carpet' | 'LVP' | 'Hardwood' | 'Tile';

interface EvaluationData {
  basicSystems: {
    roofCondition: Condition;
    hvacType: string;
    hvacCondition: Condition;
    plumbingCondition: Condition;
    electricalUpdated: boolean;
    gfciPresent: boolean;
    smokeDetectors: boolean;
    coDetectors: boolean;
  };
  structure: {
    foundationIssues: boolean;
    crawlSpace: boolean;
    atticAccess: boolean;
    windowsUpdated: boolean;
    doorsSecure: boolean;
  };
  interior: {
    flooringType: FlooringType;
    flooringCondition: Condition;
    wallsCondition: Condition;
    ceilingCondition: Condition;
    kitchenUpdated: boolean;
    bathroomsUpdated: boolean;
  };
  bedrooms: {
    adequateSize: boolean;
    closetSpace: boolean;
    naturalLight: boolean;
    properEgress: boolean;
  };
  exterior: {
    siding: Condition;
    landscaping: Condition;
    drainage: boolean;
    fencing: boolean;
  };
}

type SectionKey = keyof EvaluationData;

const HomeEvaluationChecklist = ({ home, onSave }: HomeEvaluationChecklistProps) => {
  const [evaluationData, setEvaluationData] = useState<EvaluationData>({
    basicSystems: {
      roofCondition: 'Good' as Condition,
      hvacType: 'Central',
      hvacCondition: 'Good' as Condition,
      plumbingCondition: 'Good' as Condition,
      electricalUpdated: false,
      gfciPresent: false,
      smokeDetectors: false,
      coDetectors: false,
    },
    structure: {
      foundationIssues: false,
      crawlSpace: false,
      atticAccess: false,
      windowsUpdated: false,
      doorsSecure: false,
    },
    interior: {
      flooringType: 'Carpet' as FlooringType,
      flooringCondition: 'Good' as Condition,
      wallsCondition: 'Good' as Condition,
      ceilingCondition: 'Good' as Condition,
      kitchenUpdated: false,
      bathroomsUpdated: false,
    },
    bedrooms: {
      adequateSize: false,
      closetSpace: false,
      naturalLight: false,
      properEgress: false,
    },
    exterior: {
      siding: 'Good' as Condition,
      landscaping: 'Good' as Condition,
      drainage: false,
      fencing: false,
    }
  });

  const handleConditionChange = (section: SectionKey, field: string, value: Condition | boolean | string) => {
    setEvaluationData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const renderConditionButtons = (section: string, field: string, currentValue: Condition) => (
    <div className="flex space-x-2">
      <button
        type="button"
        onClick={() => handleConditionChange(section as SectionKey, field, 'Good')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          currentValue === 'Good'
            ? 'bg-green-100 text-green-800 border-2 border-green-500'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        Good
      </button>
      <button
        type="button"
        onClick={() => handleConditionChange(section as SectionKey, field, 'OK')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          currentValue === 'OK'
            ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-500'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        OK
      </button>
      <button
        type="button"
        onClick={() => handleConditionChange(section as SectionKey, field, 'Bad')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          currentValue === 'Bad'
            ? 'bg-red-100 text-red-800 border-2 border-red-500'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        Bad
      </button>
    </div>
  );

  const renderYesNoButtons = (section: string, field: string, currentValue: boolean) => (
    <div className="flex space-x-2">
      <button
        type="button"
        onClick={() => handleConditionChange(section as SectionKey, field, true)}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          currentValue
            ? 'bg-green-100 text-green-800 border-2 border-green-500'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => handleConditionChange(section as SectionKey, field, false)}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          currentValue === false
            ? 'bg-red-100 text-red-800 border-2 border-red-500'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        No
      </button>
    </div>
  );

  const renderFlooringButtons = (currentValue: FlooringType) => (
    <div className="flex flex-wrap gap-2">
      {(['Carpet', 'LVP', 'Hardwood', 'Tile'] as FlooringType[]).map(type => (
        <button
          key={type}
          type="button"
          onClick={() => handleConditionChange('interior' as SectionKey, 'flooringType', type)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            currentValue === type
              ? 'bg-blue-100 text-blue-800 border-2 border-blue-500'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  );

  const renderSection = (title: string, fields: Record<string, any>, section: string) => (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-4">
        {Object.entries(fields).map(([field, value]) => (
          <div key={field} className="flex items-center justify-between">
            <label className="text-gray-700">
              {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </label>
            {typeof value === 'boolean' ? (
              renderYesNoButtons(section, field, value)
            ) : field === 'flooringType' ? (
              renderFlooringButtons(value as FlooringType)
            ) : typeof value === 'string' ? (
              renderConditionButtons(section, field, value as Condition)
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-4 space-y-6">
      {renderSection('Basic Systems', evaluationData.basicSystems, 'basicSystems')}
      {renderSection('Structure', evaluationData.structure, 'structure')}
      {renderSection('Interior', evaluationData.interior, 'interior')}
      {renderSection('Bedrooms', evaluationData.bedrooms, 'bedrooms')}
      {renderSection('Exterior', evaluationData.exterior, 'exterior')}
      
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={() => onSave(evaluationData)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Save Evaluation
        </button>
      </div>
    </div>
  );
};

export default HomeEvaluationChecklist; 