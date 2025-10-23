import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Get backend URL
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!backendUrl) {
      return NextResponse.json({ error: 'Backend not configured' }, { status: 500 });
    }

    // Call your backend login endpoint
    const response = await fetch(`${backendUrl.replace(/\/$/, '')}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    console.log('🚀 ~ POST ~ data:', data);

    if (!response.ok) {
      console.error('Backend login failed:', data);
      return NextResponse.json(
        { error: data.message || 'Invalid credentials' },
        { status: response.status }
      );
    }

    // Get the token from your backend response
    const token = data.accessToken;

    // Create response and set httpOnly cookie
    const nextResponse = NextResponse.json({
      success: true,
      user: data,
      message: 'Login successful',
    });

    if (token) {
      nextResponse.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    return nextResponse;
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
