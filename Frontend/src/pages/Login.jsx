import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { loginUserThunk, registerUserThunk, clearAuthError } from '../redux/slices/authSlice';

const Login = ({ initialMode = 'login' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { loading, error } = useSelector((state) => state.auth);

  const isRegisterRoute = location.pathname === '/register' || initialMode === 'register';
  const [isLoginMode, setIsLoginMode] = useState(!isRegisterRoute);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [localSuccess, setLocalSuccess] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearAuthError());
    setLocalError(null);
    setLocalSuccess(false);

    let actionResult;
    if (isLoginMode) {
      actionResult = await dispatch(loginUserThunk({ email, password }));
    } else {
      if (!name) {
        setLocalError('Full name is required for registration.');
        return;
      }
      actionResult = await dispatch(registerUserThunk({ name, email, password }));
    }

    if (isLoginMode ? loginUserThunk.fulfilled.match(actionResult) : registerUserThunk.fulfilled.match(actionResult)) {
      setLocalSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } else {
      setLocalError(actionResult.payload || 'Authentication failed. Check your credentials.');
    }
  };

  const displayedError = localError || error;

  return (
    <div className="min-h-screen bg-background font-['Plus_Jakarta_Sans',sans-serif] text-on-surface flex flex-col justify-between p-space-md">
      {/* Top Header Navigation */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between py-space-xs">
        <Link
          to="/"
          className="flex items-center gap-space-xs font-['Plus_Jakarta_Sans',sans-serif] text-xs text-on-surface-variant hover:text-on-surface transition-colors font-medium"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back to Dispatch Home
        </Link>
        <span className="font-['JetBrains_Mono',monospace] text-xs text-on-surface-variant uppercase tracking-wider">
          Node Gateway Security: Active
        </span>
      </div>

      {/* Main Authentication Chassis */}
      <main className="w-full flex-1 flex items-center justify-center py-space-lg">
        <div className="flex flex-col w-full">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative w-full max-w-xl mx-auto my-auto flex flex-col items-center"
          >
            {/* Ambient Glow */}
            <div className="absolute -top-16 -left-16 w-64 h-64 bg-secondary-container/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Telemetry Status Ribbon */}
            <div className="mb-space-lg flex items-center gap-space-xs bg-surface-container-high px-space-md py-1 rounded-full shadow-sm border border-outline-variant/30">
              <span className="inline-block w-2 h-2 rounded-full bg-[#34A853] animate-pulse"></span>
              <span className="font-['JetBrains_Mono',monospace] text-xs text-on-surface-variant uppercase tracking-wider">
                Cluster Node: us-east-2 • Redux Toolkit Active
              </span>
            </div>

            {/* Main Container Card */}
            <div className="w-full bg-surface-container-lowest rounded-xl shadow-xl overflow-hidden relative border border-outline-variant/40">
              {/* Accent Stripe */}
              <div className="h-1.5 w-full bg-gradient-to-r from-primary-container via-secondary to-primary-container"></div>

              <div className="p-space-xl flex flex-col">
                {/* Mode Switcher Tabs */}
                <div className="flex items-center justify-between mb-space-lg bg-surface-container-low p-1 rounded-lg border border-outline-variant/30">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoginMode(true);
                      dispatch(clearAuthError());
                      setLocalError(null);
                      setLocalSuccess(false);
                    }}
                    className={`flex-1 py-2 rounded-md font-['JetBrains_Mono',monospace] text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                      isLoginMode
                        ? 'bg-surface-container-lowest text-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoginMode(false);
                      dispatch(clearAuthError());
                      setLocalError(null);
                      setLocalSuccess(false);
                    }}
                    className={`flex-1 py-2 rounded-md font-['JetBrains_Mono',monospace] text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                      !isLoginMode
                        ? 'bg-surface-container-lowest text-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {/* Identity Header */}
                <div className="flex items-center gap-space-sm mb-space-md">
                  <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary shadow-sm">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      hub
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-['JetBrains_Mono',monospace] text-xs text-on-surface-variant uppercase tracking-widest">
                      {isLoginMode ? 'System Access' : 'Register Operator'}
                    </span>
                    <span className="font-bold text-lg text-primary tracking-tight">
                      Dispatch Orchestration Console
                    </span>
                  </div>
                </div>

                {/* Section Heading & Context */}
                <div className="mb-space-lg">
                  <h1 className="text-2xl font-bold text-on-surface tracking-tight mb-space-xs">
                    {isLoginMode ? 'Welcome back to your cluster' : 'Provision your operator credentials'}
                  </h1>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {isLoginMode
                      ? 'Sign in to monitor active notification pipelines, worker health, and dispatch queues.'
                      : 'Register your operator account to deploy campaigns and connect background workers.'}
                  </p>
                </div>

                {/* Status Feedback Banners */}
                <AnimatePresence>
                  {displayedError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-space-md p-space-sm rounded-lg bg-error-container/60 border border-error/30 text-on-error-container text-xs flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-error text-base">error</span>
                      <span>{displayedError}</span>
                    </motion.div>
                  )}
                  {localSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-space-md p-space-sm rounded-lg bg-tertiary-fixed/40 border border-tertiary-fixed text-on-tertiary-fixed-variant text-xs flex items-center gap-2 font-medium"
                    >
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      <span>{isLoginMode ? 'Authenticated! Redirecting to dashboard...' : 'Account registered! Redirecting to dashboard...'}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Authentication Form */}
                <form className="flex flex-col gap-space-md" onSubmit={handleSubmit}>
                  {/* Full Name (Only in Registration Mode) */}
                  <AnimatePresence>
                    {!isLoginMode && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col gap-1.5 overflow-hidden"
                      >
                        <label className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider text-on-surface font-semibold">
                          Full Operator Name
                        </label>
                        <div className="relative flex items-center">
                          <span className="material-symbols-outlined text-outline absolute left-3 pointer-events-none text-[18px]">
                            person
                          </span>
                          <input
                            className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline text-sm focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:shadow-md transition-all border border-outline-variant/30"
                            placeholder="Alex Morgan"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required={!isLoginMode}
                            type="text"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Work Email */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider text-on-surface font-semibold">
                      Workstation Email
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined text-outline absolute left-3 pointer-events-none text-[18px]">
                        alternate_email
                      </span>
                      <input
                        className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline text-sm focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:shadow-md transition-all border border-outline-variant/30"
                        placeholder="eng.operator@enterprise.internal"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        type="email"
                      />
                    </div>
                  </div>

                  {/* Password / Cluster Token */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider text-on-surface font-semibold">
                        Cluster Secret Token
                      </label>
                      {isLoginMode && (
                        <a
                          className="text-xs text-secondary hover:underline transition-colors"
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            alert('Password reset instructions sent to workstation email.');
                          }}
                        >
                          Forgot password?
                        </a>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined text-outline absolute left-3 pointer-events-none text-[18px]">
                        key
                      </span>
                      <input
                        className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline font-['JetBrains_Mono',monospace] text-xs focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:shadow-md transition-all border border-outline-variant/30"
                        placeholder="••••••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        type={showPassword ? 'text' : 'password'}
                      />
                      <button
                        aria-label="Toggle password visibility"
                        className="absolute right-3 text-outline hover:text-on-surface transition-colors flex items-center cursor-pointer"
                        onClick={() => setShowPassword(!showPassword)}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Device Session Preservation */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded bg-surface-container-low accent-primary cursor-pointer"
                        type="checkbox"
                      />
                      <span className="text-xs text-on-surface-variant font-medium">
                        Remember this workstation for 30 days
                      </span>
                    </label>
                  </div>

                  {/* Execution CTA Button */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading || localSuccess}
                    className="mt-space-xs w-full py-3 px-space-md rounded-lg bg-secondary hover:bg-secondary-container text-on-secondary font-semibold text-base flex items-center justify-center gap-space-xs shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer disabled:opacity-75"
                    type="submit"
                  >
                    {loading ? (
                      <>
                        <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                        <span>Validating Node Signature...</span>
                      </>
                    ) : localSuccess ? (
                      <>
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        <span>Authenticated</span>
                      </>
                    ) : (
                      <>
                        <span>{isLoginMode ? 'Authenticate to Cluster' : 'Register Operator Account'}</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </>
                    )}
                  </motion.button>
                </form>

                {/* Hairline Divider */}
                <div className="relative my-space-lg flex items-center justify-center">
                  <div className="w-full h-px bg-surface-container-highest"></div>
                  <span className="absolute bg-surface-container-lowest px-3 font-['JetBrains_Mono',monospace] text-xs uppercase tracking-widest text-outline">
                    Federated IAM Protocols
                  </span>
                </div>

                {/* Identity Provider Integrations */}
                <div className="grid grid-cols-2 gap-space-sm">
                  <button
                    onClick={() => alert('GitHub Enterprise SSO integration active.')}
                    className="flex items-center justify-center gap-space-xs py-2.5 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-medium transition-all shadow-sm active:scale-[0.98] border border-outline-variant/30 cursor-pointer"
                    type="button"
                  >
                    <svg className="w-4 h-4 text-on-surface fill-current" viewBox="0 0 24 24">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      ></path>
                    </svg>
                    <span>GitHub Enterprise</span>
                  </button>
                  <button
                    onClick={() => alert('SAML 2.0 SSO redirect active.')}
                    className="flex items-center justify-center gap-space-xs py-2.5 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-medium transition-all shadow-sm active:scale-[0.98] border border-outline-variant/30 cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">verified_user</span>
                    <span>SSO / SAML 2.0</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Links */}
            <div className="mt-space-lg flex flex-wrap items-center justify-center gap-x-space-md gap-y-1 text-center">
              <span className="text-xs text-on-surface-variant font-medium">
                {isLoginMode ? "Don't have an operator account?" : "Already have an operator account?"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsLoginMode(!isLoginMode);
                  dispatch(clearAuthError());
                  setLocalError(null);
                }}
                className="text-xs text-secondary hover:underline font-semibold cursor-pointer"
              >
                {isLoginMode ? 'Switch to Registration →' : 'Switch to Sign In →'}
              </button>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <div className="w-full max-w-5xl mx-auto text-center py-space-xs">
        <span className="font-['JetBrains_Mono',monospace] text-xs text-on-surface-variant">
          © 2026 Dispatch. Cryptographic token-based session handling.
        </span>
      </div>
    </div>
  );
};

export default Login;
