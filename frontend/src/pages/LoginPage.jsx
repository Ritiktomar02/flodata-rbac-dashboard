import { useContext, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Loader, AlertCircle, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Input from "../components/Input";
import UserContext from "../context/UserContext";

// One-click chips for the seeded sample accounts. These match the README
// and let the reviewer flip between roles without re-typing credentials.
const sampleAccounts = [
  { label: "Admin",   email: "admin@flodata.test",   password: "Admin@123" },
  { label: "Manager", email: "manager@flodata.test", password: "Manager@123" },
  { label: "Analyst", email: "analyst@flodata.test", password: "Analyst@123" },
  { label: "Viewer",  email: "viewer@flodata.test",  password: "Viewer@123" },
];

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const { login, loading, error } = useContext(UserContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    const ok = await login(email, password);
    if (ok) navigate("/");
  };

  const fillSample = (a) => {
    setEmail(a.email);
    setPassword(a.password);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-md w-full mx-4 bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
    >
      <div className="p-8">
        <h2 className="text-3xl font-bold mb-1 bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-cyan-300 text-transparent bg-clip-text">
          Welcome to Flodata
        </h2>
        <p className="text-sm text-slate-400 mb-6">Sign in to your RBAC dashboard</p>

        <form onSubmit={handleLogin}>
          <Input icon={Mail} type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input icon={Lock} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <AlertCircle className="size-4 text-rose-400 shrink-0" />
              <p className="text-rose-300 text-xs">{error}</p>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-fuchsia-600 text-white font-semibold rounded-lg shadow-lg hover:from-indigo-400 hover:to-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : "Login"}
          </motion.button>
        </form>

        <div className="mt-6">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Sparkles className="size-3.5" />
            Try a sample role
          </div>
          <div className="grid grid-cols-2 gap-2">
            {sampleAccounts.map((a) => (
              <button
                key={a.email}
                type="button"
                onClick={() => fillSample(a)}
                className="text-left text-xs px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-400/40 transition"
              >
                <div className="font-semibold text-white">{a.label}</div>
                <div className="text-slate-400 truncate">{a.email}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginPage;
