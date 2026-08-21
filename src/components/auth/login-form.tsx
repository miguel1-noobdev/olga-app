'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import Link from 'next/link';
import { sanitizeCallbackUrl } from '@/lib/auth/sanitize-callback-url';
import { performCredentialsLogin } from '@/lib/auth/credentials-login';
import { getDefaultRedirectForRole } from '@/lib/auth/role-redirect';
import { GOOGLE_CREDENTIALS_FALLBACK } from '@/lib/auth/google';

function LoginFormInner() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const errorParam = searchParams.get('error');
  const registrationAccepted = searchParams.get('registered') === 'true';
  const verificationCompleted = searchParams.get('verified') === 'true';
  const googleLinkCompleted = searchParams.get('googleLink') === 'verified';
  const callbackUrl = sanitizeCallbackUrl(searchParams.get('callbackUrl'));

  useEffect(() => {
    if (errorParam === 'GOOGLE_CREDENTIALS_FALLBACK') {
      setError(GOOGLE_CREDENTIALS_FALLBACK);
    } else if (errorParam === 'CredentialsSignin') {
      setError('Credenciales inválidas. Verificá tu email y contraseña.');
    } else if (errorParam) {
      setError('Error de autenticación. Intentá de nuevo.');
    }
  }, [errorParam]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Completá todos los campos.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await performCredentialsLogin(signIn, email, password, callbackUrl);

      if (result.ok) {
        // Preserve explicit deep-link intent when the user was redirected
        // to login from a protected page. Otherwise, send them to the
        // role-specific home so productora/admin land in their workspace.
        const session = await getSession();
        const destination =
          callbackUrl === '/'
            ? getDefaultRedirectForRole(session?.user?.role)
            : result.navigateTo;

        // Use hard navigation to guarantee the session cookie is sent.
        // router.push() can race with cookie settlement and bounce back to /login.
        window.location.href = destination;
      } else {
        if (result.error === 'CredentialsSignin') {
          setError('Credenciales inválidas. Verificá tu email y contraseña.');
        } else {
          setError('Error al iniciar sesión. Intentá de nuevo más tarde.');
        }
      }
    } catch {
      setError('Ocurrió un error. Intentá de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="glass-card p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {(registrationAccepted || verificationCompleted || googleLinkCompleted) && (
          <div role="status" className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              {registrationAccepted
                ? 'Revisá tu email para verificar la cuenta antes de iniciar sesión.'
                : googleLinkCompleted
                  ? 'Cuenta de Google vinculada. Ya podés iniciar sesión.'
                  : 'Email verificado. Ya podés iniciar sesión.'}
            </p>
          </div>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-on-surface mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="w-full px-4 py-3 bg-surface border border-surface-border rounded-lg
                       text-on-surface placeholder-on-surface-variant
                       focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                       transition-colors"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-on-surface mb-2">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contraseña"
            className="w-full px-4 py-3 bg-surface border border-surface-border rounded-lg
                       text-on-surface placeholder-on-surface-variant
                       focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                       transition-colors"
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-primary text-surface font-medium rounded-lg
                     hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>

      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-on-surface-variant">
          ¿No tenés cuenta?{' '}
          <Link
            href="/register"
            className="text-primary hover:text-primary/80 font-medium underline"
          >
            Crear una cuenta
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginForm() {
  return (
    <Suspense fallback={<div className="glass-card p-8 text-center text-on-surface-variant">Cargando...</div>}>
      <LoginFormInner />
    </Suspense>
  );
}
