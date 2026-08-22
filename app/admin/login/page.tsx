'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);

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
        setLoading(false);
        setError('Credenciales inválidas. Por favor verifica tu usuario y contraseña.');
        setShake(s => s + 1); // Trigger shake animation
      } else {
        window.location.href = '/admin';
      }
    } catch (err) {
      setLoading(false);
      setError('Ocurrió un error de conexión al intentar acceder.');
      setShake(s => s + 1);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-cream)] p-4 text-[var(--color-ink)] relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-[var(--color-rose-1)] blur-[120px] opacity-40 z-0"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[30vw] h-[30vw] rounded-full bg-[var(--color-sand)] blur-[100px] opacity-60 z-0"></div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--color-ink)]/90 backdrop-blur-md"
          >
            <div className="flex flex-col items-center justify-center text-white">
              <svg 
                className="w-20 h-24 mb-8 overflow-visible" 
                viewBox="0 0 100 120"
              >
                <motion.path 
                  d="M 20 120 L 20 50 A 30 30 0 0 1 80 50 L 80 120"
                  fill="transparent"
                  stroke="var(--color-rose-3)"
                  strokeWidth="3"
                  initial={{ pathLength: 0, opacity: 0.2 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{
                    pathLength: {
                      duration: 1.5,
                      ease: "easeInOut",
                      repeat: Infinity,
                      repeatType: "reverse"
                    },
                    opacity: {
                      duration: 0.3
                    }
                  }}
                />
              </svg>
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="font-display text-2xl tracking-wide text-[var(--color-cream)]"
              >
                Accediendo...
              </motion.h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <svg viewBox="0 0 100 120" className="w-12 h-14 mx-auto mb-4 overflow-visible">
            <path 
              d="M 20 120 L 20 50 A 30 30 0 0 1 80 50 L 80 120"
              fill="transparent"
              stroke="var(--color-rose-3)"
              strokeWidth="4"
            />
          </svg>
          <p className="kicker text-[0.6rem] tracking-[0.4em] opacity-80 uppercase font-medium">Portal de Administración</p>
        </div>

        <motion.div 
          animate={shake > 0 ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="bg-white/60 backdrop-blur-xl rounded-[24px] shadow-[0_8px_32px_rgba(94,58,80,0.06)] p-8 border border-[rgba(255,255,255,0.4)] relative"
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium opacity-70 mb-2">Usuario</label>
              <input 
                type="text" 
                required 
                value={username} 
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-transparent border-b border-[rgba(94,58,80,0.2)] pb-2 focus:border-[var(--color-rose-3)] outline-none transition-colors text-sm"
                placeholder="admin"
              />
            </div>
            
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium opacity-70 mb-2">Contraseña</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-transparent border-b border-[rgba(94,58,80,0.2)] pb-2 pr-10 focus:border-[var(--color-rose-3)] outline-none transition-colors text-sm"
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 bottom-2 text-[var(--color-ink)] opacity-50 hover:opacity-100 transition-opacity p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-[var(--color-coral)]/10 text-[var(--color-coral)] text-xs font-medium p-3 rounded-lg flex items-start gap-2 mt-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <button 
              type="submit" 
              className="mt-2 w-full bg-[var(--color-rose-3)] text-[var(--color-cream)] rounded-full py-4 text-xs tracking-[0.2em] uppercase font-bold hover:bg-[var(--color-rose-2)] hover:shadow-lg transition-all duration-300"
            >
              Iniciar Sesión
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
