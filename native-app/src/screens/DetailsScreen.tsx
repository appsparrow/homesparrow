import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Alert,
  Linking,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase, Home, HomeChecklist, StatusUpdate, HomeNote, HomeImage, Status } from '../lib/supabase-simple';

const statusOrder: Status[] = ['New', 'Contacted', 'Seen', 'Liked', 'Disliked', 'Offer Made', 'Accepted'];

export default function DetailsScreen({ route, navigation }: any) {
  const { home } = route.params;
  const [checklist, setChecklist] = useState<HomeChecklist | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusUpdate[]>([]);
  const [notes, setNotes] = useState<HomeNote[]>([]);
  const [images, setImages] = useState<HomeImage[]>([]);
  const [newNote, setNewNote] = useState('');
  const [offerAmount, setOfferAmount] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<Status>(home.current_status || 'New');
  const [showHistory, setShowHistory] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<Status | null>(null);
  const [statusDate, setStatusDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, [home.id]);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchChecklist(),
        fetchStatusHistory(),
        fetchNotes(),
        fetchImages(),
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchChecklist = async () => {
    const { data, error } = await supabase
      .from('home_checklists')
      .select('*')
      .eq('home_id', home.id);

    if (!error && data && data.length > 0) {
      setChecklist(data[0]);
    }
  };

  const fetchStatusHistory = async () => {
    const { data, error } = await supabase
      .from('status_updates')
      .select('*')
      .eq('home_id', home.id);

    if (!error && data) {
      setStatusHistory(data);
    }
  };

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from('home_notes')
      .select('*')
      .eq('home_id', home.id);

    if (!error && data) {
      setNotes(data);
    }
  };

  const fetchImages = async () => {
    const { data, error } = await supabase
      .from('home_images')
      .select('*')
      .eq('home_id', home.id);

    if (!error && data) {
      setImages(data);
    }
  };

  const handleStatusClick = (status: Status) => {
    setPendingStatus(status);
    setStatusDate(new Date().toISOString().split('T')[0]);
    setShowStatusModal(true);
  };

  const handleStatusConfirm = async () => {
    if (pendingStatus) {
      try {
        setSelectedStatus(pendingStatus);
        const { error } = await supabase
          .from('status_updates')
          .insert({
            home_id: home.id,
            status: pendingStatus,
            notes: newNote || undefined,
            offer_amount: offerAmount ? parseFloat(offerAmount) : undefined,
            date: statusDate,
          });

        if (error) throw error;
        
        setShowStatusModal(false);
        setPendingStatus(null);
        setStatusDate(new Date().toISOString().split('T')[0]);
        setNewNote('');
        setOfferAmount('');
        fetchStatusHistory();
      } catch (error: any) {
        Alert.alert('Error', error.message);
      }
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      const { error } = await supabase
        .from('home_notes')
        .insert({
          home_id: home.id,
          note: newNote.trim(),
          status: home.current_status,
          date: new Date().toISOString(),
        });

      if (error) throw error;
      setNewNote('');
      fetchNotes();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleImageUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        // For now, just show success - storage upload would need more setup
        Alert.alert('Success', 'Image upload feature coming soon!');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteStatusHistory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('status_updates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchStatusHistory();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Status Modal */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Status: {pendingStatus}</Text>
            
            <Text style={styles.modalLabel}>Date</Text>
            <TextInput
              style={styles.modalInput}
              value={statusDate}
              onChangeText={setStatusDate}
              placeholder="YYYY-MM-DD"
            />

            {pendingStatus === 'Offer Made' && (
              <>
                <Text style={styles.modalLabel}>Offer Amount</Text>
                <TextInput
                  style={styles.modalInput}
                  value={offerAmount}
                  onChangeText={setOfferAmount}
                  placeholder="Enter offer amount"
                  keyboardType="numeric"
                />
              </>
            )}

            <Text style={styles.modalLabel}>Note (optional)</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              value={newNote}
              onChangeText={setNewNote}
              placeholder="Add a note..."
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton} 
                onPress={() => setShowStatusModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalConfirmButton} 
                onPress={handleStatusConfirm}
              >
                <Text style={styles.modalConfirmText}>Set</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Home Details</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(home.zillow_url)}
            style={styles.zillowButton}
          >
            <Text style={styles.zillowButtonText}>View on Zillow</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.address}>{home.address}</Text>
      </View>

      {/* Status Updates */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status Updates</Text>
        <View style={styles.statusButtons}>
          {statusOrder.map((status) => (
            <TouchableOpacity
              key={status}
              onPress={() => handleStatusClick(status)}
              style={[
                styles.statusButton,
                selectedStatus === status && styles.statusButtonActive,
              ]}
            >
              <Text style={[
                styles.statusButtonText,
                selectedStatus === status && styles.statusButtonTextActive,
              ]}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Add Note Section */}
        <View style={styles.noteInputSection}>
          <TextInput
            style={styles.noteInput}
            value={newNote}
            onChangeText={setNewNote}
            placeholder="Add a note..."
            multiline
          />
          <TouchableOpacity
            style={styles.addNoteButton}
            onPress={handleAddNote}
          >
            <Text style={styles.addNoteButtonText}>Add Note</Text>
          </TouchableOpacity>
        </View>

        {/* Status History */}
        <TouchableOpacity
          onPress={() => setShowHistory(!showHistory)}
          style={styles.historyToggle}
        >
          <Text style={styles.historyToggleText}>
            {showHistory ? 'Hide History' : 'Show History'}
          </Text>
        </TouchableOpacity>

        {showHistory && (
          <View style={styles.historyContainer}>
            {statusHistory.reverse().map((update) => (
              <View key={update.id} style={styles.historyItem}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyStatus}>{update.status}</Text>
                  <View style={styles.historyActions}>
                    <Text style={styles.historyDate}>
                      {new Date(update.date).toLocaleDateString()}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteStatusHistory(update.id)}
                      style={styles.deleteButton}
                    >
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {update.notes && (
                  <Text style={styles.historyNotes}>{update.notes}</Text>
                )}
                {update.offer_amount && (
                  <Text style={styles.historyOffer}>
                    Offer: ${update.offer_amount.toLocaleString()}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Images */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Images</Text>
        <View style={styles.imageGrid}>
          {images.map((image) => (
            <View key={image.id} style={styles.imageContainer}>
              <Image
                source={{ uri: image.image_url }}
                style={styles.image}
              />
              <View style={styles.imageOverlay}>
                <TouchableOpacity style={styles.imageActionButton}>
                  <Text style={styles.imageActionText}>Set Primary</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.imageActionButton, styles.deleteImageButton]}>
                  <Text style={styles.imageActionText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleImageUpload}
          >
            <Text style={styles.uploadButtonText}>Upload Image</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Evaluate Button */}
      <View style={styles.section}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Evaluate', { home })}
          style={styles.evaluateButton}
        >
          <Text style={styles.evaluateButtonText}>Evaluate Home</Text>
        </TouchableOpacity>
      </View>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  address: {
    fontSize: 16,
    color: '#374151',
  },
  zillowButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  zillowButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  statusButtonActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563',
  },
  statusButtonTextActive: {
    color: '#1D4ED8',
  },
  noteInputSection: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  noteInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 12,
    minHeight: 40,
    textAlignVertical: 'top',
  },
  addNoteButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: 'center',
  },
  addNoteButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  historyToggle: {
    marginBottom: 8,
  },
  historyToggleText: {
    color: '#3B82F6',
    fontSize: 14,
  },
  historyContainer: {
    gap: 12,
  },
  historyItem: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 6,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyStatus: {
    fontWeight: '500',
    color: '#374151',
  },
  historyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    fontSize: 12,
  },
  historyNotes: {
    marginTop: 4,
    color: '#374151',
  },
  historyOffer: {
    marginTop: 4,
    fontWeight: '500',
    color: '#059669',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageContainer: {
    width: '45%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 6,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    opacity: 0,
  },
  imageActionButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  deleteImageButton: {
    backgroundColor: '#EF4444',
  },
  imageActionText: {
    color: '#fff',
    fontSize: 12,
  },
  uploadButton: {
    width: '45%',
    height: 120,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#6B7280',
    fontSize: 14,
  },
  evaluateButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  evaluateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#374151',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  modalTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalCancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  modalCancelText: {
    color: '#374151',
  },
  modalConfirmButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
  },
  modalConfirmText: {
    color: '#fff',
    fontWeight: '600',
  },
}); 