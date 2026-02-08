/**
 * TypeScript type definitions for PostHog API responses
 * Used for placeholder/mock data until PostHog is deployed
 */

export interface PostHogEvent {
	distinct_id: string;
	timestamp: string;
	properties: Record<string, unknown>;
	event?: string;
}

export interface PostHogQueryResult {
	results: PostHogEvent[];
	next?: string;
	previous?: string;
}

export interface PostHogPageViewEvent extends PostHogEvent {
	properties: {
		$current_url: string;
		$pathname?: string;
		$referrer?: string;
		[key: string]: unknown;
	};
}

export interface PostHogErrorEvent extends PostHogEvent {
	properties: {
		error_message: string;
		error_type?: string;
		error_stack?: string;
		$current_url?: string;
		[key: string]: unknown;
	};
}

export interface PostHogFeatureFlagEvent extends PostHogEvent {
	properties: {
		$feature_flag: string;
		$feature_flag_response: string;
		[key: string]: unknown;
	};
}

export interface PostHogConversionEvent extends PostHogEvent {
	properties: {
		variant: string;
		metric_value?: number;
		[key: string]: unknown;
	};
}

export interface PostHogNavigationEvent extends PostHogEvent {
	properties: {
		from_page: string;
		to_page: string;
		duration_ms: number;
		[key: string]: unknown;
	};
}
