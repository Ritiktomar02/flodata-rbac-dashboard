import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const Input = ({ icon: Icon, type, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="relative mb-5">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Icon className="size-5 text-indigo-400" />
      </div>
      <input
        {...props}
        type={isPassword && showPassword ? "text" : type}
        className={`w-full pl-10 ${isPassword ? "pr-10" : "pr-3"} py-2.5 bg-slate-900/60 rounded-lg border border-white/10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 focus:outline-none text-white placeholder-slate-500 transition`}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-indigo-400 transition"
        >
          {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      )}
    </div>
  );
};

export default Input;
