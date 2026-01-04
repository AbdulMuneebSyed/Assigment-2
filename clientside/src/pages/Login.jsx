import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Zap, Eye, EyeOff, Loader } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await login(email, password);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-brutal-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-14 h-14 bg-brutal-yellow flex items-center justify-center border-4 border-brutal-black shadow-brutal">
            <Zap className="text-brutal-black" size={32} />
          </div>
          <div>
            <h1 className="font-black text-3xl tracking-tight">PULSEGEN</h1>
            <p className="text-sm text-gray-500 uppercase tracking-widest">
              Video Platform
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="card-brutal-lg">
          <h2 className="text-2xl font-black uppercase mb-6">Sign In</h2>

          {error && (
            <div className="mb-6 p-4 bg-brutal-red/10 border-4 border-brutal-red text-brutal-red font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wide mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-brutal"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wide mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-brutal pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-brutal-black"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-brutal flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-bold text-brutal-black hover:text-brutal-pink underline"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        {/* Demo accounts info */}
        <div className="mt-6 card-brutal-sm bg-brutal-yellow/20">
          <p className="font-bold text-sm uppercase mb-2">Demo Tip</p>
          <p className="text-sm text-gray-600">
            Create an account to get started. First user will be assigned editor
            role.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
