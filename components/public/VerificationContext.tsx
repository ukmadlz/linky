"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { VerificationModal } from "./VerificationModal";

interface ModalState {
	blockId: string;
	verificationMode: "age" | "acknowledge";
}

interface VerificationContextValue {
	openModal: (
		blockId: string,
		verificationMode: "age" | "acknowledge",
	) => void;
}

const VerificationContext = createContext<VerificationContextValue>({
	openModal: () => {},
});

export function useVerification() {
	return useContext(VerificationContext);
}

interface VerificationProviderProps {
	slug: string;
	cssVars: Record<string, string>;
	initialState?: ModalState;
	initialError?: string;
	children: React.ReactNode;
}

export function VerificationProvider({
	slug,
	cssVars,
	initialState,
	initialError,
	children,
}: VerificationProviderProps) {
	const [modal, setModal] = useState<ModalState | null>(initialState ?? null);
	const [error, setError] = useState<string | undefined>(initialError);

	const openModal = useCallback(
		(blockId: string, verificationMode: "age" | "acknowledge") => {
			setModal({ blockId, verificationMode });
			setError(undefined);
			history.pushState(null, "", `/${slug}?verify=${blockId}`);
		},
		[slug],
	);

	const closeModal = useCallback(() => {
		setModal(null);
		setError(undefined);
		history.replaceState(null, "", `/${slug}`);
	}, [slug]);

	// Close modal when the user navigates back
	useEffect(() => {
		const onPop = () => {
			const params = new URLSearchParams(window.location.search);
			if (!params.get("verify")) setModal(null);
		};
		window.addEventListener("popstate", onPop);
		return () => window.removeEventListener("popstate", onPop);
	}, []);

	return (
		<VerificationContext.Provider value={{ openModal }}>
			{children}
			{modal && (
				<VerificationModal
					blockId={modal.blockId}
					verificationMode={modal.verificationMode}
					error={error}
					cssVars={cssVars}
					onClose={closeModal}
				/>
			)}
		</VerificationContext.Provider>
	);
}
