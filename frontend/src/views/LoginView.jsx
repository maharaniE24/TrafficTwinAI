import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ShieldCheck, 
  User, 
  Lock, 
  Mail, 
  ArrowRight, 
  Gauge, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function LoginView() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [selectedRole, setSelectedRole] = useState("citizen"); // 'citizen' | 'controller'
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, signup, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      if (isSignUp) {
        await signup(email, password, name, selectedRole);
      } else {
        await login(email, password);
      }
      navigate("/");
    } catch (err) {
      setErrorMsg(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (role) => {
    demoLogin(role);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-[0_0_25px_rgba(0,242,254,0.35)] mb-3">
            <Gauge className="w-8 h-8 text-slate-950 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
            TrafficTwin <span className="text-cyan-400 font-mono">AI</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Tamil Nadu Smart Cities AI Digital Twin Platform
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass-panel-glow bg-slate-950/90 rounded-2xl border border-slate-800 p-6 md:p-8 shadow-2xl">
          {/* Sign In vs Sign Up Tabs */}
          <div className="flex rounded-xl bg-slate-900/80 p-1 mb-6 border border-slate-800">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setErrorMsg(""); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                !isSignUp ? "bg-cyan-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setErrorMsg(""); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                isSignUp ? "bg-cyan-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Anand Kumar"
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2.5 pl-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="citizen@demo.com"
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2.5 pl-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2.5 pl-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Role Toggle Selector at Sign Up */}
            {isSignUp && (
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Select System Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("citizen")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedRole === "citizen"
                        ? "bg-cyan-950/60 border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(0,242,254,0.15)]"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">Citizen</span>
                      {selectedRole === "citizen" && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Route AI & Incident Reports</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole("controller")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedRole === "controller"
                        ? "bg-amber-950/60 border-amber-500 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">Controller</span>
                      {selectedRole === "controller" && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Signals, ML & Digital Twin</p>
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? "Authenticating..." : isSignUp ? "Create Mission Account" : "Access Mission Control"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* 1-Click Instant Demo Logins (Evaluator Hint) */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                1-Click Demo Evaluation Logins
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickDemo("citizen")}
                className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group"
              >
                <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 flex items-center justify-between">
                  <span>Citizen Demo</span>
                  <span className="text-[10px] text-cyan-400 font-mono">1-Click</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">citizen@demo.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo("controller")}
                className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-left transition-all group"
              >
                <div className="text-xs font-bold text-slate-200 group-hover:text-amber-300 flex items-center justify-between">
                  <span>Controller Demo</span>
                  <span className="text-[10px] text-amber-400 font-mono">1-Click</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">controller@demo.com</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
