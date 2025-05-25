import { useEffect, useState, useRef } from 'react'
import { supabase, handleSupabaseError } from './lib/supabase'
import type { 
  Home, 
  HomeChecklist, 
  StatusUpdate, 
  HomeNote, 
  Status,
  HomeEvaluationData,
  HomeBasicSystems,
  HomeStructure,
  HomeInterior,
  HomeBedroom,
  HomeSiteVicinity
} from './lib/supabase'
import AddHomeForm from './components/AddHomeForm'
import AddressList from './components/AddressList'
import HomeDetailsPanel from './components/HomeDetailsPanel'
import ChecklistPanel from './components/ChecklistPanel'
import HomeEvaluationChecklist from './components/HomeEvaluationChecklist'
import { AuthProvider, useAuth } from './components/AuthProvider'
import LoginPage from './components/LoginPage'
import StickyAddressBar from './components/StickyAddressBar'

interface HomeImage {
  id: string;
  home_id: string;
  image_url: string;
  is_primary: boolean;
  created_at: string;
}

function AppContent() {
  const { user, signOut } = useAuth();
  const [homes, setHomes] = useState<Home[]>([])
  const [homeChecklists, setHomeChecklists] = useState<Record<string, HomeChecklist>>({})
  const [selectedHome, setSelectedHome] = useState<Home | null>(null)
  const [statusHistory, setStatusHistory] = useState<StatusUpdate[]>([])
  const [notes, setNotes] = useState<HomeNote[]>([])
  const [homeImages, setHomeImages] = useState<Record<string, HomeImage[]>>({})
  const [activePanel, setActivePanel] = useState<'list' | 'details' | 'evaluation'>('list')
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [activeMiddlePanel, setActiveMiddlePanel] = useState<'zillow' | 'evaluation'>('zillow')
  const [showActions, setShowActions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [evaluationData, setEvaluationData] = useState<Record<string, HomeEvaluationData>>({})

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      if (activePanel === 'list') setActivePanel('details')
      else if (activePanel === 'details') setActivePanel('evaluation')
    }
    if (isRightSwipe) {
      if (activePanel === 'evaluation') setActivePanel('details')
      else if (activePanel === 'details') setActivePanel('list')
    }
  }

  useEffect(() => {
    if (user) {
      fetchHomes();
    }
  }, [user]);

  useEffect(() => {
    if (selectedHome) {
      fetchHomeChecklist(selectedHome.id)
      fetchStatusHistory(selectedHome.id)
      fetchNotes(selectedHome.id)
      fetchHomeImages(selectedHome.id)
      fetchHomeEvaluation(selectedHome.id)
    }
  }, [selectedHome])

  async function fetchHomes() {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('homes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) throw new Error('No data returned');
      
      setHomes(data);
      if (data.length > 0 && !selectedHome) {
        setSelectedHome(data[0]);
      }
    } catch (err: any) {
      console.error('Error fetching homes:', err);
      setError(err.message || 'Failed to fetch homes');
    }
  }

  async function fetchHomeChecklist(homeId: string) {
    const { data, error } = await supabase
      .from('home_checklists')
      .select('*')
      .eq('home_id', homeId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No checklist found, create a new one
        createEmptyChecklist(homeId)
      } else {
        console.error('Error fetching checklist:', error)
      }
    } else {
      setHomeChecklists(prev => ({
        ...prev,
        [homeId]: data as HomeChecklist
      }))
    }
  }

  async function createEmptyChecklist(homeId: string) {
    const newChecklist = {
      home_id: homeId,
      three_bed: false,
      two_bath: false,
      under_200k: false,
      no_basement: false,
      no_trees_back: false,
      brick: false,
      updated: false,
      ranch: false,
      notes: ''
    }

    const { data, error } = await supabase
      .from('home_checklists')
      .insert(newChecklist)
      .select()

    if (error) {
      console.error('Error creating checklist:', error)
    } else {
      setHomeChecklists(prev => ({
        ...prev,
        [homeId]: data[0] as HomeChecklist
      }))
    }
  }

  async function updateChecklist(homeId: string, field: keyof HomeChecklist, value: boolean | string) {
    const updates = {
      [field]: value
    }

    const { error } = await supabase
      .from('home_checklists')
      .update(updates)
      .eq('home_id', homeId)

    if (error) {
      console.error('Error updating checklist:', error)
    } else {
      setHomeChecklists(prev => ({
        ...prev,
        [homeId]: {
          ...prev[homeId],
          [field]: value
        }
      }))
    }
  }

  async function addHome(data: { address: string; zillowUrl: string; askingPrice: number; agentName?: string }) {
    const { error } = await supabase
      .from('homes')
      .insert([{ 
        address: data.address, 
        zillow_url: data.zillowUrl,
        asking_price: data.askingPrice,
        agent_name: data.agentName,
        user_id: user?.id
      }])
      .select();

    if (error) {
      console.error('Error adding home:', error);
    } else {
      fetchHomes();
    }
  }

  function checkIfMeetsCriteria(checklist: HomeChecklist): boolean {
    return (
      checklist.three_bed &&
      checklist.two_bath &&
      checklist.under_200k &&
      checklist.no_basement &&
      checklist.no_trees_back &&
      checklist.brick &&
      checklist.updated &&
      checklist.ranch
    )
  }

  async function fetchStatusHistory(homeId: string) {
    const { data, error } = await supabase
      .from('status_updates')
      .select('*')
      .eq('home_id', homeId)
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching status history:', error)
    } else {
      setStatusHistory(data as StatusUpdate[])
    }
  }

  async function fetchNotes(homeId: string) {
    const { data, error } = await supabase
      .from('home_notes')
      .select('*')
      .eq('home_id', homeId)
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching notes:', error)
    } else {
      setNotes(data as HomeNote[])
    }
  }

  async function handleUpdateStatus(status: Status, note?: string, offerAmount?: number, date?: string) {
    if (!selectedHome) return;

    // Check if status already exists for this home
    const { data: existing, error: fetchError } = await supabase
      .from('status_updates')
      .select('*')
      .eq('home_id', selectedHome.id)
      .eq('status', status)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking status:', fetchError);
      return;
    }

    const statusUpdate = {
      home_id: selectedHome.id,
      status,
      notes: note,
      offer_amount: offerAmount,
      ...(date ? { date: new Date(date).toISOString() } : {})
    };

    let upsertError;
    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('status_updates')
        .update(statusUpdate)
        .eq('id', existing.id);
      upsertError = error;
    } else {
      // Insert new
      const { error } = await supabase
        .from('status_updates')
        .insert(statusUpdate);
      upsertError = error;
    }

    if (upsertError) {
      console.error('Error updating status:', upsertError);
    } else {
      fetchStatusHistory(selectedHome.id);
      fetchHomes(); // Refresh homes to get updated status
    }
  }

  async function handleDeleteStatusHistory(id: string) {
    const { error } = await supabase
      .from('status_updates')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error deleting status history:', error);
    } else if (selectedHome) {
      fetchStatusHistory(selectedHome.id);
    }
  }

  async function handleAddNote(note: string) {
    if (!selectedHome) return

    const newNote = {
      home_id: selectedHome.id,
      note,
      status: selectedHome.current_status
    }

    const { error } = await supabase
      .from('home_notes')
      .insert(newNote)

    if (error) {
      console.error('Error adding note:', error)
    } else {
      fetchNotes(selectedHome.id)
    }
  }

  async function handleUpdateHome(data: Partial<Home>) {
    if (!selectedHome) return;
    
    try {
      const { error } = await supabase
        .from('homes')
        .update(data)
        .eq('id', selectedHome.id);

      if (error) throw error;

      // Update local state
      setHomes(homes.map(home => 
        home.id === selectedHome.id ? { ...home, ...data } : home
      ));
      setSelectedHome(prev => prev ? { ...prev, ...data } : prev);
    } catch (error) {
      console.error('Error updating home:', error);
    }
  }

  async function handleDeleteHome() {
    if (!selectedHome) return;

    const { error } = await supabase
      .from('homes')
      .delete()
      .eq('id', selectedHome.id);

    if (error) {
      console.error('Error deleting home:', error);
    } else {
      setSelectedHome(null);
      fetchHomes();
    }
  }

  async function fetchHomeImages(homeId: string) {
    const { data, error } = await supabase
      .from('home_images')
      .select('*')
      .eq('home_id', homeId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching home images:', error)
    } else {
      setHomeImages(prev => ({
        ...prev,
        [homeId]: data as HomeImage[]
      }))
    }
  }

  async function handleUploadImage(homeId: string, file: File) {
    try {
      // Check if bucket exists, if not create it
      const { data: buckets, error: bucketsError } = await supabase
        .storage
        .listBuckets();

      if (bucketsError) throw bucketsError;

      const homeImagesBucket = buckets.find(b => b.name === 'home-images');
      
      if (!homeImagesBucket) {
        const { error: createBucketError } = await supabase
          .storage
          .createBucket('home-images', {
            public: true,
            fileSizeLimit: 5242880, // 5MB
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif']
          });

        if (createBucketError) throw createBucketError;
      }

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${homeId}/${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('home-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('home-images')
        .getPublicUrl(fileName);

      // Create image record in database
      const { error: dbError } = await supabase
        .from('home_images')
        .insert({
          home_id: homeId,
          image_url: publicUrl,
          is_primary: !homeImages[homeId]?.length // Make primary if first image
        });

      if (dbError) throw dbError;

      // Refresh images
      fetchHomeImages(homeId);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    }
  }

  async function handleDeleteImage(imageId: string, homeId: string) {
    const { error } = await supabase
      .from('home_images')
      .delete()
      .eq('id', imageId)

    if (error) {
      console.error('Error deleting image:', error)
    } else {
      fetchHomeImages(homeId)
    }
  }

  async function handleSetPrimaryImage(imageId: string, homeId: string) {
    const { error } = await supabase
      .from('home_images')
      .update({ is_primary: true })
      .eq('id', imageId)

    if (error) {
      console.error('Error setting primary image:', error)
    } else {
      fetchHomeImages(homeId)
    }
  }

  async function handleSaveEvaluation(evaluationData: HomeEvaluationData) {
    if (!selectedHome) return;

    try {
      // Save basic systems
      const { error: basicSystemsError } = await supabase
        .from('home_basic_systems')
        .upsert({
          home_id: selectedHome.id,
          ...evaluationData.basicSystems
        });

      if (basicSystemsError) throw basicSystemsError;

      // Save structure
      const { error: structureError } = await supabase
        .from('home_structure')
        .upsert({
          home_id: selectedHome.id,
          ...evaluationData.structure
        });

      if (structureError) throw structureError;

      // Save interior
      const { error: interiorError } = await supabase
        .from('home_interior')
        .upsert({
          home_id: selectedHome.id,
          ...evaluationData.interior
        });

      if (interiorError) throw interiorError;

      // Save site vicinity
      const { error: vicinityError } = await supabase
        .from('home_site_vicinity')
        .upsert({
          home_id: selectedHome.id,
          ...evaluationData.siteVicinity
        });

      if (vicinityError) throw vicinityError;

      // Save bedrooms
      for (const [bedroomName, bedroomData] of Object.entries(evaluationData.bedrooms)) {
        const { error: bedroomError } = await supabase
          .from('home_bedrooms')
          .upsert({
            home_id: selectedHome.id,
            bedroom_name: bedroomName,
            ...bedroomData
          });

        if (bedroomError) throw bedroomError;
      }

      // Save YouTube link to homes table if present
      if (evaluationData.youtube_link !== undefined) {
        const { error: youtubeError } = await supabase
          .from('homes')
          .update({ youtube_link: evaluationData.youtube_link })
          .eq('id', selectedHome.id);
        if (youtubeError) throw youtubeError;
      }

      alert('Evaluation saved successfully!');
    } catch (error) {
      console.error('Error saving evaluation:', error);
      alert('Error saving evaluation. Please try again.');
    }
  }

  async function fetchHomeEvaluation(homeId: string) {
    try {
      // Fetch basic systems
      const { data: basicSystems, error: basicSystemsError } = await supabase
        .from('home_basic_systems')
        .select('*')
        .eq('home_id', homeId)
        .single();

      if (basicSystemsError && basicSystemsError.code !== 'PGRST116') {
        throw basicSystemsError;
      }

      // Fetch structure
      const { data: structure, error: structureError } = await supabase
        .from('home_structure')
        .select('*')
        .eq('home_id', homeId)
        .single();

      if (structureError && structureError.code !== 'PGRST116') {
        throw structureError;
      }

      // Fetch interior
      const { data: interior, error: interiorError } = await supabase
        .from('home_interior')
        .select('*')
        .eq('home_id', homeId)
        .single();

      if (interiorError && interiorError.code !== 'PGRST116') {
        throw interiorError;
      }

      // Fetch bedrooms
      const { data: bedrooms, error: bedroomsError } = await supabase
        .from('home_bedrooms')
        .select('*')
        .eq('home_id', homeId);

      if (bedroomsError) {
        throw bedroomsError;
      }

      // Fetch site vicinity
      const { data: siteVicinity, error: vicinityError } = await supabase
        .from('home_site_vicinity')
        .select('*')
        .eq('home_id', homeId)
        .single();

      if (vicinityError && vicinityError.code !== 'PGRST116') {
        throw vicinityError;
      }

      // Transform bedrooms data into the expected format
      const bedroomsData = bedrooms?.reduce((acc, bedroom) => {
        const { bedroom_name, ...rest } = bedroom;
        acc[bedroom_name] = rest;
        return acc;
      }, {} as Record<string, any>) || {};

      const evaluation: HomeEvaluationData = {
        basicSystems: basicSystems || {},
        structure: structure || {},
        interior: interior || {},
        bedrooms: bedroomsData,
        siteVicinity: siteVicinity || {}
      };

      setEvaluationData(prev => ({
        ...prev,
        [homeId]: evaluation
      }));
    } catch (error) {
      console.error('Error fetching home evaluation:', error);
    }
  }

  // When a home is selected in the Homes tab, go to Details tab on mobile
  function handleSelectHome(home: Home) {
    setSelectedHome(home);
    setShowActions(false); // Close any open menus
    if (window.innerWidth < 768) setActivePanel('details');
    // Reset scroll position for details/evaluation panels
    setTimeout(() => {
      document.querySelectorAll('.details-scroll, .evaluation-scroll').forEach(el => {
        el.scrollTop = 0;
      });
    }, 0);
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-100">
      {/* Header - Fixed at top */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-4 py-2 flex flex-col z-50">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Home Review</h1>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Sign Out
          </button>
        </div>
        {((activePanel === 'details' || activePanel === 'evaluation') && selectedHome) && (
          <div className="w-full text-base font-medium text-gray-700 whitespace-normal break-words mt-1">
            {selectedHome.address}
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden pt-16 pb-20">
        <div className="hidden md:flex h-full">
          {/* Homes Panel (Left) */}
          <div className="w-1/4 bg-white overflow-y-auto border-r border-gray-200 pt-0 flex-shrink-0">
            <div className="p-4">
              <AddHomeForm onAddHome={addHome} />
              <AddressList
                homes={homes}
                selectedHome={selectedHome}
                onSelectHome={handleSelectHome}
                homeChecklists={homeChecklists}
                homeImages={homeImages}
                checkIfMeetsCriteria={checkIfMeetsCriteria}
              />
            </div>
          </div>
          {/* Details Panel (Center) */}
          <div className="w-1/2 bg-white overflow-y-auto border-x border-gray-200 pt-0 flex-shrink-0 details-scroll">
            {selectedHome ? (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto pb-20">
                  <div className="p-4">
                    <HomeDetailsPanel
                      selectedHome={selectedHome}
                      onUpdateStatus={handleUpdateStatus}
                      onAddNote={handleAddNote}
                      onUploadImage={handleUploadImage}
                      onDeleteImage={handleDeleteImage}
                      onSetPrimaryImage={handleSetPrimaryImage}
                      onUpdateHome={handleUpdateHome}
                      statusHistory={statusHistory}
                      notes={notes}
                      images={homeImages[selectedHome.id] || []}
                      onDeleteStatusHistory={handleDeleteStatusHistory}
                    />
                    <div className="mt-6 bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-4">Home Criteria Checklist</h3>
                      {homeChecklists[selectedHome.id] ? (
                        <ChecklistPanel
                          checklist={homeChecklists[selectedHome.id]}
                          onUpdateChecklist={(field, value) => updateChecklist(selectedHome.id, field, value)}
                        />
                      ) : (
                        <div className="text-center text-gray-500">
                          Loading checklist...
                        </div>
                      )}
                    </div>
                    <div className="w-full flex justify-center mt-8 mb-8">
                      <button
                        onClick={handleDeleteHome}
                        className="w-full max-w-xs px-4 py-3 bg-red-600 text-white rounded-md font-semibold shadow hover:bg-red-700 transition"
                      >
                        Delete Home
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Select a home to view details
              </div>
            )}
          </div>
          {/* Evaluate Panel (Right) */}
          <div className="w-1/4 bg-white overflow-y-auto border-l border-gray-200 pt-0 flex-shrink-0 evaluation-scroll">
            {selectedHome && (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto">
                  <div className="pb-20">
                    <HomeEvaluationChecklist
                      key={selectedHome.id}
                      home={selectedHome}
                      onSave={handleSaveEvaluation}
                      initialData={evaluationData[selectedHome.id]}
                    />
                    <div className="w-full flex justify-center mt-8 mb-8">
                      <button
                        onClick={handleDeleteHome}
                        className="w-full max-w-xs px-4 py-3 bg-red-600 text-white rounded-md font-semibold shadow hover:bg-red-700 transition"
                      >
                        Delete Home
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Mobile: Only show one panel at a time */}
        <div className="md:hidden h-full">
          {/* Homes Panel */}
          <div className={`${activePanel === 'list' ? 'block' : 'hidden'} h-full`}> 
            <div className="p-4">
              <AddHomeForm onAddHome={addHome} />
              <AddressList
                homes={homes}
                selectedHome={selectedHome}
                onSelectHome={handleSelectHome}
                homeChecklists={homeChecklists}
                homeImages={homeImages}
                checkIfMeetsCriteria={checkIfMeetsCriteria}
              />
            </div>
          </div>
          {/* Details Panel */}
          <div className={`${activePanel === 'details' ? 'block' : 'hidden'} h-full`}>
            {selectedHome ? (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto pb-20">
                  <div className="p-4">
                    <HomeDetailsPanel
                      selectedHome={selectedHome}
                      onUpdateStatus={handleUpdateStatus}
                      onAddNote={handleAddNote}
                      onUploadImage={handleUploadImage}
                      onDeleteImage={handleDeleteImage}
                      onSetPrimaryImage={handleSetPrimaryImage}
                      onUpdateHome={handleUpdateHome}
                      statusHistory={statusHistory}
                      notes={notes}
                      images={homeImages[selectedHome.id] || []}
                      onDeleteStatusHistory={handleDeleteStatusHistory}
                    />
                    <div className="mt-6 bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-4">Home Criteria Checklist</h3>
                      {homeChecklists[selectedHome.id] ? (
                        <ChecklistPanel
                          checklist={homeChecklists[selectedHome.id]}
                          onUpdateChecklist={(field, value) => updateChecklist(selectedHome.id, field, value)}
                        />
                      ) : (
                        <div className="text-center text-gray-500">
                          Loading checklist...
                        </div>
                      )}
                    </div>
                    <div className="w-full flex justify-center mt-8 mb-8">
                      <button
                        onClick={handleDeleteHome}
                        className="w-full max-w-xs px-4 py-3 bg-red-600 text-white rounded-md font-semibold shadow hover:bg-red-700 transition"
                      >
                        Delete Home
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Select a home to view details
              </div>
            )}
          </div>
          {/* Evaluate Panel */}
          <div className={`${activePanel === 'evaluation' ? 'block' : 'hidden'} h-full`}>
            {selectedHome && (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto">
                  <div className="pb-20">
                    <HomeEvaluationChecklist
                      key={selectedHome.id}
                      home={selectedHome}
                      onSave={handleSaveEvaluation}
                      initialData={evaluationData[selectedHome.id]}
                    />
                    <div className="w-full flex justify-center mt-8 mb-8">
                      <button
                        onClick={handleDeleteHome}
                        className="w-full max-w-xs px-4 py-3 bg-red-600 text-white rounded-md font-semibold shadow hover:bg-red-700 transition"
                      >
                        Delete Home
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16">
          <button onClick={() => setActivePanel('list')} className={`flex flex-col items-center w-full ${activePanel === 'list' ? 'text-blue-600' : 'text-gray-500'}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            <span className="text-xs mt-1">Homes</span>
          </button>
          <button onClick={() => setActivePanel('details')} className={`flex flex-col items-center w-full ${activePanel === 'details' ? 'text-blue-600' : 'text-gray-500'}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            <span className="text-xs mt-1">Details</span>
          </button>
          <button onClick={() => setActivePanel('evaluation')} className={`flex flex-col items-center w-full ${activePanel === 'evaluation' ? 'text-blue-600' : 'text-gray-500'}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-xs mt-1">Evaluate</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App
