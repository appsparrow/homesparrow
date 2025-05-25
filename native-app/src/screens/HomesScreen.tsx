import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { supabase, Home, HomeChecklist, HomeImage } from '../lib/supabase-simple';

export default function HomesScreen({ navigation }: any) {
  const [homes, setHomes] = useState<Home[]>([]);
  const [homeChecklists, setHomeChecklists] = useState<Record<string, HomeChecklist>>({});
  const [homeImages, setHomeImages] = useState<Record<string, HomeImage[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomes();
  }, []);

  const fetchHomes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('homes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setHomes(data);
        // Fetch checklists and images for each home
        data.forEach((home: any) => {
          fetchHomeChecklist(home.id);
          fetchHomeImages(home.id);
        });
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchHomeChecklist = async (homeId: string) => {
    const { data, error } = await supabase
      .from('home_checklists')
      .select('*')
      .eq('home_id', homeId);

    if (!error && data && data.length > 0) {
      setHomeChecklists(prev => ({
        ...prev,
        [homeId]: data[0]
      }));
    }
  };

  const fetchHomeImages = async (homeId: string) => {
    const { data, error } = await supabase
      .from('home_images')
      .select('*')
      .eq('home_id', homeId);

    if (!error && data) {
      setHomeImages(prev => ({
        ...prev,
        [homeId]: data
      }));
    }
  };

  const checkIfMeetsCriteria = (checklist: HomeChecklist): boolean => {
    return (
      checklist.three_bed &&
      checklist.two_bath &&
      checklist.under_200k &&
      checklist.no_basement &&
      checklist.no_trees_back &&
      checklist.brick &&
      checklist.updated &&
      checklist.ranch
    );
  };

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

  const renderHomeItem = ({ item: home }: { item: Home }) => {
    const checklist = homeChecklists[home.id];
    const meetsCriteria = checklist ? checkIfMeetsCriteria(checklist) : false;
    const images = homeImages[home.id] || [];
    const primaryImage = images.find(img => img.is_primary);
    const completion = checklist ? getChecklistCompletion(checklist) : { met: 0, total: 8 };

    return (
      <TouchableOpacity
        style={[
          styles.homeItem,
          meetsCriteria && styles.meetsCriteria
        ]}
        onPress={() => navigation.navigate('Details', { home })}
      >
        <View style={styles.homeContent}>
          {primaryImage && (
            <Image
              source={{ uri: primaryImage.image_url }}
              style={styles.homeImage}
            />
          )}
          <View style={styles.homeDetails}>
            <Text style={styles.address}>{home.address}</Text>
            <View style={styles.metaInfo}>
              <Text style={[
                styles.criteriaText,
                meetsCriteria && styles.metCriteria
              ]}>
                {completion.met}/{completion.total} Criteria
              </Text>
              {meetsCriteria && <Text style={styles.checkmark}>✅</Text>}
              <TouchableOpacity
                onPress={() => Linking.openURL(home.zillow_url)}
                style={styles.zillowLink}
              >
                <Text style={styles.zillowLinkText}>View on Zillow</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={homes}
        renderItem={renderHomeItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No homes added yet</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContent: {
    padding: 16,
  },
  homeItem: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  meetsCriteria: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  homeContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  homeImage: {
    width: 64,
    height: 64,
    borderRadius: 4,
    marginRight: 12,
  },
  homeDetails: {
    flex: 1,
  },
  address: {
    fontSize: 16,
    fontWeight: '500',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  criteriaText: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 8,
  },
  metCriteria: {
    color: '#059669',
  },
  checkmark: {
    marginRight: 8,
  },
  zillowLink: {
    marginLeft: 'auto',
  },
  zillowLinkText: {
    color: '#2563EB',
    fontSize: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    padding: 16,
  },
}); 