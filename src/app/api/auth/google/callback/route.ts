import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(new URL('/registrarse?error=oauth_cancelled', req.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/registrarse?error=no_authorization_code', req.url));
    }

    // Get Google client credentials
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${new URL(req.url).origin}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      console.error('Google OAuth credentials not configured');
      return NextResponse.redirect(new URL('/registrarse?error=oauth_not_configured', req.url));
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text();
      console.error('Token exchange failed:', tokenError);
      return NextResponse.redirect(new URL('/registrarse?error=token_exchange_failed', req.url));
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user profile from Google
    const profileResponse = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
    );

    if (!profileResponse.ok) {
      console.error('Failed to fetch Google profile');
      return NextResponse.redirect(new URL('/registrarse?error=profile_fetch_failed', req.url));
    }

    const profile = await profileResponse.json();

    // Register or login user with your backend
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base) {
      return NextResponse.redirect(new URL('/registrarse?error=backend_not_configured', req.url));
    }

    // Try to register/login with Google profile
    const authUrl = `${base.replace(/\/$/, '')}/auth/google`;

    console.log('🔍 Sending to backend:', {
      googleId: profile.id,
      email: profile.email,
      name: profile.name,
      picture: profile.picture || null,
      accessToken: accessToken,
    });

    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        googleId: profile.id,
        email: profile.email,
        name: profile.name,
        picture: profile.picture || null,
        accessToken: accessToken,
      }),
    });

    const authData = await authResponse.json().catch((parseError) => {
      console.error('❌ Failed to parse backend response:', parseError);
      return {};
    });

    // Add detailed logging for debugging
    console.log('🔍 Backend Response Status:', authResponse.status);
    console.log('🔍 Backend Response Headers:', Object.fromEntries(authResponse.headers.entries()));
    console.log('🔍 Backend Response Data:', JSON.stringify(authData, null, 2));

    if (!authResponse.ok) {
      console.error('Backend auth failed with status:', authResponse.status);
      console.error('Backend auth error details:', authData);
      return NextResponse.redirect(
        new URL(`/registrarse?error=backend_auth_failed&status=${authResponse.status}`, req.url)
      );
    }

    // Set auth cookie and redirect to success page
    const token = authData?.access_token || authData?.accessToken || authData?.token;
    const userData = authData?.user;

    // Debug the extracted values
    console.log('🔍 Extracted token:', token);
    console.log('🔍 Extracted userData:', userData);

    // Parse state to get redirect URL
    let redirectTo = '/dashboard'; // Default redirect
    try {
      if (state) {
        const stateData = JSON.parse(decodeURIComponent(state));
        redirectTo = stateData.redirectTo || redirectTo;
      }
    } catch (e) {
      console.warn('Failed to parse state parameter:', e);
    }

    // For production, we'll create a success page that handles localStorage
    // For now, let's use query parameters to pass the data
    const redirectUrl = new URL('/auth/success', req.url);
    redirectUrl.searchParams.set('token', token || '');
    redirectUrl.searchParams.set('user', JSON.stringify(userData || {}));
    redirectUrl.searchParams.set('redirectTo', redirectTo);

    const response = NextResponse.redirect(redirectUrl);

    if (token) {
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    return response;
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(new URL('/registrarse?error=unexpected_error', req.url));
  }
}
