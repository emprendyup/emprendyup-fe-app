'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const OTP_EXPIRATION_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;

export default function OTPConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [expiration, setExpiration] = useState(OTP_EXPIRATION_MINUTES * 60);

  // Countdown for OTP expiration
  useEffect(() => {
    if (expiration <= 0) return;
    const timer = setInterval(() => {
      setExpiration((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [expiration]);

  // read email from query string once on mount
  useEffect(() => {
    const e = searchParams.get('email');
    if (e) setEmail(decodeURIComponent(e));
  }, [searchParams]);

  // Countdown for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('¡Verificación exitosa! Bienvenido.');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(data.message || 'Código OTP inválido o expirado.');
      }
    } catch {
      setError('Error de red o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResendLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/otp/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('OTP reenviado. Revisa tu correo electrónico.');
        setExpiration(OTP_EXPIRATION_MINUTES * 60);
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
      } else {
        setError(data.message || 'No se pudo reenviar el OTP.');
      }
    } catch {
      setError('Error de red o servidor.');
    } finally {
      setResendLoading(false);
    }
  };

  // Format seconds to mm:ss
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <section className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-fourth-base/10 via-blue-50 to-green-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md bg-white dark:bg-black rounded-lg shadow-lg p-8">
        <h2 className="text-xl font-bold text-center text-black dark:text-white mb-4">
          Confirmación de OTP
        </h2>
        <p className="mb-4 text-center text-slate-500 dark:text-slate-300 text-sm">
          Ingresa el código OTP que te enviamos por correo electrónico.
          <br />
          <span className="font-semibold">No compartas tu código OTP con nadie.</span>
        </p>
        <form onSubmit={handleSubmit} className="mb-4">
          <label
            htmlFor="otp"
            className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Código OTP
          </label>
          <input
            id="otp"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full px-3 py-2 border rounded bg-transparent text-black dark:text-white dark:border-gray-700 mb-4"
            placeholder="123456"
            required
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
          />
          <div className="mb-2 text-sm text-slate-500 dark:text-slate-300">
            El código expira en <span className="font-semibold">{formatTime(expiration)}</span>{' '}
            minutos.
          </div>
          {error && <p className="text-red-500 mb-2 text-sm">{error}</p>}
          {success && <p className="text-green-500 mb-2 text-sm">{success}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md mt-2 transition-colors duration-200"
          >
            {loading ? 'Verificando...' : 'Confirmar OTP'}
          </button>
        </form>
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || resendLoading}
            className={`w-full py-2 px-4 rounded-md mt-2 ${resendCooldown > 0 || resendLoading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white'}`}
          >
            {resendCooldown > 0
              ? `Reenviar OTP (${resendCooldown}s)`
              : resendLoading
                ? 'Enviando...'
                : 'Reenviar OTP'}
          </button>
          {resendCooldown > 0 && (
            <span className="text-xs text-red-500 font-medium">
              {resendCooldown === RESEND_COOLDOWN_SECONDS ? (
                <>
                  El código ha sido reenviado.
                  <br />
                  Por favor revisa tu correo electrónico.
                </>
              ) : (
                <>
                  No puedes reenviar el código todavía.
                  <br />
                  Por favor espera {resendCooldown} segundos antes de intentarlo nuevamente.
                </>
              )}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
