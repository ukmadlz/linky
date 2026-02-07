import type { RunOptions, Spec } from "axe-core";

/**
 * Axe-core configuration for accessibility testing
 * Defines rules, thresholds, and custom configuration for WCAG 2.1 AA compliance
 */

/**
 * Default axe-core configuration for all tests
 */
export const axeConfig: RunOptions = {
	// Run rules for WCAG 2.0 Level A, AA and WCAG 2.1 Level A, AA
	runOnly: {
		type: "tag",
		values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"],
	},

	// Rules to enable/disable or modify
	rules: {
		// Color contrast - ensure 4.5:1 for normal text, 3:1 for large text
		"color-contrast": { enabled: true },

		// Ensure buttons have accessible names
		"button-name": { enabled: true },

		// Ensure links have accessible names
		"link-name": { enabled: true },

		// Ensure images have alt text
		"image-alt": { enabled: true },

		// Ensure form inputs have labels
		label: { enabled: true },

		// Ensure valid ARIA attributes
		"aria-valid-attr": { enabled: true },
		"aria-valid-attr-value": { enabled: true },

		// Ensure ARIA roles are valid
		"aria-roles": { enabled: true },

		// Ensure heading order is logical
		"heading-order": { enabled: true },

		// Ensure page has exactly one h1
		"page-has-heading-one": { enabled: true },

		// Ensure HTML has lang attribute
		"html-has-lang": { enabled: true },

		// Ensure valid HTML lang attribute
		"valid-lang": { enabled: true },

		// Ensure landmarks are unique
		"landmark-unique": { enabled: true },

		// Ensure regions have landmarks
		region: { enabled: true },

		// Disable rules that might be too strict for our use case
		"landmark-one-main": { enabled: false }, // We might have pages without main landmark
		bypass: { enabled: false }, // Skip to main content link might not be needed for simple layouts
	},

	// Set result types to include
	resultTypes: ["violations", "incomplete"],

	// Environment configuration
	reporter: "v2",
};

/**
 * Stricter configuration for critical pages (login, register, checkout)
 */
export const strictAxeConfig: RunOptions = {
	...axeConfig,
	runOnly: {
		type: "tag",
		values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"],
	},
	rules: {
		...axeConfig.rules,
		"landmark-one-main": { enabled: true },
		bypass: { enabled: true },
		"focus-order-semantics": { enabled: true },
	},
};

/**
 * Configuration for mobile accessibility testing
 */
export const mobileAxeConfig: RunOptions = {
	...axeConfig,
	rules: {
		...axeConfig.rules,
		// Ensure tap targets are at least 44x44px
		"target-size": { enabled: true },
	},
};

/**
 * Custom rule for checking focus indicators
 */
export const focusIndicatorRule: Spec = {
	id: "focus-indicator-visible",
	impact: "serious",
	selector: "a, button, input, select, textarea, [tabindex]:not([tabindex='-1'])",
	tags: ["best-practice"],
	// @ts-expect-error - axe-core types are incomplete
	evaluate(node: HTMLElement) {
		const styles = window.getComputedStyle(node);
		const focusStyles = window.getComputedStyle(node, ":focus");

		// Check if focus state has visible indicator
		const hasOutline = focusStyles.outline !== "none" && focusStyles.outlineWidth !== "0px";
		const hasBoxShadow = focusStyles.boxShadow !== "none" && focusStyles.boxShadow !== "";
		const hasBorderChange =
			focusStyles.borderColor !== styles.borderColor ||
			focusStyles.borderWidth !== styles.borderWidth;
		const hasBackgroundChange = focusStyles.backgroundColor !== styles.backgroundColor;

		return hasOutline || hasBoxShadow || hasBorderChange || hasBackgroundChange;
	},
	metadata: {
		description: "Ensures all interactive elements have visible focus indicators",
		help: "Interactive elements must have visible focus indicators for keyboard navigation",
	},
};

/**
 * Accessibility violation severity thresholds
 */
export const violationThresholds = {
	critical: 0, // No critical violations allowed
	serious: 0, // No serious violations allowed
	moderate: 5, // Max 5 moderate violations
	minor: 10, // Max 10 minor violations
};

/**
 * Check if accessibility scan results meet our thresholds
 */
export function checkViolationThresholds(violations: Array<{ impact: string }>) {
	const counts = {
		critical: 0,
		serious: 0,
		moderate: 0,
		minor: 0,
	};

	for (const violation of violations) {
		const impact = violation.impact as keyof typeof counts;
		if (impact in counts) {
			counts[impact]++;
		}
	}

	const failed: string[] = [];

	if (counts.critical > violationThresholds.critical) {
		failed.push(`${counts.critical} critical violations (max ${violationThresholds.critical})`);
	}
	if (counts.serious > violationThresholds.serious) {
		failed.push(`${counts.serious} serious violations (max ${violationThresholds.serious})`);
	}
	if (counts.moderate > violationThresholds.moderate) {
		failed.push(`${counts.moderate} moderate violations (max ${violationThresholds.moderate})`);
	}
	if (counts.minor > violationThresholds.minor) {
		failed.push(`${counts.minor} minor violations (max ${violationThresholds.minor})`);
	}

	return {
		passed: failed.length === 0,
		failed,
		counts,
	};
}

/**
 * Pages that require strict accessibility compliance
 */
export const criticalPages = ["/login", "/register", "/checkout", "/dashboard", "/pricing"];

/**
 * Selectors to exclude from accessibility scans (e.g., third-party widgets)
 */
export const excludeSelectors = [
	// Exclude third-party scripts/widgets if any
	"#stripe-checkout",
	"#google-analytics",
	// Add more as needed
];

/**
 * Get appropriate axe config for a given page
 */
export function getAxeConfigForPage(url: string): RunOptions {
	// Use strict config for critical pages
	if (criticalPages.some((page) => url.includes(page))) {
		return strictAxeConfig;
	}

	// Use mobile config for mobile user agents
	if (typeof window !== "undefined" && /mobile/i.test(navigator.userAgent)) {
		return mobileAxeConfig;
	}

	// Default config
	return axeConfig;
}

/**
 * Format violation results for readable output
 */
export function formatViolations(
	violations: Array<{
		id: string;
		impact: string;
		description: string;
		nodes: Array<{ html: string; target: string[] }>;
	}>
) {
	return violations.map((violation) => ({
		rule: violation.id,
		impact: violation.impact,
		description: violation.description,
		nodes: violation.nodes.map((node) => ({
			html: node.html,
			target: node.target.join(" > "),
		})),
	}));
}
