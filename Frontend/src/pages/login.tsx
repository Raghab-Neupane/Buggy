import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowLeft, UserPlus, LogIn } from "lucide-react";

type ViewState = "login" | "signup" | "forgot";

export const Login: React.FC = () => {
    const [view, setView] = useState<ViewState>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (view === "signup" && password !== confirmPassword) {
            setMessage({ type: "error", text: "Passwords do not match." });
            return;
        }

        try {
            if (view === "login") {
                const response = await fetch("http://localhost:8000/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email, password }),
                });

                if (!response.ok) {
                    throw new Error("Invalid credentials or login failed.");
                }

                setMessage({ type: "success", text: "Logged in successfully! Redirecting..." });
                setTimeout(() => {
                    window.location.href = "/dashboard";
                }, 1500);
            } else if (view === "signup") {
                setMessage({ type: "success", text: "Account created successfully! (Demo)" });
            } else if (view === "forgot") {
                const response = await fetch("http://localhost:8000/send-email", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to send reset email.");
                }

                setMessage({ type: "success", text: "Password reset link sent to your email!" });
            }
        } catch (err) {
            setMessage({ type: "error", text: err instanceof Error ? err.message : "An error occurred." });
        }
    };

    const switchView = (newView: ViewState) => {
        setMessage(null);
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setView(newView);
    };

    return (
        <div className="flex-1 flex items-center justify-center p-6 min-h-screen bg-slate-50 select-none">
            <div className="w-full max-w-md">
                <AnimatePresence mode="wait">
                    {view === "login" && (
                        <motion.div
                            key="login"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white border-4 border-slate-900 p-8 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
                        >
                            <div className="flex items-center gap-2 mb-6">
                                <LogIn className="w-6 h-6 text-indigo-600" />
                                <h2 className="text-2xl font-extrabold text-slate-900">Sign In</h2>
                            </div>

                            {message && (
                                <div
                                    className={`p-3 mb-4 border-2 border-slate-900 rounded-lg text-xs font-bold ${message.type === "success" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                                        }`}
                                >
                                    {message.text}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-700 uppercase mb-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-2 border-slate-900 rounded-lg focus:outline-none focus:bg-white text-sm font-semibold"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-xs font-black text-slate-700 uppercase">Password</label>
                                        <button
                                            type="button"
                                            onClick={() => switchView("forgot")}
                                            className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                                        >
                                            Forgot Password?
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-2 border-slate-900 rounded-lg focus:outline-none focus:bg-white text-sm font-semibold"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 border-2 border-slate-900 text-white font-black rounded-lg shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] transition-all cursor-pointer text-sm"
                                >
                                    Sign In
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <button
                                    onClick={() => switchView("signup")}
                                    className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                                >
                                    Don't have an account? <span className="text-indigo-600 hover:underline">Register</span>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {view === "signup" && (
                        <motion.div
                            key="signup"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white border-4 border-slate-900 p-8 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
                        >
                            <div className="flex items-center gap-2 mb-6">
                                <UserPlus className="w-6 h-6 text-emerald-600" />
                                <h2 className="text-2xl font-extrabold text-slate-900">Create Account</h2>
                            </div>

                            {message && (
                                <div
                                    className={`p-3 mb-4 border-2 border-slate-900 rounded-lg text-xs font-bold ${message.type === "success" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                                        }`}
                                >
                                    {message.text}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-700 uppercase mb-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-2 border-slate-900 rounded-lg focus:outline-none focus:bg-white text-sm font-semibold"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-700 uppercase mb-1">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-2 border-slate-900 rounded-lg focus:outline-none focus:bg-white text-sm font-semibold"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-700 uppercase mb-1">Confirm Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="password"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-2 border-slate-900 rounded-lg focus:outline-none focus:bg-white text-sm font-semibold"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 border-2 border-slate-900 text-white font-black rounded-lg shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] transition-all cursor-pointer text-sm"
                                >
                                    Register
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <button
                                    onClick={() => switchView("login")}
                                    className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                                >
                                    Already have an account? <span className="text-indigo-600 hover:underline">Sign In</span>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {view === "forgot" && (
                        <motion.div
                            key="forgot"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white border-4 border-slate-900 p-8 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
                        >
                            <button
                                onClick={() => switchView("login")}
                                className="flex items-center gap-1.5 text-xs font-bold text-slate-550 hover:text-slate-800 mb-6 cursor-pointer"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Sign In
                            </button>

                            <div className="flex items-center gap-2 mb-4">
                                <Lock className="w-6 h-6 text-rose-500" />
                                <h2 className="text-2xl font-extrabold text-slate-900">Reset Password</h2>
                            </div>
                            <p className="text-xs text-slate-550 font-bold mb-6">
                                Enter your email address and we'll send you a link to reset your password.
                            </p>

                            {message && (
                                <div
                                    className={`p-3 mb-4 border-2 border-slate-900 rounded-lg text-xs font-bold ${message.type === "success" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                                        }`}
                                >
                                    {message.text}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-700 uppercase mb-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-2 border-slate-900 rounded-lg focus:outline-none focus:bg-white text-sm font-semibold"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3 bg-rose-500 hover:bg-rose-600 border-2 border-slate-900 text-white font-black rounded-lg shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] transition-all cursor-pointer text-sm"
                                >
                                    Send Reset Link
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
