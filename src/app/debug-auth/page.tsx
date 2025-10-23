'use client';

import { useEffect, useState } from 'react';

export default function DebugAuth() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Get user data
    const userData = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');

    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        console.log('Debug - Parsed user:', parsedUser);
      } catch (e) {
        console.error('Debug - Error parsing user:', e);
      }
    }

    setToken(accessToken);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Authentication Debug</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">User Data</h2>
          <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
            {user ? JSON.stringify(user, null, 2) : 'No user data found'}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Access Token</h2>
          <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto break-all">
            {token || 'No access token found'}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Authentication Status</h2>
          <div className="space-y-2">
            <p>
              <strong>Has User:</strong> {user ? '✅ Yes' : '❌ No'}
            </p>
            <p>
              <strong>Has Email:</strong> {user?.email ? '✅ Yes' : '❌ No'}
            </p>
            <p>
              <strong>Has Name:</strong> {user?.name ? '✅ Yes' : '❌ No'}
            </p>
            <p>
              <strong>User Role:</strong> {user?.role || 'Not specified'}
            </p>
            <p>
              <strong>Store ID:</strong> {user?.storeId || 'Not specified'}
            </p>
            <p>
              <strong>Has Token:</strong> {token ? '✅ Yes' : '❌ No'}
            </p>
          </div>
        </div>

        <div className="mt-6 space-x-4">
          <button
            onClick={() => (window.location.href = '/dashboard/insights')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/';
            }}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Clear Auth & Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
