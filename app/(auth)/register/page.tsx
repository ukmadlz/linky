"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "@/lib/auth-client";

export default function RegisterPage() {
	const router = useRouter();
	const [formData, setFormData] = useState({
		email: "",
		username: "",
		name: "",
		password: "",
		confirmPassword: "",
	});
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		// Validation
		if (formData.password !== formData.confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		if (formData.password.length < 8) {
			setError("Password must be at least 8 characters");
			return;
		}

		if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
			setError("Username can only contain letters, numbers, hyphens, and underscores");
			return;
		}

		setLoading(true);

		try {
			// Register user via API
			const response = await fetch("/api/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: formData.email,
					username: formData.username,
					name: formData.name,
					password: formData.password,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.error || "Registration failed");
				setLoading(false);
				return;
			}

			// Now sign in
			await signIn.email({
				email: formData.email,
				password: formData.password,
			});

			router.push("/dashboard");
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="bg-white rounded-lg shadow-md p-8">
			<h1 className="text-2xl font-bold text-center mb-6">Create your Linky account</h1>

			{error && (
				<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
					{error}
				</div>
			)}

			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
						Email
					</label>
					<input
						type="email"
						id="email"
						value={formData.email}
						onChange={(e) => setFormData({ ...formData, email: e.target.value })}
						required
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<div>
					<label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
						Username
					</label>
					<input
						type="text"
						id="username"
						value={formData.username}
						onChange={(e) => setFormData({ ...formData, username: e.target.value })}
						required
						pattern="[a-zA-Z0-9_-]+"
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<p className="mt-1 text-xs text-gray-500">
						Your public profile URL will be: linky.com/{formData.username || "username"}
					</p>
				</div>

				<div>
					<label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
						Display Name
					</label>
					<input
						type="text"
						id="name"
						value={formData.name}
						onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
						value={formData.password}
						onChange={(e) => setFormData({ ...formData, password: e.target.value })}
						required
						minLength={8}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<div>
					<label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
						Confirm Password
					</label>
					<input
						type="password"
						id="confirmPassword"
						value={formData.confirmPassword}
						onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
						required
						minLength={8}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<button
					type="submit"
					disabled={loading}
					className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? "Creating account..." : "Sign up"}
				</button>
			</form>

			<p className="mt-4 text-center text-sm text-gray-600">
				Already have an account?{" "}
				<Link href="/login" className="text-blue-600 hover:underline">
					Sign in
				</Link>
			</p>
		</div>
	);
}
