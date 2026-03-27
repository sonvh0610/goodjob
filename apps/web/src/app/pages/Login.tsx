import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function Login() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 bg-[#fcf4ff] text-[#37274d] font-['Be_Vietnam_Pro',sans-serif]">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#f2e2ff] rounded-full blur-3xl opacity-60 mix-blend-multiply pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#58e7fb] rounded-full blur-3xl opacity-20 pointer-events-none" />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md bg-white/70 backdrop-blur-[20px] rounded-[3rem] p-8 sm:p-12 shadow-[0_12px_60px_rgba(55,39,77,0.06)] ring-1 ring-[#baa4d3]/20 z-10"
      >
        <div className="flex flex-col items-center mb-10 text-center">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 bg-gradient-to-br from-[#652fe7] to-[#a98fff] rounded-full mb-6 shadow-[0_12px_40px_rgba(55,39,77,0.15)] flex items-center justify-center"
          >
            <span className="text-white font-bold text-2xl font-['Plus_Jakarta_Sans',sans-serif]">A</span>
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#15052a] font-['Plus_Jakarta_Sans',sans-serif] tracking-tight">
            Welcome Back
          </h1>
          <p className="text-[#66547d] mt-3 text-sm sm:text-base">
            Ready to celebrate more milestones? Log in to your digital gala.
          </p>
        </div>

        <form className="flex flex-col gap-6 w-full" onSubmit={(e) => e.preventDefault()}>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#37274d] px-2" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="hello@amanotes.com"
              className="w-full bg-[#eedcff]/50 px-6 py-4 rounded-[2rem] text-[#37274d] placeholder:text-[#826f9a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#652fe7]/40 focus:shadow-[0_8px_30px_rgba(101,47,231,0.1)] transition-all duration-300"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#37274d] px-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="w-full bg-[#eedcff]/50 px-6 py-4 rounded-[2rem] text-[#37274d] placeholder:text-[#826f9a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#652fe7]/40 focus:shadow-[0_8px_30px_rgba(101,47,231,0.1)] transition-all duration-300"
            />
          </div>

          <div className="flex justify-end px-2 -mt-2">
            <Link to="#" className="text-sm font-semibold text-[#652fe7] hover:text-[#5819db] transition-colors">
              Forgot password?
            </Link>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-4 w-full py-4 bg-gradient-to-br from-[#652fe7] to-[#a98fff] text-white rounded-full font-bold text-lg shadow-[0_12px_40px_rgba(101,47,231,0.25)] hover:shadow-[0_16px_50px_rgba(101,47,231,0.35)] transition-all duration-300 font-['Plus_Jakarta_Sans',sans-serif]"
          >
            Log In
          </motion.button>
        </form>

        <div className="mt-8 text-center text-sm text-[#66547d]">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-[#652fe7] hover:text-[#5819db] underline underline-offset-4">
            Sign up here
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
