import posthog from "posthog-js";

/**
 * Track user registration event
 */
export function trackUserRegistered(data: {
	userId: string;
	username: string;
	email: string;
	registrationMethod: "email" | "oauth";
	referralSource?: string;
}) {
	if (typeof window === "undefined") return;

	posthog.capture("user_registered", {
		user_id: data.userId,
		username: data.username,
		email: data.email,
		registration_method: data.registrationMethod,
		referral_source: data.referralSource || "direct",
	});
}

/**
 * Track user login event
 */
export function trackUserLoggedIn(data: { userId: string; loginMethod: "email" | "oauth" }) {
	if (typeof window === "undefined") return;

	posthog.capture("user_logged_in", {
		user_id: data.userId,
		login_method: data.loginMethod,
	});
}

/**
 * Track link creation event
 */
export function trackLinkCreated(data: {
	linkId: string;
	title: string;
	url: string;
	hasIcon: boolean;
	urlDomain?: string;
}) {
	if (typeof window === "undefined") return;

	posthog.capture("link_created", {
		link_id: data.linkId,
		title: data.title,
		has_icon: data.hasIcon,
		url_domain: data.urlDomain,
	});
}

/**
 * Track link update event
 */
export function trackLinkUpdated(data: {
	linkId: string;
	changedFields: string[];
	hasIcon: boolean;
}) {
	if (typeof window === "undefined") return;

	posthog.capture("link_updated", {
		link_id: data.linkId,
		changed_fields: changedFields,
		has_icon: data.hasIcon,
	});
}

/**
 * Track link deletion event
 */
export function trackLinkDeleted(data: { linkId: string; linkAge: number; clickCount: number }) {
	if (typeof window === "undefined") return;

	posthog.capture("link_deleted", {
		link_id: data.linkId,
		link_age_days: linkAge,
		total_clicks: data.clickCount,
	});
}

/**
 * Track link reordering event
 */
export function trackLinkReordered(data: {
	totalLinks: number;
	reorderedFrom: number;
	reorderedTo: number;
}) {
	if (typeof window === "undefined") return;

	posthog.capture("link_reordered", {
		total_links: data.totalLinks,
		from_position: data.reorderedFrom,
		to_position: data.reorderedTo,
		position_change: Math.abs(data.reorderedTo - data.reorderedFrom),
	});
}

/**
 * Track theme customization event
 */
export function trackThemeCustomized(data: {
	backgroundColor?: string;
	buttonColor?: string;
	buttonTextColor?: string;
	fontFamily?: string;
	isPreset?: boolean;
	presetName?: string;
}) {
	if (typeof window === "undefined") return;

	posthog.capture("theme_customized", {
		background_color: data.backgroundColor,
		button_color: data.buttonColor,
		button_text_color: data.buttonTextColor,
		font_family: data.fontFamily,
		is_preset: data.isPreset || false,
		preset_name: data.presetName,
	});
}

/**
 * Track profile update event
 */
export function trackProfileUpdated(data: { changedFields: string[] }) {
	if (typeof window === "undefined") return;

	posthog.capture("profile_updated", {
		changed_fields: data.changedFields,
		field_count: data.changedFields.length,
	});
}

/**
 * Track upgrade initiated event (when user clicks upgrade button)
 */
export function trackUpgradeInitiated(data: { source: string; plan?: string }) {
	if (typeof window === "undefined") return;

	posthog.capture("upgrade_initiated", {
		source: data.source,
		plan: data.plan || "pro",
	});
}

/**
 * Track successful upgrade completion
 */
export function trackUpgradeCompleted(data: {
	userId: string;
	plan: string;
	price: number;
	currency: string;
}) {
	if (typeof window === "undefined") return;

	posthog.capture("upgrade_completed", {
		user_id: data.userId,
		plan: data.plan,
		price: data.price,
		currency: data.currency,
	});
}

/**
 * Track subscription cancellation
 */
export function trackSubscriptionCancelled(data: {
	userId: string;
	reason?: string;
	hadSubscriptionDays: number;
}) {
	if (typeof window === "undefined") return;

	posthog.capture("subscription_cancelled", {
		user_id: data.userId,
		cancellation_reason: data.reason || "not_specified",
		subscription_duration_days: data.hadSubscriptionDays,
	});
}

/**
 * Track link click (called from LinkButton component)
 */
export function trackLinkClick(data: {
	linkId: string;
	linkTitle: string;
	linkUrl: string;
	username?: string;
}) {
	if (typeof window === "undefined") return;

	posthog.capture("link_clicked", {
		link_id: data.linkId,
		link_title: data.linkTitle,
		link_url: data.linkUrl,
		username: data.username,
	});
}

/**
 * Track public page view
 */
export function trackPublicPageView(data: {
	username: string;
	linkCount: number;
	hasCustomTheme: boolean;
}) {
	if (typeof window === "undefined") return;

	posthog.capture("public_page_viewed", {
		username: data.username,
		link_count: data.linkCount,
		has_custom_theme: data.hasCustomTheme,
	});
}
