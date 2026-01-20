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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50/50 via-white to-secondary-50/50 relative overflow-hidden p-4">
      {/* Soft background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptLTEyIDBjMy4zMTQgMCA2IDIuNjg2IDYgNnMtMi42ODYgNi02IDYtNi0yLjY4Ni02LTYgMi42ODYtNiA2LTZ6IiBmaWxsPSIjM2I4MmY2IiBvcGFjaXR5PSIuMDMiLz48L2c+PC9zdmc+')] opacity-40"></div>

      {/* Soft floating shapes */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-200/20 rounded-full filter blur-3xl opacity-50 animate-gentle-float"></div>
      <div
        className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary-200/20 rounded-full filter blur-3xl opacity-50 animate-gentle-float"
        style={{ animationDelay: "1s" }}
      ></div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-card shadow-soft-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-card mb-4 shadow-soft">
              <span className="material-symbols-outlined text-white text-4xl fill-1">
                set_meal
              </span>
            </div>
            <h1 className="text-3xl font-bold text-text-primary">
              FishMarket Pro
            </h1>
            <p className="text-text-secondary mt-2">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-button text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-200 bg-background-soft text-text-primary placeholder-text-muted rounded-button focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400 transition-all"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-200 bg-background-soft text-text-primary placeholder-text-muted rounded-button focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400 transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer w-full py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-button font-semibold hover:from-primary-600 hover:to-secondary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-soft hover:shadow-soft-lg"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
