# Analytics Documentation

This document provides comprehensive documentation for all analytics events, properties, and tracking in the Linky application.

## Table of Contents

1. [Event Taxonomy](#event-taxonomy)
2. [Custom Events](#custom-events)
3. [Standard Properties](#standard-properties)
4. [Privacy & Data Retention](#privacy--data-retention)
5. [Analytics Queries](#analytics-queries)
6. [Best Practices](#best-practices)

## Event Taxonomy

### Naming Conventions

All custom events follow these naming conventions:

- **snake_case** - All event names use snake_case (e.g., `user_registered`, `link_created`)
- **Past tense** - Events use past tense verbs (e.g., `created`, `updated`, `deleted`)
- **Object-action** - Format: `{object}_{action}` (e.g., `link_clicked`, `theme_customized`)

### Event Categories

Events are organized into the following categories:

1. **User Events** - User account actions
2. **Link Events** - Link management actions
3. **Theme Events** - Theme customization actions
4. **Subscription Events** - Pro subscription actions
5. **Page Events** - Page views and navigation
6. **Session Events** - User session tracking
7. **Error Events** - Error and exception tracking
8. **Performance Events** - Performance metrics

## Custom Events

### User Events

#### `user_registered`
Tracked when a new user creates an account.

**Properties:**
- `email` (string) - User's email address
- `username` (string) - Chosen username
- `registration_method` (string) - "email", "google", or "github"
- `referrer` (string, optional) - Referral source
- `utm_source` (string, optional) - UTM source parameter
- `utm_campaign` (string, optional) - UTM campaign parameter

**Example:**
```json
{
  "event": "user_registered",
  "properties": {
    "email": "user@example.com",
    "username": "johndoe",
    "registration_method": "email",
    "utm_source": "twitter"
  }
}
```

#### `user_logged_in`
Tracked when a user logs into their account.

**Properties:**
- `user_id` (string) - User's unique ID
- `login_method` (string) - "email", "google", or "github"
- `is_pro` (boolean) - Whether user has Pro subscription

**Example:**
```json
{
  "event": "user_logged_in",
  "properties": {
    "user_id": "usr_123",
    "login_method": "google",
    "is_pro": false
  }
}
```

### Link Events

#### `link_created`
Tracked when a user creates a new link.

**Properties:**
- `user_id` (string) - User's unique ID
- `link_id` (string) - Link's unique ID
- `has_icon` (boolean) - Whether link has a custom icon
- `url_domain` (string) - Domain of the link URL
- `position` (number) - Position in the link list

**Example:**
```json
{
  "event": "link_created",
  "properties": {
    "user_id": "usr_123",
    "link_id": "lnk_456",
    "has_icon": true,
    "url_domain": "github.com",
    "position": 1
  }
}
```

#### `link_updated`
Tracked when a user updates an existing link.

**Properties:**
- `user_id` (string) - User's unique ID
- `link_id` (string) - Link's unique ID
- `fields_changed` (array) - List of changed fields
- `title_changed` (boolean) - Whether title was changed
- `url_changed` (boolean) - Whether URL was changed
- `icon_changed` (boolean) - Whether icon was changed

**Example:**
```json
{
  "event": "link_updated",
  "properties": {
    "user_id": "usr_123",
    "link_id": "lnk_456",
    "fields_changed": ["title", "icon"],
    "title_changed": true,
    "url_changed": false,
    "icon_changed": true
  }
}
```

#### `link_deleted`
Tracked when a user deletes a link.

**Properties:**
- `user_id` (string) - User's unique ID
- `link_id` (string) - Link's unique ID
- `link_age_days` (number) - Age of link in days
- `click_count` (number) - Total clicks before deletion

**Example:**
```json
{
  "event": "link_deleted",
  "properties": {
    "user_id": "usr_123",
    "link_id": "lnk_456",
    "link_age_days": 30,
    "click_count": 150
  }
}
```

#### `link_reordered`
Tracked when a user reorders links via drag and drop.

**Properties:**
- `user_id` (string) - User's unique ID
- `link_id` (string) - Link's unique ID
- `old_position` (number) - Previous position
- `new_position` (number) - New position
- `total_links` (number) - Total number of links

**Example:**
```json
{
  "event": "link_reordered",
  "properties": {
    "user_id": "usr_123",
    "link_id": "lnk_456",
    "old_position": 1,
    "new_position": 3,
    "total_links": 5
  }
}
```

#### `link_click`
Tracked when someone clicks on a link from a public profile.

**Properties:**
- `link_id` (string) - Link's unique ID
- `link_title` (string) - Link title
- `link_url` (string) - Link URL
- `profile_username` (string) - Profile owner's username
- `referrer` (string, optional) - Where visitor came from

**Example:**
```json
{
  "event": "link_click",
  "properties": {
    "link_id": "lnk_456",
    "link_title": "My GitHub",
    "link_url": "https://github.com/johndoe",
    "profile_username": "johndoe",
    "referrer": "twitter.com"
  }
}
```

### Theme Events

#### `theme_customized`
Tracked when a user changes their profile theme.

**Properties:**
- `user_id` (string) - User's unique ID
- `theme_changed` (boolean) - Whether theme preset was changed
- `background_color_changed` (boolean) - Background color changed
- `text_color_changed` (boolean) - Text color changed
- `button_color_changed` (boolean) - Button color changed

**Example:**
```json
{
  "event": "theme_customized",
  "properties": {
    "user_id": "usr_123",
    "theme_changed": true,
    "background_color_changed": false,
    "text_color_changed": false,
    "button_color_changed": false
  }
}
```

### Profile Events

#### `profile_updated`
Tracked when a user updates their profile information.

**Properties:**
- `user_id` (string) - User's unique ID
- `fields_updated` (array) - List of updated fields
- `avatar_changed` (boolean) - Avatar image changed
- `bio_changed` (boolean) - Bio text changed
- `name_changed` (boolean) - Display name changed

**Example:**
```json
{
  "event": "profile_updated",
  "properties": {
    "user_id": "usr_123",
    "fields_updated": ["avatar", "bio"],
    "avatar_changed": true,
    "bio_changed": true,
    "name_changed": false
  }
}
```

### Subscription Events

#### `upgrade_initiated`
Tracked when a user clicks the upgrade to Pro button.

**Properties:**
- `user_id` (string) - User's unique ID
- `source` (string) - Where upgrade was initiated ("settings", "analytics", "link_limit")

**Example:**
```json
{
  "event": "upgrade_initiated",
  "properties": {
    "user_id": "usr_123",
    "source": "link_limit"
  }
}
```

#### `upgrade_completed`
Tracked when a user successfully upgrades to Pro.

**Properties:**
- `user_id` (string) - User's unique ID
- `plan` (string) - "pro"
- `price` (number) - Price paid
- `currency` (string) - Currency code
- `billing_interval` (string) - "monthly" or "yearly"

**Example:**
```json
{
  "event": "upgrade_completed",
  "properties": {
    "user_id": "usr_123",
    "plan": "pro",
    "price": 9,
    "currency": "USD",
    "billing_interval": "monthly"
  }
}
```

#### `subscription_cancelled`
Tracked when a user cancels their Pro subscription.

**Properties:**
- `user_id` (string) - User's unique ID
- `cancellation_reason` (string, optional) - Reason for cancellation
- `subscription_age_days` (number) - How long they were subscribed

**Example:**
```json
{
  "event": "subscription_cancelled",
  "properties": {
    "user_id": "usr_123",
    "cancellation_reason": "too_expensive",
    "subscription_age_days": 60
  }
}
```

### Page Events

#### `$pageview`
Automatically tracked by PostHog for every page visit.

**Standard Properties:**
- `$current_url` (string) - Current page URL
- `$pathname` (string) - URL pathname
- `$referrer` (string) - Previous page URL
- `$referring_domain` (string) - Referrer domain

**Custom Properties:**
- `page_type` (string) - "dashboard", "public_profile", "settings", etc.
- `is_authenticated` (boolean) - Whether user is logged in
- `utm_source`, `utm_medium`, `utm_campaign` - UTM parameters

#### `public_page_view`
Tracked when someone views a public profile page.

**Properties:**
- `profile_username` (string) - Profile owner's username
- `profile_owner_id` (string) - Profile owner's user ID
- `link_count` (number) - Number of links on profile
- `theme` (string) - Theme name
- `referrer` (string, optional) - Where visitor came from

**Example:**
```json
{
  "event": "public_page_view",
  "properties": {
    "profile_username": "johndoe",
    "profile_owner_id": "usr_123",
    "link_count": 5,
    "theme": "default",
    "referrer": "google.com"
  }
}
```

### Session Events

#### `session_started`
Tracked when a new session begins.

**Properties:**
- `session_id` (string) - Unique session ID
- `session_source` (string) - "direct", "organic", "social", "referral"
- `referrer` (string, optional) - Referrer URL
- `utm_source`, `utm_medium`, `utm_campaign` - UTM parameters

#### `session_engagement`
Tracked periodically during active sessions (every 30 seconds of activity).

**Properties:**
- `session_id` (string) - Unique session ID
- `session_duration_seconds` (number) - Current session duration
- `pages_viewed` (number) - Pages viewed in session
- `interactions` (number) - Click/interaction count

#### `session_ended`
Tracked when a session ends (page close, navigation away).

**Properties:**
- `session_id` (string) - Unique session ID
- `session_duration_seconds` (number) - Total session duration
- `pages_viewed` (number) - Total pages viewed
- `total_interactions` (number) - Total interactions

### Error Events

#### `$exception`
Tracked for all JavaScript errors and exceptions.

**Properties:**
- `error_message` (string) - Error message
- `error_name` (string) - Error name/type
- `error_stack` (string) - Stack trace
- `error_type` (string) - "client_error", "server_error", etc.
- `component_stack` (string, optional) - React component stack
- `error_boundary` (boolean, optional) - Caught by error boundary
- `route` (string, optional) - API route where error occurred
- `user_id` (string, optional) - User ID if authenticated

### Performance Events

#### `web_vitals`
Tracked for Core Web Vitals metrics.

**Properties:**
- `metric_name` (string) - "FCP", "LCP", "CLS", "FID", "TTFB", "INP"
- `metric_value` (number) - Metric value
- `metric_rating` (string) - "good", "needs-improvement", "poor"
- `navigation_type` (string) - Navigation type

#### `api_performance`
Tracked for API route performance.

**Properties:**
- `route` (string) - API route path
- `method` (string) - HTTP method
- `duration_ms` (number) - Response time in milliseconds
- `status` (number) - HTTP status code
- `is_slow` (boolean) - Whether request was slow (>1s)
- `is_very_slow` (boolean) - Whether request was very slow (>5s)

#### `db_performance`
Tracked for database query performance.

**Properties:**
- `operation` (string) - "select", "insert", "update", "delete"
- `table` (string) - Database table name
- `duration_ms` (number) - Query time in milliseconds
- `is_slow` (boolean) - Whether query was slow (>100ms)
- `is_very_slow` (boolean) - Whether query was very slow (>1s)

## Standard Properties

### User Properties

Set via `posthog.identify()` when user logs in:

- `email` (string) - User's email address
- `username` (string) - User's username
- `name` (string) - User's display name
- `is_pro` (boolean) - Whether user has Pro subscription
- `link_count` (number) - Number of links user has
- `created_at` (string) - Account creation timestamp
- `last_seen` (string) - Last activity timestamp

### Super Properties

Set globally for all events:

- `app_version` (string) - Application version
- `environment` (string) - "development" or "production"

## Privacy & Data Retention

### Data Retention Policy

- **Analytics Events**: 90 days (configurable via `DATA_RETENTION_DAYS`)
- **User Data**: Retained until account deletion
- **Error Logs**: 30 days
- **Performance Metrics**: 30 days

### GDPR Compliance

Users have the right to:

1. **Access their data**: `GET /api/privacy/export`
2. **Delete their data**: `POST /api/privacy/delete`
3. **Opt-out of tracking**: Cookie consent banner

### Privacy Features

- **IP Masking**: Configurable via `NEXT_PUBLIC_POSTHOG_DISABLE_IP_TRACKING`
- **User ID Anonymization**: Configurable via `ANONYMIZE_USER_IDS`
- **Cookie Consent**: Required before analytics tracking starts
- **Session Recording**: Masks all input fields and sensitive data

## Analytics Queries

### Common Queries

#### User Growth
```sql
SELECT
  toStartOfDay(timestamp) as date,
  countDistinct(distinct_id) as users
FROM events
WHERE event = 'user_registered'
  AND timestamp > now() - INTERVAL 30 DAY
GROUP BY date
ORDER BY date ASC
```

#### Link Click Rate
```sql
SELECT
  properties.profile_username as username,
  countIf(event = 'public_page_view') as page_views,
  countIf(event = 'link_click') as link_clicks,
  link_clicks / page_views * 100 as click_rate
FROM events
WHERE event IN ('public_page_view', 'link_click')
  AND timestamp > now() - INTERVAL 7 DAY
GROUP BY username
HAVING page_views > 10
ORDER BY click_rate DESC
LIMIT 10
```

#### Conversion Funnel
```sql
SELECT
  step,
  count() as users,
  count() / (SELECT count() FROM events WHERE event = 'user_registered' AND timestamp > now() - INTERVAL 30 DAY) * 100 as conversion_rate
FROM (
  SELECT DISTINCT distinct_id, 1 as step FROM events WHERE event = 'user_registered' AND timestamp > now() - INTERVAL 30 DAY
  UNION ALL
  SELECT DISTINCT distinct_id, 2 as step FROM events WHERE event = 'link_created' AND timestamp > now() - INTERVAL 30 DAY
  UNION ALL
  SELECT DISTINCT distinct_id, 3 as step FROM events WHERE event = 'theme_customized' AND timestamp > now() - INTERVAL 30 DAY
  UNION ALL
  SELECT DISTINCT distinct_id, 4 as step FROM events WHERE event = 'upgrade_completed' AND timestamp > now() - INTERVAL 30 DAY
)
GROUP BY step
ORDER BY step ASC
```

#### Top Error Messages
```sql
SELECT
  properties.error_message as error,
  count() as occurrences,
  countDistinct(distinct_id) as affected_users
FROM events
WHERE event = '$exception'
  AND timestamp > now() - INTERVAL 7 DAY
GROUP BY error
ORDER BY occurrences DESC
LIMIT 10
```

#### Average Page Load Time
```sql
SELECT
  properties.pathname as page,
  avg(properties.metric_value) as avg_lcp,
  percentile_75(properties.metric_value) as p75_lcp,
  percentile_95(properties.metric_value) as p95_lcp
FROM events
WHERE event = 'web_vitals'
  AND properties.metric_name = 'LCP'
  AND timestamp > now() - INTERVAL 7 DAY
GROUP BY page
ORDER BY avg_lcp DESC
LIMIT 10
```

## Best Practices

### 1. Event Naming

- Use consistent naming conventions (snake_case, past tense)
- Be specific but not overly granular
- Group related events by prefix (e.g., `link_*`, `user_*`)

### 2. Properties

- Always include `user_id` for authenticated events
- Use consistent property names across events
- Include context that helps answer "why" questions
- Don't track PII in custom properties (use user properties instead)

### 3. Performance

- Track performance for critical user journeys
- Set appropriate thresholds for "slow" vs "very slow"
- Alert on regressions, not absolute values

### 4. Privacy

- Always respect user consent choices
- Implement data retention policies
- Anonymize data where possible
- Provide data export and deletion capabilities

### 5. Testing

- Test analytics in development with `console.log`
- Verify events appear in PostHog dashboard
- Check property values are correct
- Test privacy controls (opt-out, deletion)

## Resources

- [PostHog Documentation](https://posthog.com/docs)
- [Event Tracking Best Practices](https://posthog.com/docs/product-analytics/event-tracking-best-practices)
- [GDPR Compliance Guide](https://posthog.com/docs/privacy/gdpr-compliance)
