# Performance Monitoring Guide

This guide explains how performance monitoring is implemented in Linky, including Core Web Vitals tracking, API performance monitoring, and database query performance.

## Overview

Linky tracks three types of performance metrics:

1. **Core Web Vitals** - Client-side user experience metrics
2. **API Performance** - Server-side API response times
3. **Database Performance** - Database query execution times

All metrics are tracked in PostHog for analysis and visualization.

## 1. Core Web Vitals Tracking

### Metrics Tracked

- **FCP (First Contentful Paint)** - Time until first content is painted
- **LCP (Largest Contentful Paint)** - Time until largest content element is painted
- **CLS (Cumulative Layout Shift)** - Visual stability score
- **FID (First Input Delay)** - Time from first user interaction to browser response
- **TTFB (Time to First Byte)** - Server response time
- **INP (Interaction to Next Paint)** - Responsiveness to user interactions

### Implementation

Core Web Vitals are automatically tracked using the `WebVitalsTracker` component, which is included in the `PostHogProvider`:

```tsx
// Automatically included in app/layout.tsx via PostHogProvider
<PostHogProvider>
  <WebVitalsTracker />
  {children}
</PostHogProvider>
```

### Thresholds

```typescript
const THRESHOLDS = {
  FCP: { good: 1800ms, poor: 3000ms },
  LCP: { good: 2500ms, poor: 4000ms },
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100ms, poor: 300ms },
  TTFB: { good: 800ms, poor: 1800ms },
  INP: { good: 200ms, poor: 500ms },
};
```

### Viewing Web Vitals in PostHog

1. Go to **Insights** > **Create new insight**
2. Filter by event: `web_vitals`
3. Group by: `metric_name`
4. Breakdown by: `metric_rating` (good, needs-improvement, poor)
5. Visualize as: Line chart or table

Example queries:
```sql
-- Average LCP by page
SELECT
  properties.pathname,
  avg(properties.metric_value) as avg_lcp
FROM events
WHERE event = 'web_vitals'
  AND properties.metric_name = 'LCP'
  AND timestamp > now() - INTERVAL 7 DAY
GROUP BY properties.pathname
ORDER BY avg_lcp DESC

-- CLS distribution
SELECT
  properties.metric_rating,
  count() as count
FROM events
WHERE event = 'web_vitals'
  AND properties.metric_name = 'CLS'
  AND timestamp > now() - INTERVAL 7 DAY
GROUP BY properties.metric_rating
```

## 2. API Performance Monitoring

### Implementation

API performance is tracked automatically using the `measureAPIPerformance` function or `withPerformanceTracking` middleware.

#### Option A: Manual tracking

```typescript
import { measureAPIPerformance } from "@/lib/performance-monitoring";

export async function GET(request: Request) {
  return measureAPIPerformance(
    "/api/links",
    "GET",
    async () => {
      // Your API logic here
      const links = await getLinks();
      return NextResponse.json(links);
    },
    userId
  );
}
```

#### Option B: Middleware wrapper

```typescript
import { withPerformanceTracking } from "@/lib/api-performance-middleware";

export const GET = withPerformanceTracking(
  async (request) => {
    const links = await getLinks();
    return NextResponse.json(links);
  },
  { route: "/api/links", trackSlowRequests: true }
);
```

### Thresholds

```typescript
const API_THRESHOLDS = {
  good: 200ms,
  slow: 1000ms,      // Warning threshold
  verySlow: 5000ms,  // Critical threshold
};
```

### Alerts

- Slow requests (>1s) are logged to console
- Very slow requests (>5s) are logged as warnings
- All requests are tracked in PostHog

### Viewing API Performance

```sql
-- Slowest API routes
SELECT
  properties.route,
  avg(properties.duration_ms) as avg_duration,
  percentile_75(properties.duration_ms) as p75,
  percentile_95(properties.duration_ms) as p95,
  count() as request_count
FROM events
WHERE event = 'api_performance'
  AND timestamp > now() - INTERVAL 24 HOUR
GROUP BY properties.route
ORDER BY avg_duration DESC
LIMIT 10

-- API error rate
SELECT
  properties.route,
  countIf(properties.status >= 500) / count() * 100 as error_rate
FROM events
WHERE event = 'api_performance'
  AND timestamp > now() - INTERVAL 24 HOUR
GROUP BY properties.route
HAVING error_rate > 1
ORDER BY error_rate DESC
```

## 3. Database Query Performance

### Implementation

Database query performance can be tracked using the `measureDBPerformance` wrapper:

```typescript
import { measureDBPerformance } from "@/lib/performance-monitoring";

export async function getLinks(userId: string) {
  return measureDBPerformance(
    "select",
    "links",
    async () => {
      return db.select().from(links).where(eq(links.userId, userId));
    },
    userId
  );
}
```

### Thresholds

```typescript
const DB_THRESHOLDS = {
  good: 50ms,
  slow: 100ms,       // Warning threshold
  verySlow: 1000ms,  // Critical threshold
};
```

### Alerts

- Slow queries (>100ms) are flagged in PostHog
- Very slow queries (>1s) are logged as warnings
- All query performance is tracked

### Viewing Database Performance

```sql
-- Slowest database operations
SELECT
  properties.operation,
  properties.table,
  avg(properties.duration_ms) as avg_duration,
  percentile_95(properties.duration_ms) as p95,
  count() as query_count
FROM events
WHERE event = 'db_performance'
  AND timestamp > now() - INTERVAL 24 HOUR
GROUP BY properties.operation, properties.table
ORDER BY avg_duration DESC
LIMIT 10

-- Slow queries over time
SELECT
  toStartOfHour(timestamp) as hour,
  countIf(properties.is_slow = true) as slow_queries,
  count() as total_queries
FROM events
WHERE event = 'db_performance'
  AND timestamp > now() - INTERVAL 7 DAY
GROUP BY hour
ORDER BY hour ASC
```

## 4. Performance Dashboards

### Creating a Performance Dashboard in PostHog

1. Go to **Dashboards** > **Create dashboard**
2. Name it "Performance Monitoring"
3. Add the following insights:

#### Core Web Vitals Overview
```
Event: web_vitals
Breakdown: metric_name
Aggregation: Average of metric_value
Visualization: Bar chart
```

#### LCP Trend Over Time
```
Event: web_vitals
Filter: metric_name = LCP
Visualization: Line chart
Breakdown: metric_rating
```

#### Slow API Requests
```
Event: api_performance
Filter: is_slow = true
Breakdown: route
Aggregation: Count
Visualization: Table
```

#### API Response Time Distribution
```
Event: api_performance
Property: duration_ms
Visualization: Histogram
Buckets: 0-100, 100-200, 200-500, 500-1000, 1000+
```

#### Database Query Performance
```
Event: db_performance
Breakdown: table
Aggregation: Average of duration_ms
Visualization: Bar chart
```

### API Endpoint for Metrics

Get aggregated performance metrics programmatically:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://yourdomain.com/api/performance/metrics
```

Response:
```json
{
  "timestamp": "2024-01-15T12:00:00Z",
  "web_vitals": {
    "fcp": { "avg": 1200, "p75": 1500, "p95": 2000 },
    "lcp": { "avg": 2000, "p75": 2500, "p95": 3500 }
  },
  "api_performance": {
    "avg_response_time": 150,
    "p75_response_time": 200,
    "p95_response_time": 500
  },
  "slowest_routes": [
    { "route": "/api/analytics", "avg_duration": 850, "count": 50 }
  ]
}
```

## 5. Performance Optimization Guidelines

### Core Web Vitals

**Improving LCP:**
- Optimize images (use Next.js Image component)
- Implement lazy loading for below-fold content
- Minimize render-blocking resources
- Use CDN for static assets

**Improving CLS:**
- Set explicit dimensions on images and embeds
- Avoid inserting content above existing content
- Use CSS transform animations instead of layout-triggering properties

**Improving FID/INP:**
- Break up long JavaScript tasks
- Use web workers for heavy computations
- Debounce input handlers
- Optimize event listeners

### API Performance

**Best Practices:**
- Implement caching (Redis/Valkey)
- Use database connection pooling
- Optimize database queries (add indexes)
- Implement request deduplication
- Use pagination for large datasets
- Enable compression (gzip/brotli)

### Database Performance

**Optimization Techniques:**
- Add indexes on frequently queried columns
- Use `EXPLAIN ANALYZE` to identify slow queries
- Implement query result caching
- Avoid N+1 query problems
- Use database connection pooling
- Consider read replicas for heavy read workloads

## 6. Alerts and Monitoring

### Setting Up Performance Alerts

Create alerts in PostHog for performance regressions:

1. **Slow Page Load Alert**
   - Metric: LCP > 4000ms
   - Threshold: Affects > 5% of users
   - Action: Send Slack notification

2. **API Performance Degradation**
   - Metric: Average API response time
   - Threshold: Increases by 50% week-over-week
   - Action: Send email alert

3. **Database Slow Query Alert**
   - Metric: Queries > 1000ms
   - Threshold: Count > 10 per hour
   - Action: Send Slack notification

### Performance Budget

Set performance budgets for your application:

```javascript
const PERFORMANCE_BUDGET = {
  // Core Web Vitals
  lcp: 2500,     // Largest Contentful Paint
  cls: 0.1,      // Cumulative Layout Shift
  fid: 100,      // First Input Delay

  // Page metrics
  pageSize: 500 * 1024,      // 500 KB
  imageSize: 100 * 1024,     // 100 KB per image
  scriptSize: 150 * 1024,    // 150 KB total JS

  // API metrics
  apiResponseTime: 200,      // 200ms average

  // Database metrics
  dbQueryTime: 50,           // 50ms average
};
```

## 7. Troubleshooting

### High LCP Values

1. Check largest element on page
2. Verify image optimization
3. Check for render-blocking resources
4. Review server response time (TTFB)

### High CLS Scores

1. Check for dynamic content insertion
2. Verify image/iframe dimensions
3. Review font loading strategy
4. Check for late-loaded ads or embeds

### Slow API Requests

1. Review database query performance
2. Check for N+1 queries
3. Verify caching is working
4. Review external API calls
5. Check server resources (CPU, memory)

### Slow Database Queries

1. Use `EXPLAIN ANALYZE` to understand query plan
2. Add missing indexes
3. Review table statistics
4. Check for table locks
5. Consider query optimization or denormalization

## Resources

- [Web Vitals](https://web.dev/vitals/)
- [PostHog Performance Monitoring](https://posthog.com/docs/product-analytics/performance)
- [Next.js Performance Optimization](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
