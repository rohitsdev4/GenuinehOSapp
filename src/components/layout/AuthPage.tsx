import { useState } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { LogIn, Mail, Lock, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export function AuthPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async () => {
    if (!email || !pass) {
      setError('Email aur password dono required hain');
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') await signInWithEmail(email, pass);
      else await signUpWithEmail(email, pass);
    } catch (e: any) {
      setError(
        e.code === 'auth/wrong-password' ? 'Password galat hai' :
        e.code === 'auth/user-not-found' ? 'Account nahi mila' :
        e.code === 'auth/email-already-in-use' ? 'Email pehle se registered hai' :
        e.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090f] flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00d4aa] to-[#00a882]
                          flex items-center justify-center text-3xl font-black text-[#07090f]
                          mx-auto mb-4 shadow-[0_0_32px_rgba(0,212,170,0.3)]">
            G
          </div>
          <h1 className="text-2xl font-black text-white">
            Genuine<span className="text-[#00d4aa]">OS</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Business Command Center</p>
        </div>

        {/* Card */}
        <div className="bg-[#111520] border border-[#1e2a40] rounded-2xl p-6 shadow-2xl">
          {/* Google Sign In */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4
                       bg-white text-gray-800 rounded-xl font-semibold
                       hover:bg-gray-100 transition mb-4 disabled:opacity-50 cursor-pointer"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="G" />
            Google se Login karo
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[#1e2a40]" />
            <span className="text-gray-600 text-xs">ya email se</span>
            <div className="flex-1 h-px bg-[#1e2a40]" />
          </div>

          {/* Email/Pass */}
          <div className="space-y-3 mb-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#161c2a] border border-[#1e2a40] rounded-lg
                           pl-10 pr-3 py-2.5 text-white text-sm outline-none
                           focus:border-[#00d4aa] transition placeholder-gray-600"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                placeholder="Password"
                value={pass}
                onChange={e => setPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleEmail()}
                className="w-full bg-[#161c2a] border border-[#1e2a40] rounded-lg
                           pl-10 pr-3 py-2.5 text-white text-sm outline-none
                           focus:border-[#00d4aa] transition placeholder-gray-600"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-400
                            text-xs rounded-lg px-3 py-2 mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handleEmail}
            disabled={loading}
            className="w-full bg-[#00d4aa] text-[#07090f] py-3 rounded-xl
                       font-bold hover:bg-[#00b894] transition
                       disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            {loading ? 'Loading...' : mode === 'login' ? 'Login karo' : 'Account banao'}
          </button>

          <p className="text-center text-gray-600 text-xs mt-4">
            {mode === 'login' ? 'Pehli baar?' : 'Pehle se account hai?'}
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
              className="text-[#00d4aa] ml-1 hover:underline cursor-pointer"
            >
              {mode === 'login' ? 'Account banao' : 'Login karo'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
