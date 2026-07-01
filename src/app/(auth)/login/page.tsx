'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const errorParam = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl') || '/blog';

  useEffect(() => {
    if (errorParam === 'CredentialsSignin') {
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
      const result = await signIn('credentials', {
        email,
        password,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setError('Credenciales inválidas. Verificá tu email y contraseña.');
      } else if (result?.ok) {
        router.push(callbackUrl);
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
        {/* Email */}
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

        {/* Password */}
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

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-primary text-surface font-medium rounded-lg
                     hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-surface-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-surface text-on-surface-variant">o</span>
          </div>
        </div>

        {/* Google Sign In */}
        <button
          type="button"
          disabled={isLoading}
          onClick={() => signIn('google', { callbackUrl })}
          className="w-full py-3 px-4 bg-surface border border-surface-border text-on-surface font-medium rounded-lg
                     hover:bg-surface-container focus:outline-none focus:ring-2 focus:ring-primary/50
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar con Google
        </button>
      </form>

      {/* Register Link */}
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

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif text-primary mb-2">Botánica Esencial</h1>
          <p className="text-on-surface-variant">Iniciá sesión para acceder a tu cuenta</p>
        </div>

        {/* Form Card */}
        <Suspense fallback={<div className="glass-card p-8 text-center text-on-surface-variant">Cargando...</div>}>
          <LoginForm />
        </Suspense>

        {/* Back to Home */}
        <div className="mt-4 text-center">
          <Link
            href="/"
            className="text-sm text-on-surface-variant hover:text-on-surface"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}