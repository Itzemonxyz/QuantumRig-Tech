import React, { useState } from 'react';
import { useStore } from '../store';
import { api } from '../lib/api';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

type AuthMode = 'login' | 'register' | 'forgot-password' | 'google-details';

export default function Login() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { login } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        // Check if user already exists
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        
        if (userDoc.exists()) {
          // User exists, log them in directly
          const userData = userDoc.data();
          const res = await api.post('/auth/google', { 
            id: result.user.uid,
            email: result.user.email, 
            name: userData.name || result.user.displayName, 
            avatar: result.user.photoURL, 
            phone: userData.phone || result.user.phoneNumber 
          });
          login(res.user, res.token);
          const from = (location.state as any)?.from?.pathname || '/';
          navigate(from, { replace: true });
        } else {
          // New user, ask for details
          setEmail(result.user.email || '');
          setName(result.user.displayName || '');
          setAvatar(result.user.photoURL || '');
          setMode('google-details');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Sync with backend memory to establish token, using the google endpoint which gracefully handles missing users
        const res = await api.post('/auth/google', { id: userCredential.user.uid, email: userCredential.user.email, name: userCredential.user.displayName || email.split('@')[0], avatar: userCredential.user.photoURL, phone: userCredential.user.phoneNumber });
        login(res.user, res.token);
        const from = (location.state as any)?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else if (mode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        const userRole = (email === 'itzemon990@gmail.com' || email === 'admin@quantumrig.tech') ? 'admin' : 'user';

        // Save to Firestore
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          id: firebaseUser.uid,
          name,
          email,
          phone,
          role: userRole,
          savedProductIds: []
        });

        // Also sync to backend for current system compatibility
        const res = await api.post('/auth/register', { id: firebaseUser.uid, name, email, password, phone, role: userRole });
        login(res.user, res.token);
        navigate('/');
      } else if (mode === 'forgot-password') {
        try {
          await sendPasswordResetEmail(auth, email);
        } catch (firebaseErr: any) {
          console.warn('Firebase reset password failed, doing fallback:', firebaseErr);
          // Let it proceed to api fallback or throw a more descriptive error if relevant
        }
        await api.post('/auth/forgot-password', { email });
        setMessage('Password reset email sent. Please check your inbox.');
      } else if (mode === 'google-details') {
        const user = auth.currentUser;
        if (user) {
          const userRole = (email === 'itzemon990@gmail.com' || email === 'admin@quantumrig.tech') ? 'admin' : 'user';
          await setDoc(doc(db, 'users', user.uid), {
            id: user.uid,
            name,
            email,
            phone,
            avatar,
            role: userRole,
            savedProductIds: []
          }, { merge: true });
        }
        const res = await api.post('/auth/google', { id: user?.uid, email, name, avatar, phone, role: (email === 'itzemon990@gmail.com' || email === 'admin@quantumrig.tech') ? 'admin' : 'user' });
        login(res.user, res.token);
        const from = (location.state as any)?.from?.pathname || '/';
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        <div className="text-center mb-8 relative">
          {(mode === 'forgot-password' || mode === 'google-details') && (
            <button 
              onClick={() => setMode('login')} 
              className="absolute left-0 top-1 text-slate-400 hover:text-slate-600 transition-colors"
              title="Back to Login"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="mx-auto bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {mode === 'login' ? 'Sign in to your account' : mode === 'register' ? 'Create a new account' : mode === 'google-details' ? 'Complete your profile' : 'Reset Password'}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
             {mode === 'login' ? 'Enter your credentials below' : mode === 'register' ? 'Fill in the form to get started' : mode === 'google-details' ? 'Please confirm your details' : 'Enter your email to receive a password reset link'}
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm mb-6 border border-rose-100">
            {error}
          </div>
        )}
        
        {message && (
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg text-sm mb-6 border border-emerald-100">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {(mode === 'register' || mode === 'google-details') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" />
            </div>
          )}
          
          {mode !== 'google-details' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" />
            </div>
          )}
          
          {(mode === 'register' || mode === 'google-details') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
              <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" />
            </div>
          )}
          
          {(mode !== 'forgot-password' && mode !== 'google-details') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input required type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow pr-10" />
                <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
              <div className="relative">
                <input required type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow pr-10" />
                <button type="button" tabIndex={-1} onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600">
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {mode === 'login' && (
            <div className="flex items-center justify-end">
              <button type="button" onClick={() => { setError(''); setMessage(''); setMode('forgot-password'); }} className="text-sm text-indigo-600 hover:text-indigo-500">
                Forgot password?
              </button>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-70 mt-2"
          >
            {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : mode === 'google-details' ? 'Complete Profile' : 'Send Reset Link')}
          </button>
        </form>

        {(mode === 'login' || mode === 'register') && (
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Or continue with</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="mt-6 w-full flex items-center justify-center gap-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-70"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
          </div>
        )}

        {(mode === 'login' || mode === 'register') && (
          <div className="mt-6 text-center text-sm text-slate-500">
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setError(''); setMessage(''); setMode(mode === 'login' ? 'register' : 'login'); }} className="text-indigo-600 hover:text-indigo-500 font-medium hover:underline">
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
