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