import React, { useState } from 'react';
import { engine } from '../services/mockBackend';
import {
  BookOpen,
  Coins,
  ShieldCheck,
  Mail,
  Lock,
  User,
  GraduationCap,
  Hash,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Users
} from 'lucide-react';

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
  onAuthSuccess?: () => void;
}

const DEPARTMENTS = [
  'Computer Science',
  'Data Science',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Mathematics',
  'Business & Management'
];

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  onAuthSuccess
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign Up state
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [enrollmentNo, setEnrollmentNo] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [semester, setSemester] = useState(3);
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);

  const allSkills = engine.getSkills();
  const demoUsers = engine.getAllUsers().slice(0, 4);

  const switchMode = (nextMode: 'login' | 'signup') => {
    setMode(nextMode);
    setError(null);
  };

  const toggleSkill = (skillId: number) => {
    setSelectedSkillIds(prev =>
      prev.includes(skillId) ? prev.filter(id => id !== skillId) : [...prev, skillId]
    );
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const res = await engine.login(loginEmail, loginPassword);
    setIsSubmitting(false);

    if (res.status === 'success') {
      onAuthSuccess?.();
    } else {
      setError(res.message);
    }
  };

  const handleDemoLogin = async (email: string) => {
    setMode('login');
    setLoginEmail(email);
    setLoginPassword('password123');
    setError(null);
    setIsSubmitting(true);
    const res = await engine.login(email, 'password123');
    setIsSubmitting(false);
    if (res.status === 'success') {
      onAuthSuccess?.();
    } else {
      setError(res.message);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter carefully.');
      return;
    }

    setIsSubmitting(true);
    const res = await engine.register({
      name,
      email: signupEmail,
      enrollment_no: enrollmentNo,
      department,
      semester,
      password: signupPassword,
      teachSkillIds: selectedSkillIds
    });
    setIsSubmitting(false);

    if (res.status === 'success') {
      onAuthSuccess?.();
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center relative overflow-hidden py-10 px-4 sm:px-6 lg:px-8">
      {/* Subtle Ambient Background Accents */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl w-full mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Campus Value Prop & Demo Access */}
        <div className="lg:col-span-5 space-y-7">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-indigo-600/30">
              SB
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-none">SkillBridge</h1>
              <p className="text-xs text-slate-400 mt-1">Campus Peer Tutoring &amp; Credit Exchange</p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Learn together.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">
                Earn by teaching.
              </span>
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Connect with verified classmates across engineering, science, and math. Book 1-on-1 study
              sessions using campus credits—and earn credits back whenever you mentor others.
            </p>
          </div>

          {/* Key Highlights */}
          <div className="space-y-3">
            <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-4 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">20 Welcome Credits on Sign Up</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Start booking your first two 1-hour tutoring sessions immediately upon registration.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-4 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Live Subject &amp; Department Matching</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Filter peers by course code, topic, rating, and weekday or weekend availability.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-4 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Protected Double-Entry Ledger</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Credits only transfer when both peers complete the session, with full audit history.
                </p>
              </div>
            </div>
          </div>

          {/* Instant Demo Student Access */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                Quick Campus Demo Sign-In
              </span>
              <span className="text-[10px] font-mono text-slate-500">pass: password123</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demoUsers.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleDemoLogin(u.email)}
                  disabled={isSubmitting}
                  className="text-left p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 transition flex items-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-[10px] font-bold text-indigo-300 shrink-0">
                    {u.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{u.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{u.department}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Login / Sign Up Form Card */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 bg-slate-950/80 p-1.5 border-b border-slate-800">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`py-2.5 rounded-2xl text-xs font-semibold transition cursor-pointer ${
                  mode === 'login'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Student Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`py-2.5 rounded-2xl text-xs font-semibold transition cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Student Account
              </button>
            </div>

            <div className="p-6 sm:p-8">
              {/* Form Heading */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">
                  {mode === 'login' ? 'Welcome back to campus' : 'Join the SkillBridge network'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {mode === 'login'
                    ? 'Sign in with your university email to browse tutors and manage study sessions.'
                    : 'Verify your student enrollment details to receive 20 onboarding credits.'}
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="mb-5 bg-red-950/60 border border-red-800/80 text-red-200 text-xs p-3.5 rounded-xl flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {mode === 'login' ? (
                /* LOGIN FORM */
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Campus Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        placeholder="alex.chen@campus.edu"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Password
                      </label>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl text-sm transition shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-2"
                  >
                    <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <p className="text-center text-xs text-slate-400 pt-2">
                    New to SkillBridge?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('signup')}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                    >
                      Create a student account
                    </button>
                  </p>
                </form>
              ) : (
                /* SIGN UP FORM */
                <form onSubmit={handleSignupSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="Jordan Patel"
                          required
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Enrollment Number
                      </label>
                      <div className="relative">
                        <Hash className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={enrollmentNo}
                          onChange={e => setEnrollmentNo(e.target.value)}
                          placeholder="CS2026-0215"
                          required
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Campus Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={signupEmail}
                        onChange={e => setSignupEmail(e.target.value)}
                        placeholder="jordan.patel@campus.edu"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Department
                      </label>
                      <div className="relative">
                        <GraduationCap className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                          value={department}
                          onChange={e => setDepartment(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                        >
                          {DEPARTMENTS.map(dept => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Semester
                      </label>
                      <select
                        value={semester}
                        onChange={e => setSemester(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                          <option key={s} value={s}>
                            Semester {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Optional Teachable Subjects */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Subjects you can tutor <span className="text-slate-500 font-normal">(optional)</span>
                      </label>
                      {selectedSkillIds.length > 0 && (
                        <span className="text-[11px] text-indigo-400 font-medium">
                          {selectedSkillIds.length} selected
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                      {allSkills.map(skill => {
                        const selected = selectedSkillIds.includes(skill.id);
                        return (
                          <button
                            key={skill.id}
                            type="button"
                            onClick={() => toggleSkill(skill.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                              selected
                                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                            }`}
                          >
                            {skill.code}: {skill.subject_name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={signupPassword}
                          onChange={e => setSignupPassword(e.target.value)}
                          placeholder="Min. 6 characters"
                          minLength={6}
                          required
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          minLength={6}
                          required
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Welcome Bonus Callout */}
                  <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 text-xs text-emerald-200">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      Includes <strong className="text-white">+20 Welcome Credits</strong> automatically recorded in your ledger.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl text-sm transition shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmitting ? 'Creating account...' : 'Create Account & Claim 20 Credits'}</span>
                  </button>

                  <p className="text-center text-xs text-slate-400 pt-1">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                    >
                      Sign in here
                    </button>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
