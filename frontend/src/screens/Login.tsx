import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { signIn } from "../store/features/auth/authSlice";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error, isAuthenticated } = useAppSelector(
    (state) => state.auth,
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem("access_token");
    if (token || isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(signIn({ email, password })).unwrap();
      navigate("/");
    } catch (err) {
      // Error is handled by Redux
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden p-4">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950/30 to-cyan-950/30"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptLTEyIDBjMy4zMTQgMCA2IDIuNjg2IDYgNnMtMi42ODYgNi02IDYtNi0yLjY4Ni02LTYgMi42ODYtNiA2LTZ6IiBmaWxsPSIjMDZiNmQ0IiBvcGFjaXR5PSIuMDUiLz48L2c+PC9zdmc+')] opacity-40"></div>

      {/* Floating glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full filter blur-3xl opacity-30 animate-pulse delay-1000"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-cyan-500/20 rounded-2xl shadow-2xl shadow-cyan-500/10 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl mb-4 shadow-lg shadow-cyan-500/50">
              <span className="material-symbols-outlined text-white text-4xl">
                water_drop
              </span>
            </div>
            <h1 className="text-3xl font-black text-white">FishMarket Pro</h1>
            <p className="text-cyan-300/70 mt-2">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm backdrop-blur-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-cyan-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-700/50 bg-slate-800/50 text-slate-100 placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-cyan-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-700/50 bg-slate-800/50 text-slate-100 placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/50 hover:shadow-cyan-500/70 hover:scale-[1.02] active:scale-95"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            <p>Demo credentials:</p>
            <p className="font-mono text-xs mt-1 text-cyan-400/70">
              admin@fishmarket.com / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
