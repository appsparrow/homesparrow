import { useState, useEffect } from 'react';
import type { Home } from '../lib/supabase';

interface HomeEvaluationChecklistProps {
  home: Home;
  onSave: (data: HomeEvaluationData) => void;
  initialData?: HomeEvaluationData;
}

type Condition = 'Good' | 'Fair' | 'Poor';
type HvacType = 'Central' | 'Window' | 'Mini-Split' | 'None';
type HeatingType = 'Gas' | 'Electric';
type HotWaterTest = 'Instant' | 'Delay' | 'None';
type LightsWorking = 'All' | 'Some' | 'None';
type FlooringType = 'Hardwood' | 'Carpet' | 'Tile' | 'Laminate';

type EvaluationSection = 'basicSystems' | 'structure' | 'interior' | 'siteVicinity';

interface HomeBasicSystems {
  roof_year: string;
  paint_condition: Condition;
  hvac_type: HvacType;
  hvac_year: string;
  ac_unit_year_month: string;
  heating_type: HeatingType;
  water_heater_present: boolean;
  water_heater_year: string;
  hot_water_test: HotWaterTest;
  plumbing_condition: Condition;
  electrical_panel_updated: boolean;
  gfci_present: boolean;
  outlets_grounded: boolean;
  lights_working: LightsWorking;
  smoke_alarms_installed: boolean;
  smoke_alarms_working: boolean;
  co_detectors_installed: boolean;
  co_detectors_working: boolean;
  fire_extinguisher_present: boolean;
  [key: string]: string | boolean | Condition | HvacType | HeatingType | HotWaterTest | LightsWorking;
}

interface HomeStructure {
  foundation_cracks: boolean;
  crawl_space_accessible: boolean;
  vapor_barrier_present: boolean;
  attic_insulation_present: boolean;
  double_glazed_windows: boolean;
  doors_locking_properly: boolean;
  [key: string]: boolean;
}

interface HomeInterior {
  flooring_type: FlooringType;
  hardwood_condition: Condition;
  ceiling_issues: boolean;
  cabinet_condition: Condition;
  appliances_present: string[];
  fixtures_operational: boolean;
  [key: string]: string | boolean | Condition | FlooringType | string[];
}

interface HomeSiteVicinity {
  adjacent_dilapidated: boolean;
  vacant_units_next_door: boolean;
  fire_damage_nearby: boolean;
  trash_dumping_present: boolean;
  illegal_repairs_nearby: boolean;
  excessive_noise: boolean;
  graffiti_present: boolean;
  isolated_location: boolean;
  [key: string]: boolean;
}

interface BedroomData {
  adequate_size: boolean;
  closet_present: boolean;
  entry_door_present: boolean;
  egress_present: boolean;
  window_size_meets_code: boolean;
  window_sill_height_ok: boolean;
  smoke_detector_present: boolean;
  co_detector_present: boolean;
  gas_appliance_present: boolean;
  accessed_through_another: boolean;
  connects_to_garage: boolean;
}

interface HomeEvaluationData {
  basicSystems: HomeBasicSystems;
  structure: HomeStructure;
  interior: HomeInterior;
  siteVicinity: HomeSiteVicinity;
  bedrooms: Record<string, BedroomData>;
}

type SectionData = {
  basicSystems: HomeBasicSystems;
  structure: HomeStructure;
  interior: HomeInterior;
  siteVicinity: HomeSiteVicinity;
};

const defaultEvaluationData: HomeEvaluationData = {
  basicSystems: {
    roof_year: '',
    paint_condition: 'Good',
    hvac_type: 'None',
    hvac_year: '',
    ac_unit_year_month: '',
    heating_type: 'Electric',
    water_heater_present: false,
    water_heater_year: '',
    hot_water_test: 'None',
    plumbing_condition: 'Good',
    electrical_panel_updated: false,
    gfci_present: false,
    outlets_grounded: false,
    lights_working: 'None',
    smoke_alarms_installed: false,
    smoke_alarms_working: false,
    co_detectors_installed: false,
    co_detectors_working: false,
    fire_extinguisher_present: false
  },
  structure: {
    foundation_cracks: false,
    crawl_space_accessible: false,
    vapor_barrier_present: false,
    attic_insulation_present: false,
    double_glazed_windows: false,
    doors_locking_properly: false
  },
  interior: {
    flooring_type: 'Carpet',
    hardwood_condition: 'Good',
    ceiling_issues: false,
    cabinet_condition: 'Good',
    appliances_present: [],
    fixtures_operational: false
  },
  bedrooms: {},
  siteVicinity: {
    adjacent_dilapidated: false,
    vacant_units_next_door: false,
    fire_damage_nearby: false,
    trash_dumping_present: false,
    illegal_repairs_nearby: false,
    excessive_noise: false,
    graffiti_present: false,
    isolated_location: false
  }
};

const HomeEvaluationChecklist = ({ home, onSave, initialData }: HomeEvaluationChecklistProps) => {
  const [evaluationData, setEvaluationData] = useState<HomeEvaluationData>(defaultEvaluationData);
  const [selectedFields, setSelectedFields] = useState<Record<EvaluationSection, Record<string, boolean>>>({
    basicSystems: {},
    structure: {},
    interior: {},
    siteVicinity: {}
  });
  const [newBedroomName, setNewBedroomName] = useState('');

  useEffect(() => {
    if (initialData) {
      setEvaluationData({
        basicSystems: {
          ...defaultEvaluationData.basicSystems,
          ...initialData.basicSystems
        },
        structure: {
          ...defaultEvaluationData.structure,
          ...initialData.structure
        },
        interior: {
          ...defaultEvaluationData.interior,
          ...initialData.interior
        },
        bedrooms: {
          ...initialData.bedrooms
        },
        siteVicinity: {
          ...defaultEvaluationData.siteVicinity,
          ...initialData.siteVicinity
        }
      });

      // Initialize selected fields based on initialData
      const newSelectedFields = { ...selectedFields };
      const sections: EvaluationSection[] = ['basicSystems', 'structure', 'interior', 'siteVicinity'];
      sections.forEach(section => {
        newSelectedFields[section] = {};
        const fields = initialData[section] as SectionData[typeof section];
        if (fields) {
          Object.entries(fields).forEach(([field, value]) => {
            if (value !== (defaultEvaluationData[section] as SectionData[typeof section])[field]) {
              newSelectedFields[section][field] = true;
            }
          });
        }
      });
      setSelectedFields(newSelectedFields);
    }
  }, [initialData]);

  const handleConditionChange = (section: EvaluationSection, field: string, value: any) => {
    setSelectedFields(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: !prev[section]?.[field]
      }
    }));

    setEvaluationData(prev => {
      const currentValue = (prev[section] as SectionData[typeof section])[field];
      // For boolean values, toggle them
      if (typeof currentValue === 'boolean') {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: !currentValue
          }
        };
      }
      // For enum values, toggle between the value and default
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: currentValue === value ? (defaultEvaluationData[section] as SectionData[typeof section])[field] : value
        }
      };
    });
  };

  const isFieldSelected = (section: EvaluationSection, field: string): boolean => {
    return selectedFields[section]?.[field] || false;
  };

  const renderConditionButtons = (section: EvaluationSection, field: string, currentValue: Condition) => (
    <div className="flex space-x-2">
      <button
        type="button"
        onClick={() => handleConditionChange(section, field, 'Good')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          isFieldSelected(section, field) && currentValue === 'Good'
            ? 'bg-green-100 text-green-800 border-2 border-green-500'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        Good
      </button>
      <button
        type="button"
        onClick={() => handleConditionChange(section, field, 'Fair')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          isFieldSelected(section, field) && currentValue === 'Fair'
            ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-500'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        Fair
      </button>
      <button
        type="button"
        onClick={() => handleConditionChange(section, field, 'Poor')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          isFieldSelected(section, field) && currentValue === 'Poor'
            ? 'bg-red-100 text-red-800 border-2 border-red-500'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        Poor
      </button>
    </div>
  );

  const renderYesNoButtons = (section: EvaluationSection, field: string, currentValue: boolean) => (
    <div className="flex space-x-2">
      <button
        type="button"
        onClick={() => handleConditionChange(section, field, true)}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          isFieldSelected(section, field) && currentValue
            ? 'bg-green-100 text-green-800 border-2 border-green-500'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => handleConditionChange(section, field, false)}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          isFieldSelected(section, field) && !currentValue
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
      {(['Hardwood', 'Carpet', 'Tile', 'Laminate'] as FlooringType[]).map(type => (
        <button
          key={type}
          type="button"
          onClick={() => handleConditionChange('interior', 'flooring_type', type)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            isFieldSelected('interior', 'flooring_type') && currentValue === type
              ? 'bg-blue-100 text-blue-800 border-2 border-blue-500'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  );

  const renderHvacTypeButtons = (currentValue: HvacType) => (
    <div className="flex flex-wrap gap-2">
      {(['Central', 'Window', 'Mini-Split', 'None'] as HvacType[]).map(type => (
        <button
          key={type}
          type="button"
          onClick={() => handleConditionChange('basicSystems', 'hvac_type', type)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            isFieldSelected('basicSystems', 'hvac_type') && currentValue === type
              ? 'bg-blue-100 text-blue-800 border-2 border-blue-500'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  );

  const renderHeatingTypeButtons = (currentValue: HeatingType) => (
    <div className="flex flex-wrap gap-2">
      {(['Gas', 'Electric'] as HeatingType[]).map(type => (
        <button
          key={type}
          type="button"
          onClick={() => handleConditionChange('basicSystems', 'heating_type', type)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            isFieldSelected('basicSystems', 'heating_type') && currentValue === type
              ? 'bg-blue-100 text-blue-800 border-2 border-blue-500'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  );

  const renderHotWaterTestButtons = (currentValue: HotWaterTest) => (
    <div className="flex flex-wrap gap-2">
      {(['Instant', 'Delay', 'None'] as HotWaterTest[]).map(type => (
        <button
          key={type}
          type="button"
          onClick={() => handleConditionChange('basicSystems', 'hot_water_test', type)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            isFieldSelected('basicSystems', 'hot_water_test') && currentValue === type
              ? 'bg-blue-100 text-blue-800 border-2 border-blue-500'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  );

  const renderLightsWorkingButtons = (currentValue: LightsWorking) => (
    <div className="flex flex-wrap gap-2">
      {(['All', 'Some', 'None'] as LightsWorking[]).map(type => (
        <button
          key={type}
          type="button"
          onClick={() => handleConditionChange('basicSystems', 'lights_working', type)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            isFieldSelected('basicSystems', 'lights_working') && currentValue === type
              ? 'bg-blue-100 text-blue-800 border-2 border-blue-500'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  );

  const renderTextInput = (section: EvaluationSection, field: string, value: string) => (
    <input
      type="text"
      value={value}
      onChange={(e) => handleConditionChange(section, field, e.target.value)}
      className={`px-3 py-1 border rounded-md ${
        isFieldSelected(section, field) ? 'border-blue-500' : ''
      }`}
    />
  );

  const renderSection = (title: string, fields: Record<string, any>, section: EvaluationSection) => (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-4">
        {Object.entries(fields).map(([field, value]) => (
          <div key={field} className="flex items-center justify-between">
            <label className="text-gray-700">
              {field.replace(/_/g, ' ').replace(/^./, str => str.toUpperCase())}
            </label>
            {typeof value === 'boolean' ? (
              renderYesNoButtons(section, field, value)
            ) : field === 'flooring_type' ? (
              renderFlooringButtons(value as FlooringType)
            ) : field === 'hvac_type' ? (
              renderHvacTypeButtons(value as HvacType)
            ) : field === 'heating_type' ? (
              renderHeatingTypeButtons(value as HeatingType)
            ) : field === 'hot_water_test' ? (
              renderHotWaterTestButtons(value as HotWaterTest)
            ) : field === 'lights_working' ? (
              renderLightsWorkingButtons(value as LightsWorking)
            ) : typeof value === 'string' && (field.includes('condition') || field.includes('status')) ? (
              renderConditionButtons(section, field, value as Condition)
            ) : typeof value === 'string' ? (
              renderTextInput(section, field, value)
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );

  const handleSave = () => {
    // Only include selected fields in the save data
    const saveData = { ...evaluationData };
    const sections: EvaluationSection[] = ['basicSystems', 'structure', 'interior', 'siteVicinity'];
    sections.forEach(section => {
      Object.keys(selectedFields[section]).forEach(field => {
        if (!selectedFields[section][field]) {
          (saveData[section] as SectionData[typeof section])[field] = (defaultEvaluationData[section] as SectionData[typeof section])[field];
        }
      });
    });
    onSave(saveData);
  };

  const renderAHChecklist = () => {
    const siteVicinityChecks = [
      {
        label: 'Adjacent unit is vacant, dilapidated, or fire-damaged',
        passed: !(evaluationData.siteVicinity.adjacent_dilapidated || 
                 evaluationData.siteVicinity.vacant_units_next_door || 
                 evaluationData.siteVicinity.fire_damage_nearby)
      },
      {
        label: 'Illegal repair shops nearby',
        passed: !evaluationData.siteVicinity.illegal_repairs_nearby
      },
      {
        label: 'Excessive noise in area',
        passed: !evaluationData.siteVicinity.excessive_noise
      },
      {
        label: 'Trash or dumping in vicinity',
        passed: !evaluationData.siteVicinity.trash_dumping_present
      },
      {
        label: 'Signs of graffiti',
        passed: !evaluationData.siteVicinity.graffiti_present
      },
      {
        label: 'Isolated living environment',
        passed: !evaluationData.siteVicinity.isolated_location
      }
    ];

    const bedroomChecks = Object.entries(evaluationData.bedrooms).map(([name, data]) => [
      {
        label: `${name}: Adequate size (8' x 10' minimum)`,
        passed: data.adequate_size
      },
      {
        label: `${name}: Has closet`,
        passed: data.closet_present
      },
      {
        label: `${name}: Has entry door`,
        passed: data.entry_door_present
      },
      {
        label: `${name}: Has secondary egress`,
        passed: data.egress_present
      },
      {
        label: `${name}: Window meets size requirements`,
        passed: data.window_size_meets_code && data.window_sill_height_ok
      },
      {
        label: `${name}: Has smoke detector`,
        passed: data.smoke_detector_present
      },
      {
        label: `${name}: Has CO detector (if needed)`,
        passed: !data.gas_appliance_present || data.co_detector_present
      },
      {
        label: `${name}: No gas appliances in room`,
        passed: !data.gas_appliance_present
      },
      {
        label: `${name}: Not accessed through another bedroom`,
        passed: !data.accessed_through_another
      },
      {
        label: `${name}: Not connected to garage`,
        passed: !data.connects_to_garage
      }
    ]).flat();

    const systemChecks = [
      {
        label: 'Air conditioning provided',
        passed: evaluationData.basicSystems.hvac_type !== 'None'
      },
      {
        label: 'CO detectors where needed',
        passed: evaluationData.basicSystems.co_detectors_installed
      },
      {
        label: 'Fire extinguisher in kitchen',
        passed: evaluationData.basicSystems.fire_extinguisher_present
      },
      {
        label: 'Attic insulation present',
        passed: evaluationData.structure.attic_insulation_present
      },
      {
        label: 'Crawl space inspected',
        passed: evaluationData.structure.crawl_space_accessible
      }
    ];

    const renderCheckList = (title: string, checks: Array<{ label: string; passed: boolean }>) => (
      <div className="mb-6">
        <h4 className="text-lg font-semibold mb-3">{title}</h4>
        <div className="space-y-2">
          {checks.map((check, index) => (
            <div key={index} className="flex items-center">
              <span className={`mr-2 text-xl ${check.passed ? 'text-green-500' : 'text-red-500'}`}>
                {check.passed ? '✓' : '✗'}
              </span>
              <span className={check.passed ? 'text-gray-700' : 'text-red-600'}>
                {check.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );

    const allSiteChecks = siteVicinityChecks.every(check => check.passed);
    const allBedroomChecks = bedroomChecks.every(check => check.passed);
    const allSystemChecks = systemChecks.every(check => check.passed);
    const overallPassed = allSiteChecks && allBedroomChecks && allSystemChecks;

    return (
      <div className="mt-8 border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">AH Eligibility Checklist</h3>
          <div className={`px-4 py-2 rounded-md ${overallPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {overallPassed ? 'Eligible' : 'Not Eligible'}
          </div>
        </div>
        
        {renderCheckList('1. Site & Vicinity Evaluation', siteVicinityChecks)}
        {renderCheckList('2. Bedroom Requirements', bedroomChecks)}
        {renderCheckList('3. Interior Safety & Systems', systemChecks)}
      </div>
    );
  };

  const handleAddBedroom = () => {
    if (!newBedroomName.trim()) return;
    
    setEvaluationData(prev => ({
      ...prev,
      bedrooms: {
        ...prev.bedrooms,
        [newBedroomName]: {
          adequate_size: false,
          closet_present: false,
          entry_door_present: false,
          egress_present: false,
          window_size_meets_code: false,
          window_sill_height_ok: false,
          smoke_detector_present: false,
          co_detector_present: false,
          gas_appliance_present: false,
          accessed_through_another: false,
          connects_to_garage: false
        }
      }
    }));
    setNewBedroomName('');
  };

  const handleRemoveBedroom = (bedroomName: string) => {
    setEvaluationData(prev => {
      const newBedrooms = { ...prev.bedrooms };
      delete newBedrooms[bedroomName];
      return {
        ...prev,
        bedrooms: newBedrooms
      };
    });
  };

  const handleBedroomFieldChange = (bedroomName: string, field: keyof BedroomData, value: boolean) => {
    setEvaluationData(prev => ({
      ...prev,
      bedrooms: {
        ...prev.bedrooms,
        [bedroomName]: {
          ...prev.bedrooms[bedroomName],
          [field]: value
        }
      }
    }));
  };

  const renderBedroomSection = () => (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4">Bedrooms</h3>
      
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newBedroomName}
          onChange={(e) => setNewBedroomName(e.target.value)}
          placeholder="Enter bedroom name"
          className="px-3 py-1 border rounded-md flex-grow"
        />
        <button
          onClick={handleAddBedroom}
          className="px-4 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Add Bedroom
        </button>
      </div>

      {Object.entries(evaluationData.bedrooms).map(([bedroomName, data]) => (
        <div key={bedroomName} className="mb-6 p-4 border rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium">{bedroomName}</h4>
            <button
              onClick={() => handleRemoveBedroom(bedroomName)}
              className="text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>

          <div className="space-y-4">
            {Object.entries(data).map(([field, value]) => (
              <div key={field} className="flex items-center justify-between">
                <label className="text-gray-700">
                  {field.replace(/_/g, ' ').replace(/^./, str => str.toUpperCase())}
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleBedroomFieldChange(bedroomName, field as keyof BedroomData, true)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      value
                        ? 'bg-green-100 text-green-800 border-2 border-green-500'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBedroomFieldChange(bedroomName, field as keyof BedroomData, false)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      !value
                        ? 'bg-red-100 text-red-800 border-2 border-red-500'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-4 space-y-6">
      {renderSection('Basic Systems', evaluationData.basicSystems, 'basicSystems')}
      {renderSection('Structure', evaluationData.structure, 'structure')}
      {renderSection('Interior', evaluationData.interior, 'interior')}
      {renderBedroomSection()}
      {renderSection('Site Vicinity', evaluationData.siteVicinity, 'siteVicinity')}
      
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={handleSave}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Save Evaluation
        </button>
      </div>

      {renderAHChecklist()}
    </div>
  );
};

export default HomeEvaluationChecklist;