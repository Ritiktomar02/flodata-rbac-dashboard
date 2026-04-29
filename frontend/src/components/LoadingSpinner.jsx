import { motion } from "framer-motion";

const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center">
    <motion.div
      className="w-14 h-14 border-4 border-t-indigo-400 border-slate-700 rounded-full"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  </div>
);

export default LoadingSpinner;
