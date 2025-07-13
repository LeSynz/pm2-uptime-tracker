# PM2 Uptime Tracker - Configuration Guide

A fully customizable PM2 process monitoring tool that sends real-time status updates to Discord.

## Table of Contents

- [Quick Start](#quick-start)
- [Configuration Methods](#configuration-methods)
- [Configuration Options](#configuration-options)
- [Examples](#examples)
- [Advanced Features](#advanced-features)
- [Troubleshooting](#troubleshooting)

## Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd pm2-uptime-tracker
   npm install
   ```

2. **Basic Configuration**
   
   **Method 1: Using config.json (Recommended)**
   ```json
   {
     "discord": {
       "webhookUrl": "https://discord.com/api/webhooks/your-webhook-url",
       "messageId": "your-message-id"
     },
     "monitoring": {
       "processName": "your-process-name"
     }
   }
   ```

   **Method 2: Using .env file**
   ```env
   WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook-url
   MESSAGE_ID=your-message-id
   PROCESS_NAME=your-process-name
   ```

3. **Run**
   ```bash
   npm start
   ```

## Configuration Methods

The tracker supports multiple configuration methods with the following priority:

1. **Environment Variables** (Highest Priority)
2. **config.json** (Medium Priority)
3. **Default Values** (Lowest Priority)

### Method 1: config.json (Recommended)

Create a `config.json` file in the root directory:

```json
{
  "discord": {
    "webhookUrl": "https://discord.com/api/webhooks/your-webhook-url",
    "messageId": "your-message-id",
    "username": "PM2 Uptime Tracker",
    "avatarUrl": "https://your-avatar-url.png"
  },
  "monitoring": {
    "processName": "your-process-name",
    "updateInterval": 60000,
    "quickCheckInterval": 5000,
    "enableQuickChecks": true,
    "enableImmediateNotifications": true,
    "enableEventListeners": true
  }
}
```

### Method 2: Environment Variables

Copy `.env.example` to `.env` and configure:

```env
WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook-url
MESSAGE_ID=your-message-id
PROCESS_NAME=your-process-name
UPDATE_INTERVAL=60000
```

## Configuration Options

### Discord Settings

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `webhookUrl` | String | **Required** | Discord webhook URL |
| `messageId` | String | **Required** | Message ID to edit |
| `username` | String | `"PM2 Uptime Tracker"` | Webhook username |
| `avatarUrl` | String | `""` | Webhook avatar URL |

### Monitoring Settings

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `processName` | String | `"example-process"` | PM2 process name to monitor |
| `updateInterval` | Number | `60000` | Regular update interval (ms) |
| `quickCheckInterval` | Number | `5000` | Quick status check interval (ms) |
| `enableQuickChecks` | Boolean | `true` | Enable quick status checks |
| `enableImmediateNotifications` | Boolean | `true` | Send immediate notifications |
| `enableEventListeners` | Boolean | `true` | Enable PM2 event listeners |

### Notification Settings

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `statusChanges.enabled` | Boolean | `true` | Enable status change notifications |
| `statusChanges.notifyOnOnline` | Boolean | `true` | Notify when process goes online |
| `statusChanges.notifyOnOffline` | Boolean | `true` | Notify when process goes offline |
| `statusChanges.notifyOnError` | Boolean | `true` | Notify on errors |
| `statusChanges.notifyOnRestart` | Boolean | `true` | Notify on restarts |
| `statusChanges.notifyOnStop` | Boolean | `true` | Notify when process stops |
| `statusChanges.notifyOnStart` | Boolean | `true` | Notify when process starts |
| `statusChanges.notifyOnExit` | Boolean | `true` | Notify when process exits |
| `regularUpdates.enabled` | Boolean | `true` | Enable regular updates |
| `regularUpdates.onlyOnChanges` | Boolean | `false` | Only send updates when changes occur |
| `criticalOnly` | Boolean | `false` | Only send critical notifications |

### Embed Settings

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `useCustomEmbeds` | Boolean | `true` | Use custom embed templates |
| `embedsFile` | String | `"embeds.json"` | Path to embeds file |
| `showUptime` | Boolean | `true` | Show uptime in embeds |
| `showLastRestart` | Boolean | `true` | Show last restart time |
| `showRestartCount` | Boolean | `true` | Show restart count |
| `showProcessInfo` | Boolean | `false` | Show process details (PID, memory, CPU) |
| `showTimestamp` | Boolean | `true` | Show timestamp in embeds |
| `includeStatusChangeInfo` | Boolean | `true` | Include status change information |
| `includeImmediateNotificationFlag` | Boolean | `true` | Flag immediate notifications |
| `includeErrorDetails` | Boolean | `true` | Include error details |

### Logging Settings

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | Boolean | `true` | Enable logging |
| `level` | String | `"info"` | Log level: `"error"`, `"warn"`, `"info"`, `"debug"` |
| `showTimestamp` | Boolean | `true` | Show timestamp in logs |
| `showColors` | Boolean | `true` | Use colored output |
| `logToFile` | Boolean | `false` | Enable file logging |
| `logFile` | String | `"logs/uptime-tracker.log"` | Log file path |

### Advanced Settings

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `retryAttempts` | Number | `3` | Number of retry attempts |
| `retryDelay` | Number | `5000` | Delay between retries (ms) |
| `gracefulShutdown` | Boolean | `true` | Enable graceful shutdown |
| `processMultiple` | Boolean | `false` | Monitor multiple processes ⚠️ **Coming Soon** |
| `processNames` | Array | `[]` | Array of process names (when processMultiple is true) ⚠️ **Coming Soon** |
| `enableDataPersistence` | Boolean | `true` | Enable data persistence |
| `dataFile` | String | `"data.json"` | Data file path |

### Feature Flags

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableWebhookFallback` | Boolean | `false` | Enable webhook fallback |
| `webhookFallbackUrl` | String | `""` | Fallback webhook URL |
| `enableMetrics` | Boolean | `false` | Enable metrics endpoint |
| `metricsPort` | Number | `3000` | Metrics server port |
| `enableHealthcheck` | Boolean | `false` | Enable health check endpoint |
| `healthcheckPort` | Number | `3001` | Health check server port |

## Examples

### Basic Configuration

```json
{
  "discord": {
    "webhookUrl": "https://discord.com/api/webhooks/123456789/abcdef",
    "messageId": "987654321"
  },
  "monitoring": {
    "processName": "my-app"
  }
}
```

### Silent Mode (Critical Only)

```json
{
  "discord": {
    "webhookUrl": "https://discord.com/api/webhooks/123456789/abcdef",
    "messageId": "987654321"
  },
  "monitoring": {
    "processName": "my-app"
  },
  "notifications": {
    "criticalOnly": true,
    "regularUpdates": {
      "enabled": false
    }
  }
}
```

### High Frequency Monitoring

```json
{
  "discord": {
    "webhookUrl": "https://discord.com/api/webhooks/123456789/abcdef",
    "messageId": "987654321"
  },
  "monitoring": {
    "processName": "my-app",
    "updateInterval": 30000,
    "quickCheckInterval": 2000
  }
}
```

### Custom Embeds with Minimal Info

```json
{
  "discord": {
    "webhookUrl": "https://discord.com/api/webhooks/123456789/abcdef",
    "messageId": "987654321"
  },
  "monitoring": {
    "processName": "my-app"
  },
  "embeds": {
    "showUptime": true,
    "showLastRestart": false,
    "showRestartCount": false,
    "showProcessInfo": false,
    "includeStatusChangeInfo": false,
    "includeImmediateNotificationFlag": false
  }
}
```

### Multiple Process Monitoring ⚠️ **Coming Soon**

> **Note:** This feature is configured but not yet implemented in the application logic. Currently, the tracker monitors a single process specified in `monitoring.processName`.

```json
{
  "discord": {
    "webhookUrl": "https://discord.com/api/webhooks/123456789/abcdef",
    "messageId": "987654321"
  },
  "monitoring": {
    "processName": "primary-app"
  },
  "advanced": {
    "processMultiple": true,
    "processNames": ["app1", "app2", "app3"]
  }
}
```

### Development Mode with File Logging

```json
{
  "discord": {
    "webhookUrl": "https://discord.com/api/webhooks/123456789/abcdef",
    "messageId": "987654321"
  },
  "monitoring": {
    "processName": "dev-app",
    "updateInterval": 10000,
    "quickCheckInterval": 1000
  },
  "logging": {
    "level": "debug",
    "logToFile": true,
    "logFile": "logs/dev-tracker.log"
  }
}
```

## Custom Embeds

You can customize the Discord embed appearance by editing `embeds.json`:

```json
{
  "online": {
    "title": "🟢 $processName - Online",
    "description": "Your process is running smoothly!",
    "color": 65280,
    "fields": [
      {
        "name": "⏱️ Uptime",
        "value": "$uptime",
        "inline": true
      },
      {
        "name": "🔄 Last Restart",
        "value": "$lastRestart",
        "inline": true
      }
    ]
  },
  "offline": {
    "title": "🔴 $processName - Offline",
    "description": "⚠️ Your process is not running!",
    "color": 16711680
  },
  "error": {
    "title": "💥 $processName - Error",
    "description": "Your process has encountered an error!",
    "color": 16711680
  }
}
```

### Available Placeholders

- `$processName` - Process name
- `$uptime` - Formatted uptime
- `$lastRestart` - Last restart time

## Advanced Features

### Webhook Fallback

Enable a fallback webhook in case the primary one fails:

```json
{
  "features": {
    "enableWebhookFallback": true,
    "webhookFallbackUrl": "https://discord.com/api/webhooks/backup/url"
  }
}
```

### Metrics Endpoint

Enable a metrics endpoint for monitoring:

```json
{
  "features": {
    "enableMetrics": true,
    "metricsPort": 3000
  }
}
```

Access metrics at `http://localhost:3000/metrics`

### Health Check

Enable a health check endpoint:

```json
{
  "features": {
    "enableHealthcheck": true,
    "healthcheckPort": 3001
  }
}
```

Access health check at `http://localhost:3001/health`

## Troubleshooting

### Common Issues

1. **"WEBHOOK_URL is not set"**
   - Make sure you've set the webhook URL in your config.json or .env file

2. **"MESSAGE_ID is not set"**
   - Create a message using your webhook first, then copy the message ID

3. **"Process not found"**
   - Verify the process name matches exactly what's shown in `pm2 list`

4. **"Embeds file not found"**
   - Make sure embeds.json exists or set `useCustomEmbeds: false`

### Debug Mode

Enable debug logging to troubleshoot issues:

```json
{
  "logging": {
    "level": "debug",
    "logToFile": true
  }
}
```

### Validation

The tracker will validate your configuration on startup and show helpful error messages.

## Environment Variables Reference

For a complete list of environment variables, see `.env.example` file.

## Migration from v1.x

If you're upgrading from an older version that only used environment variables, your existing `.env` file will continue to work. The new configuration system is fully backward compatible.

## Contributing

Feel free to submit issues and enhancement requests!
