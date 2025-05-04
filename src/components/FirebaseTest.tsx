import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';

const FirebaseTest = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Try to read from Firestore
        const querySnapshot = await getDocs(collection(db, 'test'));
        setIsConnected(true);
        console.log('Firebase connection successful!');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect to Firebase');
        console.error('Firebase connection error:', err);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Firebase Connection Test</h2>
      {isConnected ? (
        <div className="text-green-600">✅ Firebase is connected successfully!</div>
      ) : error ? (
        <div className="text-red-600">❌ Error: {error}</div>
      ) : (
        <div className="text-yellow-600">⏳ Testing connection...</div>
      )}
    </div>
  );
};

export default FirebaseTest;
