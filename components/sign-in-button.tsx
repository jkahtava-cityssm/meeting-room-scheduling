"use client";

import Image from "next/image";
import { MicrosoftButton } from "./ui/microsoft-signin-button";
import { useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { Button } from "./ui/button";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Loader2Icon } from "lucide-react";

export const signInGitHub = async (callback: string) => {
	const data = await signIn.social({
		provider: "github",
		callbackURL: callback,
	});
	return data;
};

export const signInAzure = async (callback: string) => {
	const data = await signIn.social({
		provider: "microsoft",
		callbackURL: callback,
		scopes: ["email", "openid", "profile", "offline_access", "User.Read"],
	});
	return data;
};

export function SignInMicrosoft() {
	const searchParams = useSearchParams();

	const callbackURL = searchParams.get("callbackurl") == null ? "/bookings/user-view" : (searchParams.get("callbackurl") as string);

	return (
		<>
			<MicrosoftButton onClick={() => signInAzure(callbackURL)}>
				<Image
					src="/images/ms-symbollockup_mssymbol_19.svg"
					alt="An image of the crest and wreath of the city of Sault Ste. Marie"
					width={21}
					height={21}
				/>
				Sign in with Microsoft
			</MicrosoftButton>
		</>
	);
}

export function SignInGithub() {
	const { resolvedTheme } = useTheme();

	const searchParams = useSearchParams();

	const callbackURL = searchParams.get("callbackurl") == null ? "/bookings/user-view" : (searchParams.get("callbackurl") as string);

	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	return (
		<>
			<Button onClick={() => signInGitHub(callbackURL)}>
				{mounted ? (
					<Image
						src={resolvedTheme === "light" ? "/images/github-mark-white.svg" : "/images/github-mark.svg"}
						alt="An image of the crest and wreath of the city of Sault Ste. Marie"
						width={21}
						height={21}
					/>
				) : (
					<Loader2Icon className="h-5.25 w-5.25 animate-spin" />
				)}
				Sign in with GitHub
			</Button>
		</>
	);
}
