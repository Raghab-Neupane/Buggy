import React, { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, CheckCircle, XCircle, ArrowLeft, ShieldCheck, KeyRound } from "lucide-react";

export const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setResult(null);

        if (!token) {
            setResult({ type: "error", text: "Missing reset token. Please use the link from your email." });
            return;
        }

        if (newPassword.length < 6) {
            setResult({ type: "error", text: "Password must be at least 6 characters." });
            return;
        }

        if (newPassword !== confirmPassword) {
            setResult({ type: "error", text: "Passwords do not match." });
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch("http://localhost:8000/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token, new_password: newPassword }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || "Failed to reset password.");
            }

            setResult({ type: "success", text: "Password has been reset successfully!" });
        } catch (err) {
            setResult({ type: "error", text: err instanceof Error ? err.message : "An error occurred." });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center p-6 min-h-screen bg-slate-50 select-none">
            <div className="w-full max-w-md">
                <AnimatePresence mode="wait">
                    {result?.type === "success" ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white border-4 border-slate-900 p-8 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] text-center"
                        >
                            <div className="flex justify-center mb-4">
                                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-slate-900 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Password Reset!</h2>
                            <p className="text-xs text-slate-500 font-bold mb-6">
                                Your password has been updated successfully. You can now sign in with your new password.
                            </p>

                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 border-2 border-slate-900 text-white font-black rounded-lg shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] transition-all cursor-pointer text-sm"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Sign In
                            </Link>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white border-4 border-slate-900 p-8 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
                        >
                            {/* Back to login */}
                            <Link
                                to="/login"
                                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 mb-6 cursor-pointer"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Sign In
                            </Link>

                            {/* Header */}
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-violet-50 border-2 border-slate-900 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                                    <KeyRound className="w-5 h-5 text-violet-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-extrabold text-slate-900">New Password</h2>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 font-bold mb-6">
                                Enter your new password below to complete the reset.
                            </p>

                            {/* Error Message */}
                            {result?.type === "error" && (
                                <div className="p-3 mb-4 border-2 border-slate-900 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-2">
                                    <XCircle className="w-4 h-4 shrink-0" />
                                    {result.text}
                                </div>
                            )}

                            {/* No Token Warning */}
                            {!token && (
                                <div className="p-3 mb-4 border-2 border-slate-900 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 shrink-0" />
                                    No reset token found in URL. Please use the link from your email.
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-700 uppercase mb-1">New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="password"
                                            required
                                            minLength={6}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-2 border-slate-900 rounded-lg focus:outline-none focus:bg-white text-sm font-semibold"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-700 uppercase mb-1">Confirm New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="password"
                                            required
                                            minLength={6}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-2 border-slate-900 rounded-lg focus:outline-none focus:bg-white text-sm font-semibold"
                                        />
                                    </div>
                                </div>

                                {/* Password strength indicator */}
                                {newPassword.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                                            <div
                                                className={`h-full rounded-full transition-all duration-300 ${
                                                    newPassword.length >= 12
                                                        ? "w-full bg-emerald-500"
                                                        : newPassword.length >= 8
                                                        ? "w-2/3 bg-amber-400"
                                                        : "w-1/3 bg-rose-500"
                                                }`}
                                            />
                                        </div>
                                        <span className={`text-[9px] font-extrabold uppercase ${
                                            newPassword.length >= 12
                                                ? "text-emerald-600"
                                                : newPassword.length >= 8
                                                ? "text-amber-600"
                                                : "text-rose-600"
                                        }`}>
                                            {newPassword.length >= 12 ? "Strong" : newPassword.length >= 8 ? "Medium" : "Weak"}
                                        </span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting || !token}
                                    className="w-full py-3 bg-violet-600 hover:bg-violet-700 border-2 border-slate-900 text-white font-black rounded-lg shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] transition-all cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? "Resetting..." : "Reset Password"}
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
