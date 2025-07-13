# PM2 Uptime Tracker v2.0.0

A fully customizable Node.js application that monitors PM2 processes (like Discord bots, web servers, etc.) and sends real-time status notifications to Discord via webhooks.

## ✨ Features

- **Fully Customizable** - Configure everything via JSON or environment variables
- **Real-time monitoring** - Detects status changes within seconds
- **Smart notifications** - Immediate alerts for restarts, crashes, and recoveries
- **Rich Discord embeds** - Color-coded status indicators with detailed information
- **Multiple process status tracking** - Online, offline, error, restarting states
- **Flexible notification options** - Choose what to monitor and when to notify
- **Comprehensive logging** - Colored, timestamped logs with different severity levels
- **Restart counting** - Track and display restart events
- **Error handling** - Graceful degradation and detailed error reporting
- **Setup Wizard** - Interactive configuration setup

## 🚀 Quick Start

1. **Install**
   ```bash
   npm install
   ```

2. **Setup Configuration**
   ```bash
   # Interactive setup wizard (recommended)
   npm run setup
   
   # Or manually create config.json
   cp config.example.json config.json
   # Edit config.json with your settings
   ```

3. **Run**
   ```bash
   npm start
   ```

## 📋 Prerequisites

- Node.js (v14 or higher)
- PM2 process manager
- A PM2 process to monitor (Discord bot, web server, API, etc.)
- Discord webhook URL

## ⚙️ Configuration

The tracker supports multiple configuration methods:

### Method 1: Interactive Setup (Recommended)
```bash
npm run setup
```

This will guide you through all configuration options and create either a `config.json` or `.env` file.

### Method 2: JSON Configuration
Create a `config.json` file in the project root:

```json
{
  "discord": {
    "webhookUrl": "https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN",
    "messageId": "YOUR_MESSAGE_ID"
  },
  "monitoring": {
    "processName": "your-process-name",
    "updateInterval": 60000,
    "enableQuickChecks": true
  },
  "notifications": {
    "statusChanges": {
      "enabled": true,
      "notifyOnOnline": true,
      "notifyOnOffline": true,
      "notifyOnError": true
    }
  }
}
```

### Method 3: Environment Variables
Create a `.env` file:

```env
WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
MESSAGE_ID=YOUR_MESSAGE_ID
PROCESS_NAME=your-process-name
```

For detailed configuration options, see [CONFIG.md](CONFIG.md).

## 🎯 Configuration Presets

### Silent Mode (Critical Only)
```json
{
  "notifications": {
    "criticalOnly": true,
    "regularUpdates": { "enabled": false }
  }
}
```

### High Frequency Monitoring
```json
{
  "monitoring": {
    "updateInterval": 30000,
    "quickCheckInterval": 2000
  }
}
```

### Minimal Embeds
```json
{
  "embeds": {
    "showLastRestart": false,
    "showRestartCount": false,
    "includeStatusChangeInfo": false
  }
}
```

## 📚 Documentation

- **[CONFIG.md](CONFIG.md)** - Complete configuration guide
- **[config.example.json](config.example.json)** - Example configuration file
- **[.env.example](.env.example)** - Example environment file

## 🛠️ Setup Guide

### 1. Create a Discord Webhook

1. Go to your Discord server
2. Navigate to Server Settings → Integrations → Webhooks
3. Click "New Webhook"
4. Choose the channel where you want notifications
5. Copy the webhook URL

### 2. Get Message ID

1. Send a test message using the webhook
2. Right-click on the message in Discord
3. Select "Copy Message ID" (Developer Mode must be enabled)
4. Use this ID in your configuration

### 3. Configure Process Monitoring

Set the process name to match the PM2 process you want to monitor.

You can find your PM2 process names by running:
```bash
pm2 list
```

### 4. Run the Application

```bash
npm start
```

Or use PM2 to run it as a background process:

```bash
pm2 start index.js --name "uptime-tracker"
```

## 🎨 Custom Embeds

You can customize the appearance of Discord notifications by editing `embeds.json`:

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
      }
    ]
  }
}
```

Available placeholders:
- `$processName` - Process name
- `$uptime` - Formatted uptime
- `$lastRestart` - Last restart time

## 📊 Monitoring Features

- **Real-time Status Changes** - Instant notifications when processes start, stop, or crash
- **Restart Detection** - Track and count process restarts
- **Error Monitoring** - Immediate alerts for process errors
- **Uptime Tracking** - Monitor how long processes have been running
- **Quick Health Checks** - Frequent status polling for rapid detection
- **Event Listeners** - Real-time PM2 event monitoring

## 🔧 Advanced Features

### Multiple Process Monitoring ⚠️ **Coming Soon**

> **Note:** This feature is configured but not yet implemented in the application logic. Currently, the tracker monitors a single process.

```json
{
  "advanced": {
    "processMultiple": true,
    "processNames": ["bot1", "bot2", "api-server"]
  }
}
```

### Webhook Fallback
```json
{
  "features": {
    "enableWebhookFallback": true,
    "webhookFallbackUrl": "https://discord.com/api/webhooks/backup/url"
  }
}
```

### Metrics & Health Check
```json
{
  "features": {
    "enableMetrics": true,
    "metricsPort": 3000,
    "enableHealthcheck": true,
    "healthcheckPort": 3001
  }
}
```

## 📝 Logging

The tracker includes comprehensive logging with:
- Colored output for better readability
- Timestamped entries
- Different log levels (error, warn, info, debug)
- Optional file logging
- Configurable log levels

## 🚀 PM2 Integration

Example of starting your application with PM2:

```bash
pm2 start bot.js --name "discord-bot"
pm2 start api.js --name "api-server"
```

Then monitor them with:
```json
{
  "monitoring": {
    "processName": "discord-bot"
  }
}
```

## 🔄 Project Structure

```
pm2-uptime-tracker/
├── src/
│   ├── config/
│   │   └── index.js          # Configuration loader
│   ├── services/
│   │   ├── pm2Service.js     # PM2 process monitoring
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

If you encounter any issues:

1. Check the [CONFIG.md](CONFIG.md) for detailed configuration options
2. Enable debug logging: `"logging": { "level": "debug" }`
3. Check the logs for error messages
4. Create an issue on GitHub

## 🔮 Roadmap

- [ ] Web dashboard for monitoring
- [ ] Email notifications
- [ ] Slack integration
- [ ] Process performance metrics
- [ ] Alert thresholds
- [ ] Historical uptime data
- [ ] Multi-server monitoring

---

**Author:** synz.xyz  
**Version:** 2.0.0
│   │   ├── discordService.js # Discord webhook service
│   │   └── uptimeService.js  # Uptime formatting utilities
│   ├── utils/
│   │   └── logger.js         # Logging utilities
│   └── app.js                # Main application logic
├── index.js                  # Entry point (backward compatibility)
├── package.json              # Project dependencies
├── .env                      # Environment variables (not tracked)
├── .gitignore                # Git ignore rules
├── embeds.json               # Discord embed templates
└── README.md                 # This file
```

## Dependencies

- `pm2`: Process manager integration
- `axios`: HTTP client for webhook requests
- `dotenv`: Environment variable management

## Development Status

**Current Version: 1.0.0-beta.1** 🚧

This project uses a structured release process for stability and thorough testing.

### Release Stages

- **Beta (1.0.0-beta.x)** - Feature testing and validation
- **Release Candidate (1.0.0-rc.x)** - Final testing before stable
- **Stable (1.0.0)** - Production-ready release

### Release Management

```bash
# View release guide
node release-guide.js

# Create new release
node release.js beta    # Next beta version
node release.js rc      # Release candidate
node release.js stable  # Stable release
```

### 🚧 Coming Soon Features

- **Multiple Process Monitoring** - Track multiple PM2 processes simultaneously
- **Advanced Alerting** - Complex notification rules and escalation paths
- **Historical Data** - Long-term uptime statistics and reporting
- **Web Dashboard** - Visual interface for monitoring and configuration

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the MIT License.

---

**Made by synz.xyz**
