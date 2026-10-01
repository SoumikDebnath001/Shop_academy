"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../services/api';
import { ADMIN_BASE_PATH } from '../../../services/adminRoutes';

type Step = 'credentials' | 'otp' | 'totp' | 'totp_setup';

const inputClass = "w-full h-14 pl-10 pr-4 bg-surface rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-body-md text-on-surface outline-none placeholder:text-on-surface-variant/50";
const codeInputClass = "w-full h-14 px-4 bg-surface rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-center text-2xl tracking-[0.5em] font-semibold text-on-surface outline-none placeholder:text-on-surface-variant/40 placeholder:tracking-[0.3em]";
const buttonClass = "w-full h-14 mt-space-2xs bg-primary hover:bg-primary-container text-on-primary font-title-md text-title-md rounded-xl shadow-[0_4px_12px_rgba(27,122,67,0.25)] transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-50";

export default function AdminLoginPage() {
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [totp, setTotp] = useState('');
  const [setup, setSetup] = useState<{ qrCode: string, manualKey: string } | null>(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Remove the old admin token that older versions kept in browser storage
  useEffect(() => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_type');
  }, []);

  // Load the QR code when the admin has not set up Google Authenticator yet
  useEffect(() => {
    if (step !== 'totp_setup' || setup) return;
    api.adminTotpSetup()
      .then(setSetup)
      .catch(handleError);
  }, [step, setup]);

  const restart = (message: string) => {
    setStep('credentials');
    setOtp('');
    setTotp('');
    setSetup(null);
    setInfo('');
    setError(message);
  };

  const handleError = (err: any) => {
    if (err?.restart) {
      restart(err.message);
    } else {
      setError(err?.message || 'Authentication failed');
    }
  };

  const run = async (action: () => Promise<void>) => {
    setError('');
    setLoading(true);
    try {
      await action();
    } catch (err: any) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const submitCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const res = await api.adminLogin(email, password);
      setMaskedEmail(res.email);
      setOtp('');
      setInfo('');
      setStep('otp');
    });
  };

  const resendCode = () => {
    run(async () => {
      const res = await api.adminLogin(email, password);
      setMaskedEmail(res.email);
      setOtp('');
      setInfo('A new code has been sent.');
    });
  };

  const submitOtp = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const res = await api.adminVerifyOtp(otp);
      setInfo('');
      setStep(res.next);
    });
  };

  const submitTotp = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      await api.adminVerifyTotp(totp);
      setPassword('');
      router.replace(ADMIN_BASE_PATH);
    });
  };

  const digitsOnly = (value: string) => value.replace(/\D/g, '').slice(0, 6);

  const stepIndex = step === 'credentials' ? 0 : step === 'otp' ? 1 : 2;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-margin-mobile py-space-xl">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center pb-space-md relative z-10 flex flex-col items-center">
          <img alt="Obuya GrassRoots Logo" className="h-24 w-24 object-contain mb-space-sm" src="/obuya-grassroots-logo.png" />
          <h2 className="font-display-mobile text-display-mobile text-on-surface mb-space-3xs leading-tight">
            Admin Portal
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-[300px] mx-auto">
            Sign in to manage Obuya GrassRoots.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-space-sm px-1">
          {['Password', 'Email code', 'Authenticator'].map((label, index) => (
            <div key={label} className="flex-1 flex flex-col gap-1">
              <div className={`h-1.5 rounded-full ${index <= stepIndex ? 'bg-primary' : 'bg-surface-container-highest'}`} />
              <span className={`font-label-sm text-[11px] ${index === stepIndex ? 'text-primary font-semibold' : 'text-on-surface-variant'}`}>{label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-space-sm relative z-10 bg-surface-container-lowest/60 backdrop-blur-md p-space-md rounded-2xl shadow-[0_8px_32px_-4px_rgba(23,29,24,0.08)] border border-outline-variant/30">
          {error && (
            <div className="p-3 bg-error-container text-on-error-container rounded-xl text-sm font-medium">
              {error}
            </div>
          )}
          {info && !error && (
            <div className="p-3 bg-primary-fixed text-on-primary-fixed rounded-xl text-sm font-medium">
              {info}
            </div>
          )}

          {/* STEP 1: EMAIL + PASSWORD */}
          {step === 'credentials' && (
            <form onSubmit={submitCredentials} className="flex flex-col gap-space-sm">
              <div className="flex flex-col gap-space-3xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider ml-1" htmlFor="email">Email Address</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[20px]">mail</span>
                  <input
                    className={inputClass}
                    id="email"
                    placeholder="admin@example.com"
                    required
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-space-3xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider ml-1" htmlFor="password">Password</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[20px]">lock</span>
                  <input
                    className={inputClass}
                    id="password"
                    placeholder="••••••••"
                    required
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button className={buttonClass} type="submit" disabled={loading}>
                {loading ? 'Please wait...' : 'Continue'}
              </button>
            </form>
          )}

          {/* STEP 2: EMAIL OTP */}
          {step === 'otp' && (
            <form onSubmit={submitOtp} className="flex flex-col gap-space-sm">
              <div className="flex items-start gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[28px]">mark_email_read</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Enter the 6-digit code sent to <span className="font-semibold text-on-surface">{maskedEmail}</span>. It expires in 5 minutes.
                </p>
              </div>
              <input
                className={codeInputClass}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                required
                autoFocus
                value={otp}
                onChange={(e) => setOtp(digitsOnly(e.target.value))}
              />
              <button className={buttonClass} type="submit" disabled={loading || otp.length !== 6}>
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => restart('')} className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary">
                  Use a different account
                </button>
                <button type="button" onClick={resendCode} disabled={loading} className="font-label-sm text-label-sm text-primary hover:underline disabled:opacity-50">
                  Resend code
                </button>
              </div>
            </form>
          )}

          {/* STEP 3a: FIRST TIME GOOGLE AUTHENTICATOR SETUP */}
          {step === 'totp_setup' && (
            <form onSubmit={submitTotp} className="flex flex-col gap-space-sm">
              <div className="flex items-start gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[28px]">qr_code_scanner</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Set up two-step verification. Scan this QR code with the <span className="font-semibold text-on-surface">Google Authenticator</span> app, then enter the 6-digit code it shows.
                </p>
              </div>
              {setup ? (
                <div className="flex flex-col items-center gap-space-xs">
                  <img src={setup.qrCode} alt="Google Authenticator QR code" className="w-48 h-48 rounded-xl border border-outline-variant/50 bg-white p-2" />
                  <p className="font-label-sm text-[11px] text-on-surface-variant text-center">
                    Can&apos;t scan? Enter this key manually:
                    <span className="block font-mono text-label-sm text-on-surface break-all mt-1 select-all">{setup.manualKey}</span>
                  </p>
                </div>
              ) : (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}
              <input
                className={codeInputClass}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                required
                value={totp}
                onChange={(e) => setTotp(digitsOnly(e.target.value))}
              />
              <button className={buttonClass} type="submit" disabled={loading || totp.length !== 6 || !setup}>
                {loading ? 'Verifying...' : 'Enable & Sign In'}
              </button>
            </form>
          )}

          {/* STEP 3b: GOOGLE AUTHENTICATOR CODE */}
          {step === 'totp' && (
            <form onSubmit={submitTotp} className="flex flex-col gap-space-sm">
              <div className="flex items-start gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[28px]">phonelink_lock</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Open <span className="font-semibold text-on-surface">Google Authenticator</span> and enter the 6-digit code for Obuya GrassRoots.
                </p>
              </div>
              <input
                className={codeInputClass}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                required
                autoFocus
                value={totp}
                onChange={(e) => setTotp(digitsOnly(e.target.value))}
              />
              <button className={buttonClass} type="submit" disabled={loading || totp.length !== 6}>
                {loading ? 'Verifying...' : 'Sign In'}
              </button>
              <button type="button" onClick={() => restart('')} className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary">
                Use a different account
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
