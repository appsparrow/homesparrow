const EnvDebug = () => {
  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg text-sm">
      <h3 className="font-bold mb-2">Environment Variables:</h3>
      <pre className="whitespace-pre-wrap">
        {JSON.stringify({
          VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
          VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
        }, null, 2)}
      </pre>
    </div>
  );
};

export default EnvDebug; 