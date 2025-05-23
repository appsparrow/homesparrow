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
import ZillowViewer from './components/ZillowViewer'
import ChecklistPanel from './components/ChecklistPanel'
import HomeEvaluationChecklist from './components/HomeEvaluationChecklist'
import { AuthProvider, useAuth } from './components/AuthProvider'
import LoginPage from './components/LoginPage'

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
  const [activePanel, setActivePanel] = useState<'list' | 'details' | 'checklist'>('list')
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
      else if (activePanel === 'details') setActivePanel('checklist')
    }
    if (isRightSwipe) {
      if (activePanel === 'checklist') setActivePanel('details')
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

  async function handleUpdateStatus(status: Status, note?: string, offerAmount?: number) {
    if (!selectedHome) return

    const statusUpdate = {
      home_id: selectedHome.id,
      status,
      notes: note,
      offer_amount: offerAmount
    }

    const { error } = await supabase
      .from('status_updates')
      .insert(statusUpdate)

    if (error) {
      console.error('Error updating status:', error)
    } else {
      fetchStatusHistory(selectedHome.id)
      fetchHomes() // Refresh homes to get updated status
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
    if (!selectedHome) return

    const { error } = await supabase
      .from('homes')
      .update(data)
      .eq('id', selectedHome.id)

    if (error) {
      console.error('Error updating home:', error)
    } else {
      fetchHomes()
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

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header - Fixed at top */}
      <header className="bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center">
        <h1 className="text-xl font-bold">Home Review</h1>
        <button
          onClick={() => signOut()}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
        >
          Sign Out
        </button>
      </header>

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-hidden relative">
        {/* Left Panel - Address List */}
        <div 
          className={`absolute inset-0 md:relative md:w-1/4 bg-white overflow-y-auto border-r border-gray-200 transition-transform duration-300 ease-in-out ${
            activePanel === 'list' ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="p-4 pb-20 md:pb-4">
            <h2 className="text-xl font-bold mb-4">Saved Homes</h2>
            <AddHomeForm onAddHome={addHome} />
            <AddressList 
              homes={homes} 
              selectedHome={selectedHome} 
              homeChecklists={homeChecklists}
              checkIfMeetsCriteria={checkIfMeetsCriteria}
              onSelectHome={(home) => {
                setSelectedHome(home);
                setActivePanel('details');
              }}
              homeImages={homeImages}
            />
          </div>
        </div>

        {/* Middle Panel - Home Details */}
        <div 
          className={`absolute inset-0 md:relative md:w-2/4 bg-white overflow-y-auto transition-transform duration-300 ease-in-out ${
            activePanel === 'details' ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
          }`}
        >
          <div className="pb-20 md:pb-4">
            {selectedHome ? (
              <>
                {/* Sticky Address Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-3 shadow-sm z-10">
                  <h2 className="text-lg font-semibold truncate">{selectedHome.address}</h2>
                </div>

                {/* Zillow Viewer */}
                <div className="border-b border-gray-200">
                  <ZillowViewer 
                    selectedHome={selectedHome}
                    onUpdateStatus={handleUpdateStatus}
                    onAddNote={handleAddNote}
                    onUploadImage={handleUploadImage}
                    onDeleteImage={handleDeleteImage}
                    onSetPrimaryImage={handleSetPrimaryImage}
                    statusHistory={statusHistory}
                    notes={notes}
                    images={selectedHome ? homeImages[selectedHome.id] || [] : []}
                  />
                </div>

                {/* Basic Checklist (Criteria) */}
                <div className="p-4 bg-gray-50">
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
              </>
            ) : (
              <div className="p-4 text-center text-gray-500">
                Select a home to view details
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Detailed Evaluation */}
        <div 
          className={`absolute inset-0 md:relative md:w-1/4 bg-white overflow-y-auto border-l border-gray-200 transition-transform duration-300 ease-in-out ${
            activePanel === 'checklist' ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
          }`}
        >
          <div className="pb-20 md:pb-4">
            {selectedHome ? (
              <>
                {/* Sticky Address Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-3 shadow-sm z-10">
                  <h2 className="text-lg font-semibold truncate">{selectedHome.address}</h2>
                </div>

                <div className="p-4">
                  <h2 className="text-xl font-bold mb-4">Detailed Evaluation</h2>
                  <HomeEvaluationChecklist
                    home={selectedHome}
                    onSave={handleSaveEvaluation}
                    initialData={evaluationData[selectedHome.id]}
                  />
                </div>
              </>
            ) : (
              <div className="p-4">
                <h2 className="text-xl font-bold mb-4">Detailed Evaluation</h2>
                <p>Select a home to start evaluation</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16">
          <button
            onClick={() => setActivePanel('list')}
            className={`flex flex-col items-center justify-center w-full h-full ${
              activePanel === 'list' ? 'text-indigo-600' : 'text-gray-500'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span className="text-xs mt-1">Homes</span>
          </button>
          <button
            onClick={() => setActivePanel('details')}
            className={`flex flex-col items-center justify-center w-full h-full ${
              activePanel === 'details' ? 'text-indigo-600' : 'text-gray-500'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1">Details</span>
          </button>
          <button
            onClick={() => setActivePanel('checklist')}
            className={`flex flex-col items-center justify-center w-full h-full ${
              activePanel === 'checklist' ? 'text-indigo-600' : 'text-gray-500'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
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
