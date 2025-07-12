# PM2 Uptime Tracker

A Node.js application that monitors other PM2 processes (like Discord bots, web servers, etc.) and sends uptime notifications to Discord via webhooks.

## Features

- Monitor any PM2 process in real-time (Discord bots, web apps, APIs, etc.)
- Send status updates to Discord with rich embeds
- Different embed colors based on process status (online, offline, error, restarting)
- Customizable embed messages
- Environment-based configuration

## Prerequisites

- Node.js (v14 or higher)
- PM2 process manager
- A PM2 process to monitor (Discord bot, web server, API, etc.)
- Discord webhook URL

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the project root with your configuration:
   ```env
   WEBHOOK_URL=
   MESSAGE_ID=
   PROCESS_NAME=
   UPDATE_INTERVAL=60000
   ```

## Configuration

### Environment Variables

Create a `.env` file in the project root and configure the following variables:

- `WEBHOOK_URL`: Your Discord webhook URL
- `MESSAGE_ID`: The ID of the Discord message to update (optional)
- `PROCESS_NAME`: The name of the PM2 process to monitor (e.g., 'discord-bot', 'web-server')
- `UPDATE_INTERVAL`: Update interval in milliseconds (default: 60000 = 1 minute)

### Example .env file:
```env
WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
MESSAGE_ID=1234567890123456789
PROCESS_NAME=discord-bot
UPDATE_INTERVAL=60000
```

## Setup Guide

### 1. Create a Discord Webhook

1. Go to your Discord server
2. Navigate to Server Settings → Integrations → Webhooks
3. Click "New Webhook"
4. Choose the channel where you want notifications
5. Copy the webhook URL
6. Paste it into your `.env` file as `WEBHOOK_URL`

### 2. Get Message ID (Optional)

If you want to update a specific message instead of sending new ones:

1. Send a test message using the webhook
2. Right-click on the message in Discord
3. Select "Copy Message ID" (Developer Mode must be enabled)
4. Paste the ID into your `.env` file as `MESSAGE_ID`

### 3. Configure Process Monitoring

Set the `PROCESS_NAME` environment variable in your `.env` file to match the PM2 process you want to monitor:

```env
PROCESS_NAME=discord-bot
```

You can find your PM2 process names by running:
```bash
pm2 list
```

**Example:** If you have a Discord bot running with PM2, you might see something like:
```
┌─────┬────────────────┬─────────────┬─────────┬─────────┬──────────┐
│ id  │ name           │ namespace   │ version │ mode    │ pid      │
├─────┼────────────────┼─────────────┼─────────┼─────────┼──────────┤
│ 0   │ discord-bot    │ default     │ 1.0.0   │ fork    │ 12345    │
└─────┴────────────────┴─────────────┴─────────┴─────────┴──────────┘
```

In this case, you'd use `PROCESS_NAME=discord-bot`

### 4. Run the Application

```bash
node index.js
```

Or use PM2 to run it as a background process:

```bash
pm2 start index.js --name "uptime-tracker"
```

## PM2 Start Command Example

Start your application (Discord bot, web server, etc.) with PM2:

```bash
pm2 start bot.js --name "discord-bot"
```

Then use the same process name in your `.env` file:
```env
PROCESS_NAME=discord-bot
```

This uptime tracker will then monitor your Discord bot and send status updates to your Discord channel.

## Project Structure

```
pm2-uptime-tracker/
├── src/
│   ├── config/
│   │   └── index.js          # Configuration and environment variables
│   ├── services/
│   │   ├── pm2Service.js     # PM2 process monitoring service
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

This project is currently in development. The uptime tracking functionality is being implemented.

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the MIT License.

---

**Made by synz.xyz**
