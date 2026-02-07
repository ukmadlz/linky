# PostHog Error Alerts and Notifications Setup Guide

This guide explains how to configure error alerts and notifications in PostHog for the Linky application.

## Prerequisites

- PostHog instance running (self-hosted or cloud)
- Linky application deployed with webhook endpoints
- Optional: Slack webhook URL or email service configured

## Environment Variables

Add these to your `.env` file:

```env
# PostHog API Configuration
POSTHOG_PROJECT_ID=your_project_id
POSTHOG_PERSONAL_API_KEY=phx_your_personal_api_key
POSTHOG_WEBHOOK_SECRET=your_webhook_secret  # Optional but recommended

# Notification Channels
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
EMAIL_ALERTS_ENABLED=true
ALERT_EMAIL_FROM=alerts@yourdomain.com
ALERT_EMAIL_TO=admin@yourdomain.com
```

## 1. Configure PostHog Webhooks

### Step 1: Create Webhook Endpoint

The webhook endpoint is already implemented at `/api/webhooks/posthog`.

**Webhook URL:** `https://yourdomain.com/api/webhooks/posthog`

### Step 2: Configure Webhook in PostHog Dashboard

1. Navigate to **Project Settings** > **Webhooks**
2. Click **Create Webhook**
3. Configure webhook:
   - **Name:** Linky Error Alerts
   - **Webhook URL:** `https://yourdomain.com/api/webhooks/posthog`
   - **Event types:** Select events to monitor
   - **Secret (optional):** Set `POSTHOG_WEBHOOK_SECRET` value

## 2. Set Up Error Spike Alerts

### Option A: Using PostHog Insights

1. Go to **Insights** > **Create new insight**
2. Configure the insight:
   - **Event:** `$exception`
   - **Visualization:** Time series or Number
   - **Date range:** Last 24 hours or custom
3. Click **Save & add alert**
4. Configure alert:
   - **Alert name:** Error Spike Alert
   - **Condition:** When count exceeds X in Y minutes
   - **Threshold:** 50 errors in 5 minutes (adjust as needed)
   - **Recipients:** Webhook URL

### Option B: Using Actions

1. Go to **Actions** > **Create action**
2. Configure action:
   - **Name:** High Error Rate
   - **Match events:** `$exception`
   - **Filters:** Add any additional filters (error_type, route, etc.)
3. Create an alert for this action with desired thresholds

## 3. Monitor Error Types

### Create Dashboard for Error Monitoring

1. Go to **Dashboards** > **Create dashboard**
2. Name it "Error Monitoring"
3. Add the following insights:

#### Total Errors Over Time
- **Event:** `$exception`
- **Visualization:** Time series
- **Breakdown:** By `error_type`

#### Errors by Route
- **Event:** `$exception`
- **Visualization:** Bar chart
- **Breakdown:** By `route`

#### Top Error Messages
- **Event:** `$exception`
- **Visualization:** Table
- **Breakdown:** By `error_message`
- **Limit:** Top 10

#### User Impact
- **Event:** `$exception`
- **Visualization:** Unique users
- **Formula:** `uniq(user_id)`

#### Error Rate Trend
- **Event:** `$exception`
- **Visualization:** Line chart
- **Aggregation:** Count per hour/day

## 4. Configure Slack Notifications

### Setup Slack Webhook

1. Go to your Slack workspace
2. Navigate to **Apps** > **Incoming Webhooks**
3. Click **Add to Slack**
4. Choose a channel for notifications (e.g., `#alerts` or `#errors`)
5. Copy the webhook URL
6. Add to `.env` as `SLACK_WEBHOOK_URL`

### Test Slack Integration

Run this in your application:

```typescript
import { sendCriticalErrorAlert } from "@/lib/notifications";

await sendCriticalErrorAlert("Test error", {
  error_type: "test",
  route: "/test",
});
```

## 5. Set Up Email Alerts (Optional)

Configure your email service (SendGrid, AWS SES, etc.) and update the `sendEmailNotification` function in `/lib/notifications.ts` with your email provider's API.

## 6. Error Alert Types

The application sends three types of error alerts:

### Critical Error Alert
Triggered when a critical error occurs on the server.
```typescript
sendCriticalErrorAlert(error, context)
```

### Error Spike Alert
Triggered when error count exceeds threshold.
```typescript
sendErrorSpikeAlert(errorCount, threshold)
```

### New Error Type Alert
Triggered when a new type of error is detected.
```typescript
sendNewErrorAlert(errorType, errorMessage)
```

## 7. Automated Error Monitoring

To enable automated error monitoring, set up a cron job or scheduled task:

### Using Vercel Cron (if deployed on Vercel)

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/monitor-errors",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Create `/app/api/cron/monitor-errors/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { monitorErrorRate } from "@/lib/error-monitoring";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await monitorErrorRate({
    timeWindowMinutes: 5,
    threshold: 50,
  });

  return NextResponse.json({ success: true });
}
```

## 8. Best Practices

1. **Set appropriate thresholds** - Start conservative and adjust based on your traffic
2. **Use different severity levels** - Info, Warning, Error, Critical
3. **Avoid alert fatigue** - Don't alert on every single error, focus on critical issues
4. **Include context** - Always include user_id, route, error_type in alerts
5. **Create runbooks** - Document common errors and their solutions
6. **Regular review** - Review error dashboards weekly to identify trends
7. **Test alerts** - Regularly test your alert channels to ensure they work

## 9. Troubleshooting

### Webhooks not triggering
- Verify webhook URL is accessible from PostHog
- Check `POSTHOG_WEBHOOK_SECRET` matches in both places
- Review PostHog webhook logs for errors

### Slack notifications not sending
- Verify `SLACK_WEBHOOK_URL` is correct
- Test webhook URL with curl:
  ```bash
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"Test message"}' \
    YOUR_WEBHOOK_URL
  ```

### No alerts received
- Check error threshold settings
- Verify errors are being tracked in PostHog
- Review webhook endpoint logs

## 10. PostHog Query Examples

### Get error count for last hour
```sql
SELECT count()
FROM events
WHERE event = '$exception'
  AND timestamp > now() - INTERVAL 1 HOUR
```

### Get top errors by frequency
```sql
SELECT
  properties.error_message,
  properties.error_type,
  count() as count
FROM events
WHERE event = '$exception'
  AND timestamp > now() - INTERVAL 24 HOUR
GROUP BY properties.error_message, properties.error_type
ORDER BY count DESC
LIMIT 10
```

### Get affected users
```sql
SELECT count(DISTINCT distinct_id)
FROM events
WHERE event = '$exception'
  AND timestamp > now() - INTERVAL 24 HOUR
```

## Resources

- [PostHog Webhooks Documentation](https://posthog.com/docs/webhooks)
- [PostHog Insights Documentation](https://posthog.com/docs/product-analytics/insights)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
