import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, Loader } from "lucide-react";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    organization: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    const result = await register(
      formData.name,
      formData.email,
      formData.password,
      formData.organization
    );

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
            <img src="/icon.png" alt="PulseGen" className="w-10 h-10" />
          </div>
          <div>
            <h1 className="font-black text-3xl tracking-tight">PULSEGEN</h1>
            <p className="text-sm text-gray-500 uppercase tracking-widest">
              Video Platform
            </p>
          </div>
        </div>

        {/* Register Card */}
        <div className="card-brutal-lg">
          <h2 className="text-2xl font-black uppercase mb-6">Create Account</h2>

          {error && (
            <div className="mb-6 p-4 bg-brutal-red/10 border-4 border-brutal-red text-brutal-red font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wide mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-brutal"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wide mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-brutal"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wide mb-2">
                Organization{" "}
                <span className="text-gray-400 normal-case">(optional)</span>
              </label>
              <input
                type="text"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                className="input-brutal"
                placeholder="Your Company"
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wide mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-brutal pr-12"
                  placeholder="••••••••"
                  required
                  minLength={6}
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

            <div>
              <label className="block text-sm font-bold uppercase tracking-wide mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-brutal"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-brutal flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-bold text-brutal-black hover:text-brutal-pink underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
