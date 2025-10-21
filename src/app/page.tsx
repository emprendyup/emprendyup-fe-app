'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { gql, useMutation } from '@apollo/client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      access_token
      user {
        id
        email
        name
        membershipLevel
        role
        createdAt
        updatedAt
        storeId
      }
    }
  }
`;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginMutation] = useMutation(LOGIN_MUTATION);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // Handle OAuth errors from URL params
  useEffect(() => {
    const oauthError = searchParams.get('error');
    const message = searchParams.get('message');

    if (oauthError) {
      const errorMessages = {
        oauth_cancelled: 'Has cancelado el inicio de sesión con Google.',
        no_authorization_code: 'Error de autorización con Google.',
        oauth_not_configured: 'Google OAuth no está configurado correctamente.',
        token_exchange_failed: 'Error al intercambiar el token de Google.',
        profile_fetch_failed: 'Error al obtener tu perfil de Google.',
        backend_not_configured: 'Backend no configurado.',
        backend_auth_failed: 'Error de autenticación en el servidor.',
        unexpected_error: 'Error inesperado durante el inicio de sesión con Google.',
        user_exists: message || 'Ya tienes una cuenta. Por favor inicia sesión.',
      };
      setError(errorMessages[oauthError as keyof typeof errorMessages] || 'Error desconocido');

      // Clear the error from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      newUrl.searchParams.delete('message');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await loginMutation({
        variables: {
          input: {
            email,
            password,
          },
        },
      });
      if (!data?.login?.access_token || !data?.login?.user) {
        throw new Error('Credenciales inválidas');
      }
      // Store access token and user data in localStorage
      localStorage.setItem('accessToken', data.login.access_token);
      localStorage.setItem('user', JSON.stringify(data.login.user));
      // Conditional redirect
      if (data.login.user.role === 'ADMIN') {
        debugger;
        router.push('/dashboard/insights');
      } else if (data.login.user.storeId) {
        router.push('/dashboard/insights');
      } else {
        router.push('/dashboard/store/new');
      }
    } catch (err: any) {
      setError(err.message || 'Error en el login');
    } finally {
      setLoading(false);
    }
  };

  // Handle forgot password submit
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    if (!forgotEmail) {
      setForgotError('Por favor ingresa tu correo electrónico.');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/request-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotEmail }),
      });
      if (res.ok) {
        setForgotSuccess(
          'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.'
        );
        setForgotEmail('');
      } else {
        const data = await res.json();
        setForgotError(data.message || 'Error al solicitar el restablecimiento.');
      }
    } catch (err) {
      setForgotError('Error de red o servidor.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');

    // Check if Google OAuth is configurado
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError('Google OAuth no está configurado. Contacta al administrador.');
      return;
    }

    // Redirect directly to Google's OAuth 2.0 endpoint using the original callback
    const redirectUri = `${window.location.origin}/api/auth/google/callback`;
    const scope = encodeURIComponent('profile email');
    const state = encodeURIComponent(
      JSON.stringify({
        from: 'login',
        redirectTo: '/dashboard/insights', // Specify where to redirect after success
      })
    );
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${scope}&state=${state}&prompt=select_account`;

    window.location.href = oauthUrl;
  };

  return (
    <section className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-fourth-base/10 via-blue-50 to-green-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-full h-full bg-white dark:bg-black">
          <div className="grid md:grid-cols-2 grid-cols-1 items-center h-full">
            {/* Imagen lateral */}
            <div className="relative md:shrink-0 h-full">
              <Image
                src="/images/ab1.jpg"
                fill
                className="w-full h-full object-cover"
                alt="hombre en oficina"
              />
            </div>

            {/* Formulario */}
            <div className="p-8 lg:px-20 flex flex-col justify-center h-full min-h-screen md:min-h-full bg-black">
              <form onSubmit={handleSubmit} className="text-start lg:py-20 py-8">
                <h2 className="text-white text-xl font-bold mb-6 text-center">Iniciar Sesión</h2>
                <div className="grid grid-cols-1">
                  <div className="mb-4">
                    <label className="font-semibold text-white" htmlFor="LoginEmail">
                      Correo electrónico:
                    </label>
                    <input
                      id="LoginEmail"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-3 w-full py-2 px-3 h-10 bg-transparent border rounded text-white placeholder-gray-400"
                      placeholder="nombre@gmail.com"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="font-semibold text-white" htmlFor="LoginPassword">
                      Contraseña:
                    </label>
                    <input
                      id="LoginPassword"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-3 w-full py-2 px-3 h-10 bg-transparent border rounded text-white placeholder-gray-400"
                      placeholder="********"
                      required
                    />
                  </div>

                  <div className="mb-2 text-right">
                    <button
                      type="button"
                      className="text-fourth-base text-sm hover:underline focus:outline-none"
                      onClick={() => router.push('/olvido-contrasena')}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="py-2 px-5 w-full bg-fourth-base text-black rounded-md"
                  >
                    {loading ? 'Ingresando...' : 'Login / Sign in'}
                  </button>
                  <div className="text-center my-4 text-slate-400">o</div>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="mt-3 py-2 px-5 w-full border rounded-md bg-white text-black flex items-center justify-center gap-2"
                  >
                    {/* Google 'G' multicolor icon */}
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 48 48"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden
                      className="inline-block"
                    >
                      <path
                        fill="#4285F4"
                        d="M24 9.5c3.6 0 6.3 1.4 8.2 2.6l6-6C35.7 3 30.2 1 24 1 14.8 1 6.9 6 3 14.1l7 5.4C11.1 15.7 17 9.5 24 9.5z"
                      />
                      <path
                        fill="#34A853"
                        d="M46.5 24c0-1.6-.1-2.8-.4-4H24v8.1h12.7c-.5 2.8-2 5.1-4.3 6.7l6.5 5C44.6 36.7 46.5 30.9 46.5 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10 33.5c1.4 2.8 4 5 7.1 6.3l5.1-6.7C20.5 31.5 18.5 30 16 29l-6 4.5z"
                      />
                      <path
                        fill="#EA4335"
                        d="M24 46.5c6.2 0 11.7-2 15.7-5.4l-6.5-5c-2 1.4-4.6 2.2-7.6 2.2-7 0-12.9-6.2-14.9-14.9l-7 5.4C6.9 42.5 14.8 46.5 24 46.5z"
                      />
                    </svg>
                    Entrar con Google
                  </button>

                  <div className="text-center mt-4">
                    <span className="text-slate-400">¿No tienes una cuenta?</span>{' '}
                    <Link href="/registrarse" className="text-white font-bold">
                      Registrarse
                    </Link>
                  </div>
                </div>
              </form>
              {/* Forgot Password Modal removed, now only redirect button remains */}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
