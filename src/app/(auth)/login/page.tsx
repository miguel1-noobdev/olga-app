import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LoginForm from '@/components/auth/login-form';

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/blog');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif text-primary mb-2">Botánica Esencial</h1>
          <p className="text-on-surface-variant">Iniciá sesión para acceder a tu cuenta</p>
        </div>

        {/* Form Card */}
        <LoginForm />

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
