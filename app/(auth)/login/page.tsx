"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			await signIn.email({
				email,
				password,
			});
			router.push("/dashboard");
		} catch (err) {
			setError("Invalid email or password");
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="bg-white rounded-lg shadow-md p-8">
			<h1 className="text-2xl font-bold text-center mb-6">Sign in to Linky</h1>

			{error && (
				<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
					{error}
				</div>
			)}

			<OAuthButtons />

			<div className="relative my-6">
				<div className="absolute inset-0 flex items-center">
					<div className="w-full border-t border-gray-300" />
				</div>
				<div className="relative flex justify-center text-sm">
					<span className="px-2 bg-white text-gray-500">Or continue with email</span>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
						Email
					</label>
					<input
						type="email"
						id="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<div>
					<label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
						Password
					</label>
					<input
						type="password"
						id="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<button
					type="submit"
					disabled={loading}
					className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? "Signing in..." : "Sign in"}
				</button>
			</form>

			<p className="mt-4 text-center text-sm text-gray-600">
				Don&apos;t have an account?{" "}
				<Link href="/register" className="text-blue-600 hover:underline">
					Sign up
				</Link>
			</p>
		</div>
	);
}
