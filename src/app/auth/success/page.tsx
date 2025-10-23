'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if we have query parameters from Google OAuth callback
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');
    const redirectTo = searchParams.get('redirectTo');

    if (token || userStr) {
      // Handle OAuth callback with query parameters
      console.log('🔍 Auth Success - Token:', token);
      console.log('🔍 Auth Success - User:', userStr);

      // Store token if provided
      if (token && token !== 'null' && token !== 'undefined' && token.trim() !== '') {
        localStorage.setItem('accessToken', token);
        console.log('✅ Token stored in localStorage');
      }

      // Store user data if provided
      if (userStr && userStr !== 'null' && userStr !== 'undefined') {
        try {
          const userData = JSON.parse(userStr);
          if (userData && typeof userData === 'object') {
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('✅ User data stored in localStorage');
          }
        } catch (e) {
          console.error('❌ Failed to parse user data:', e);
        }
      }

      // Redirect after storing data
      setTimeout(() => {
        router.push(redirectTo || '/dashboard/insights');
      }, 1000);
    } else {
      // Handle existing localStorage check (legacy behavior)
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // Check if user has a valid session
      if (!user || !user.email || !user.name) {
        // No valid session, redirect to index
        router.push('/');
        return;
      }

      const timer = setTimeout(() => {
        if (user?.storeId) {
          router.push('/dashboard/insights');
        } else {
          router.push('/dashboard/store/new');
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 dark:from-slate-800 dark:to-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-green-800 dark:text-green-400 mb-2">
          ¡Inicio de sesión exitoso!
        </h1>
        <p className="text-green-600 dark:text-green-300">Configurando tu sesión...</p>
      </div>
    </div>
  );
}

export default function GoogleAuthSuccess() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 dark:from-slate-800 dark:to-slate-900">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div>
        </div>
      }
    >
      <AuthSuccessPage />
    </Suspense>
  );
}
