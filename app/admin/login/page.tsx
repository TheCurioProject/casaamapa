'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Credenciales inválidas');
      } else {
        window.location.href = '/admin';
      }
    } catch (err) {
      setError('Ocurrió un error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-cream)] p-4 text-[var(--color-ink)] relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-[var(--color-rose-1)] blur-[120px] opacity-40 z-0"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[30vw] h-[30vw] rounded-full bg-[var(--color-sand)] blur-[100px] opacity-60 z-0"></div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl mb-2 text-[var(--color-rose-3)]">Amapa</h1>
          <p className="kicker text-[0.6rem] tracking-[0.4em] opacity-80">Portal de Administración</p>
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-[24px] shadow-[0_8px_32px_rgba(94,58,80,0.06)] p-8 border border-[rgba(255,255,255,0.4)]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium opacity-70 mb-2">Usuario</label>
              <input 
                type="text" 
                required 
                value={username} 
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-transparent border-b border-[rgba(94,58,80,0.2)] pb-2 focus:border-[var(--color-rose-3)] outline-none transition-colors"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium opacity-70 mb-2">Contraseña</label>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-transparent border-b border-[rgba(94,58,80,0.2)] pb-2 focus:border-[var(--color-rose-3)] outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-[var(--color-coral)] text-sm mt-2 font-medium">{error}</p>}
            
            <button 
              type="submit" 
              disabled={loading}
              className="mt-6 w-full bg-[var(--color-rose-3)] text-[var(--color-cream)] rounded-full py-4 text-xs tracking-[0.2em] uppercase font-medium hover:bg-[var(--color-rose-2)] hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:hover:shadow-none"
            >
              {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
