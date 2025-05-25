import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { supabase, Home, HomeChecklist } from '../lib/supabase-simple';

type Condition = 'Good' | 'Fair' | 'Poor';
type HvacType = 'Central' | 'Window' | 'Mini-Split';
type HeatingType = 'Gas' | 'Electric';
type HotWaterTest = 'Instant' | 'Delay' | 'None';
type LightsWorking = 'All' | 'Some' | 'None';
type FlooringType = 'Hardwood' | 'Carpet' | 'Tile' | 'Laminate';

interface BasicSystems {
  roof_year: string;
  paint_condition: Condition;
  hvac_type: HvacType[];
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
}

interface Structure {
  foundation_cracks: boolean;
  crawl_space_accessible: boolean;
  vapor_barrier_present: boolean;
  attic_insulation_present: boolean;
  double_glazed_windows: boolean;
  doors_locking_properly: boolean;
}

interface Interior {
  flooring_type: FlooringType[];
  hardwood_condition: Condition;
  ceiling_issues: boolean;
  cabinet_condition: Condition;
  appliances_present: string[];
  fixtures_operational: boolean;
}

interface SiteVicinity {
  adjacent_dilapidated: boolean;
  vacant_units_next_door: boolean;
  fire_damage_nearby: boolean;
  trash_dumping_present: boolean;
  illegal_repairs_nearby: boolean;
  excessive_noise: boolean;
  graffiti_present: boolean;
  isolated_location: boolean;
}

interface EvaluationData {
  basicSystems: BasicSystems;
  structure: Structure;
  interior: Interior;
  siteVicinity: SiteVicinity;
  youtube_link?: string;
}

const defaultEvaluationData: EvaluationData = {
  basicSystems: {
    roof_year: '',
    paint_condition: 'Good',
    hvac_type: [],
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
    flooring_type: [],
    hardwood_condition: 'Good',
    ceiling_issues: false,
    cabinet_condition: 'Good',
    appliances_present: [],
    fixtures_operational: false
  },
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

export default function EvaluateScreen({ route, navigation }: any) {
  const { home } = route?.params || {};
  const [evaluationData, setEvaluationData] = useState<EvaluationData>(defaultEvaluationData);
  const [youtubeLink, setYoutubeLink] = useState(home?.youtube_link || '');
  const [isEditingYoutube, setIsEditingYoutube] = useState(false);
  const [tempYoutubeLink, setTempYoutubeLink] = useState(youtubeLink);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (home?.id) {
      fetchEvaluationData();
    }
  }, [home?.id]);

  const fetchEvaluationData = async () => {
    try {
      // For now, we'll use the existing checklist structure
      // In a real app, you'd have a separate evaluation table
      const { data, error } = await supabase
        .from('home_checklists')
        .select('*')
        .eq('home_id', home.id);

      if (!error && data && data.length > 0) {
        // Map existing checklist to evaluation data
        const checklist = data[0];
        setEvaluationData(prev => ({
          ...prev,
          basicSystems: {
            ...prev.basicSystems,
            hvac_type: checklist.has_central_air ? ['Central'] : [],
            smoke_alarms_installed: true, // Default assumption
            co_detectors_installed: true,
          },
          structure: {
            ...prev.structure,
            foundation_cracks: !checklist.no_basement,
            attic_insulation_present: checklist.has_attic,
          },
          interior: {
            ...prev.interior,
            flooring_type: checklist.has_hardwood ? ['Hardwood'] : [],
          }
        }));
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (!home) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>No home selected</Text>
          <Text>Please select a home from the homes list.</Text>
        </View>
      </View>
    );
  }

  const handleSave = async () => {
    try {
      setLoading(true);
      console.log('Starting save operation...');
      
      // Save YouTube link to homes table
      if (youtubeLink && youtubeLink.trim() !== (home.youtube_link || '').trim()) {
        console.log('Saving YouTube link:', youtubeLink);
        const { data: updateData, error: homeError } = await supabase
          .from('homes')
          .update({ youtube_link: youtubeLink.trim() })
          .eq('id', home.id);

        if (homeError) {
          console.error('YouTube link save error:', homeError);
          // Don't throw error for YouTube link, just log it
          console.warn('YouTube link save failed, continuing with evaluation save');
        } else {
          console.log('YouTube link saved successfully:', updateData);
        }
      }
      
      // Map evaluation data to existing checklist fields
      const checklistData = {
        home_id: home.id,
        // HVAC mapping
        has_central_air: evaluationData.basicSystems.hvac_type.includes('Central'),
        has_window_units: evaluationData.basicSystems.hvac_type.includes('Window'),
        has_heat_pump: false, // Not in our evaluation
        has_gas_furnace: evaluationData.basicSystems.heating_type === 'Gas',
        
        // Flooring mapping
        has_hardwood: evaluationData.interior.flooring_type.includes('Hardwood'),
        has_carpet: evaluationData.interior.flooring_type.includes('Carpet'),
        has_tile: evaluationData.interior.flooring_type.includes('Tile'),
        has_laminate: evaluationData.interior.flooring_type.includes('Laminate'),
        
        // Structure mapping
        has_basement: !evaluationData.structure.foundation_cracks, // Inverse logic
        has_attic: evaluationData.structure.attic_insulation_present,
        
        // Safety mapping
        has_security_system: evaluationData.basicSystems.smoke_alarms_installed && 
                           evaluationData.basicSystems.co_detectors_installed,
        
        // Default values for fields not in our evaluation
        has_kitchen_island: false,
        has_pantry: false,
        has_updated_appliances: evaluationData.interior.fixtures_operational,
        is_open_concept: false,
        has_master_bath: false,
        has_updated_fixtures: evaluationData.interior.fixtures_operational,
        has_separate_tub_shower: false,
        has_double_vanity: false,
        has_garage: false,
        has_deck_patio: false,
        has_fenced_yard: false,
        has_pool: false,
        has_fireplace: false,
        
        // Original criteria (set defaults for now)
        three_bed: true,
        two_bath: true,
        under_200k: true,
        no_basement: !evaluationData.structure.foundation_cracks,
        no_trees_back: true,
        brick: true,
        updated: evaluationData.basicSystems.electrical_panel_updated,
        ranch: true,
        
        // Notes with evaluation summary
        notes: `Evaluation completed: ${new Date().toLocaleDateString()}\n` +
               `HVAC: ${evaluationData.basicSystems.hvac_type.join(', ') || 'None'}\n` +
               `Flooring: ${evaluationData.interior.flooring_type.join(', ') || 'None'}\n` +
               `Paint: ${evaluationData.basicSystems.paint_condition}\n` +
               `Plumbing: ${evaluationData.basicSystems.plumbing_condition}\n` +
               `Electrical Panel Updated: ${evaluationData.basicSystems.electrical_panel_updated ? 'Yes' : 'No'}\n` +
               `Smoke Alarms: ${evaluationData.basicSystems.smoke_alarms_installed ? 'Yes' : 'No'}\n` +
               `CO Detectors: ${evaluationData.basicSystems.co_detectors_installed ? 'Yes' : 'No'}\n` +
               `Foundation Issues: ${evaluationData.structure.foundation_cracks ? 'Yes' : 'No'}\n` +
               `Attic Insulation: ${evaluationData.structure.attic_insulation_present ? 'Yes' : 'No'}\n` +
               `Site Issues: ${Object.entries(evaluationData.siteVicinity)
                 .filter(([_, value]) => value === true)
                 .map(([key, _]) => key.replace(/_/g, ' '))
                 .join(', ') || 'None'}`
      };

      console.log('Saving checklist data:', JSON.stringify(checklistData, null, 2));

      // Save evaluation data (upsert to handle both create and update)
      const { data: checklistResult, error } = await supabase
        .from('home_checklists')
        .upsert(checklistData);

      if (error) {
        console.error('Checklist save error:', error);
        throw error;
      }
      
      console.log('Evaluation saved successfully:', checklistResult);
      Alert.alert('Success', 'Evaluation saved successfully!');
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('Error', `Failed to save evaluation: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testSupabaseConnection = async () => {
    try {
      console.log('Testing Supabase connection...');
      const { data, error } = await supabase
        .from('homes')
        .select('id, address')
        .eq('id', home.id);
      
      if (error) {
        console.error('Connection test error:', error);
        Alert.alert('Connection Error', error.message);
      } else {
        console.log('Connection test successful:', data);
        Alert.alert('Success', 'Supabase connection working!');
      }
    } catch (error: any) {
      console.error('Connection test failed:', error);
      Alert.alert('Error', error.message);
    }
  };

  const handleYesNoChange = (section: keyof EvaluationData, field: string, value: boolean) => {
    setEvaluationData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value
      }
    }));
  };

  const handleConditionChange = (section: keyof EvaluationData, field: string, value: Condition) => {
    setEvaluationData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value
      }
    }));
  };

  const handleTextChange = (section: keyof EvaluationData, field: string, value: string) => {
    setEvaluationData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value
      }
    }));
  };

  const handleMultiSelectChange = (section: keyof EvaluationData, field: string, option: string) => {
    setEvaluationData(prev => {
      const currentArray = (prev[section] as any)[field] || [];
      const exists = currentArray.includes(option);
      return {
        ...prev,
        [section]: {
          ...(prev[section] as any),
          [field]: exists 
            ? currentArray.filter((item: string) => item !== option)
            : [...currentArray, option]
        }
      };
    });
  };

  const renderYesNoButtons = (section: keyof EvaluationData, field: string, currentValue: boolean) => (
    <View style={styles.buttonGroup}>
      <TouchableOpacity
        style={[styles.button, currentValue && styles.buttonActive]}
        onPress={() => handleYesNoChange(section, field, true)}
      >
        <Text style={[styles.buttonText, currentValue && styles.buttonTextActive]}>Yes</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, !currentValue && styles.buttonActive]}
        onPress={() => handleYesNoChange(section, field, false)}
      >
        <Text style={[styles.buttonText, !currentValue && styles.buttonTextActive]}>No</Text>
      </TouchableOpacity>
    </View>
  );

  const renderConditionButtons = (section: keyof EvaluationData, field: string, currentValue: Condition) => (
    <View style={styles.buttonGroup}>
      {(['Good', 'Fair', 'Poor'] as Condition[]).map(condition => (
        <TouchableOpacity
          key={condition}
          style={[styles.button, currentValue === condition && styles.buttonActive]}
          onPress={() => handleConditionChange(section, field, condition)}
        >
          <Text style={[styles.buttonText, currentValue === condition && styles.buttonTextActive]}>
            {condition}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMultiSelectButtons = (section: keyof EvaluationData, field: string, options: string[], currentValue: string[]) => (
    <View style={styles.multiSelectGroup}>
      {options.map(option => (
        <TouchableOpacity
          key={option}
          style={[styles.button, currentValue.includes(option) && styles.buttonActive]}
          onPress={() => handleMultiSelectChange(section, field, option)}
        >
          <Text style={[styles.buttonText, currentValue.includes(option) && styles.buttonTextActive]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTextInput = (section: keyof EvaluationData, field: string, value: string, placeholder: string) => (
    <TextInput
      style={styles.textInput}
      value={value}
      onChangeText={(text) => handleTextChange(section, field, text)}
      placeholder={placeholder}
    />
  );

  const renderSection = (title: string, fields: any, section: keyof EvaluationData) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.fieldContainer}>
        {Object.entries(fields).map(([field, value]) => {
          const label = field.replace(/_/g, ' ').replace(/^./, str => str.toUpperCase());
          
          return (
            <View key={field} style={styles.field}>
              <Text style={styles.fieldLabel}>{label}</Text>
              {typeof value === 'boolean' ? (
                renderYesNoButtons(section, field, value)
              ) : field.includes('condition') ? (
                renderConditionButtons(section, field, value as Condition)
              ) : field === 'hvac_type' ? (
                renderMultiSelectButtons(section, field, ['Central', 'Window', 'Mini-Split'], value as string[])
              ) : field === 'flooring_type' ? (
                renderMultiSelectButtons(section, field, ['Hardwood', 'Carpet', 'Tile', 'Laminate'], value as string[])
              ) : field === 'heating_type' ? (
                renderMultiSelectButtons(section, field, ['Gas', 'Electric'], [value as string])
              ) : field === 'hot_water_test' ? (
                renderMultiSelectButtons(section, field, ['Instant', 'Delay', 'None'], [value as string])
              ) : field === 'lights_working' ? (
                renderMultiSelectButtons(section, field, ['All', 'Some', 'None'], [value as string])
              ) : typeof value === 'string' ? (
                renderTextInput(section, field, value, `Enter ${label.toLowerCase()}`)
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderEligibilityChecklist = () => {
    const siteVicinityChecks = [
      {
        label: 'No adjacent vacant/dilapidated units',
        passed: !(evaluationData.siteVicinity.adjacent_dilapidated || 
                 evaluationData.siteVicinity.vacant_units_next_door || 
                 evaluationData.siteVicinity.fire_damage_nearby)
      },
      {
        label: 'No illegal repair shops nearby',
        passed: !evaluationData.siteVicinity.illegal_repairs_nearby
      },
      {
        label: 'No excessive noise',
        passed: !evaluationData.siteVicinity.excessive_noise
      },
      {
        label: 'No trash or dumping',
        passed: !evaluationData.siteVicinity.trash_dumping_present
      },
      {
        label: 'No graffiti',
        passed: !evaluationData.siteVicinity.graffiti_present
      },
      {
        label: 'Not isolated',
        passed: !evaluationData.siteVicinity.isolated_location
      }
    ];

    const systemChecks = [
      {
        label: 'Air conditioning provided',
        passed: evaluationData.basicSystems.hvac_type.length > 0
      },
      {
        label: 'CO detectors installed',
        passed: evaluationData.basicSystems.co_detectors_installed
      },
      {
        label: 'Fire extinguisher present',
        passed: evaluationData.basicSystems.fire_extinguisher_present
      },
      {
        label: 'Attic insulation present',
        passed: evaluationData.structure.attic_insulation_present
      },
      {
        label: 'Crawl space accessible',
        passed: evaluationData.structure.crawl_space_accessible
      }
    ];

    const allSiteChecks = siteVicinityChecks.every(check => check.passed);
    const allSystemChecks = systemChecks.every(check => check.passed);
    const overallPassed = allSiteChecks && allSystemChecks;

    return (
      <View style={styles.checklistSection}>
        <View style={styles.checklistHeader}>
          <Text style={styles.checklistTitle}>Eligibility Checklist</Text>
          <View style={[styles.eligibilityBadge, overallPassed ? styles.eligible : styles.notEligible]}>
            <Text style={styles.eligibilityText}>
              {overallPassed ? 'Eligible' : 'Not Eligible'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.checklistSubtitle}>Site & Vicinity</Text>
        {siteVicinityChecks.map((check, index) => (
          <View key={index} style={styles.checkItem}>
            <Text style={[styles.checkIcon, check.passed ? styles.checkPassed : styles.checkFailed]}>
              {check.passed ? '✓' : '✗'}
            </Text>
            <Text style={[styles.checkLabel, !check.passed && styles.checkLabelFailed]}>
              {check.label}
            </Text>
          </View>
        ))}

        <Text style={styles.checklistSubtitle}>Systems & Safety</Text>
        {systemChecks.map((check, index) => (
          <View key={index} style={styles.checkItem}>
            <Text style={[styles.checkIcon, check.passed ? styles.checkPassed : styles.checkFailed]}>
              {check.passed ? '✓' : '✗'}
            </Text>
            <Text style={[styles.checkLabel, !check.passed && styles.checkLabelFailed]}>
              {check.label}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* YouTube Link Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Evaluation Video</Text>
        {!youtubeLink && !isEditingYoutube && (
          <TouchableOpacity
            style={styles.addVideoButton}
            onPress={() => setIsEditingYoutube(true)}
          >
            <Text style={styles.addVideoButtonText}>Add Video Link</Text>
          </TouchableOpacity>
        )}
        
        {isEditingYoutube && (
          <View style={styles.videoEditContainer}>
            <TextInput
              style={styles.videoInput}
              value={tempYoutubeLink}
              onChangeText={setTempYoutubeLink}
              placeholder="Enter YouTube video URL"
            />
            <View style={styles.videoButtons}>
              <TouchableOpacity
                style={styles.videoSaveButton}
                onPress={() => {
                  setYoutubeLink(tempYoutubeLink);
                  setIsEditingYoutube(false);
                }}
              >
                <Text style={styles.videoSaveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.videoCancelButton}
                onPress={() => {
                  setTempYoutubeLink(youtubeLink);
                  setIsEditingYoutube(false);
                }}
              >
                <Text style={styles.videoCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {youtubeLink && !isEditingYoutube && (
          <View style={styles.videoLinkContainer}>
            <TouchableOpacity
              onPress={() => {/* Open YouTube link */}}
              style={styles.videoLinkButton}
            >
              <Text style={styles.videoLinkText}>Watch Evaluation Video</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.videoEditButton}
              onPress={() => setIsEditingYoutube(true)}
            >
              <Text style={styles.videoEditButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Evaluation Sections */}
      {renderSection('Basic Systems', evaluationData.basicSystems, 'basicSystems')}
      {renderSection('Structure', evaluationData.structure, 'structure')}
      {renderSection('Interior', evaluationData.interior, 'interior')}
      {renderSection('Site & Vicinity', evaluationData.siteVicinity, 'siteVicinity')}

      {/* Save Button */}
      <View style={styles.saveSection}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Evaluation'}
          </Text>
        </TouchableOpacity>
        
        {/* Test button for debugging */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: '#6B7280', marginTop: 8 }]}
          onPress={testSupabaseConnection}
        >
          <Text style={styles.saveButtonText}>Test Connection</Text>
        </TouchableOpacity>
      </View>

      {/* Eligibility Checklist */}
      {renderEligibilityChecklist()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  fieldContainer: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  multiSelectGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  buttonActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  buttonTextActive: {
    color: '#1D4ED8',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
  },
  addVideoButton: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  addVideoButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  videoEditContainer: {
    gap: 8,
  },
  videoInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
  },
  videoButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  videoSaveButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  videoSaveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  videoCancelButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  videoCancelButtonText: {
    color: '#374151',
  },
  videoLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  videoLinkButton: {
    flex: 1,
  },
  videoLinkText: {
    color: '#3B82F6',
    fontSize: 14,
  },
  videoEditButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  videoEditButtonText: {
    color: '#374151',
    fontSize: 12,
  },
  saveSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  checklistSection: {
    margin: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  checklistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  checklistTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  eligibilityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  eligible: {
    backgroundColor: '#D1FAE5',
  },
  notEligible: {
    backgroundColor: '#FEE2E2',
  },
  eligibilityText: {
    fontWeight: '600',
  },
  checklistSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkIcon: {
    fontSize: 18,
    marginRight: 8,
    width: 20,
  },
  checkPassed: {
    color: '#059669',
  },
  checkFailed: {
    color: '#DC2626',
  },
  checkLabel: {
    fontSize: 14,
    color: '#374151',
  },
  checkLabelFailed: {
    color: '#DC2626',
  },
}); 