# PM2 Uptime Tracker

A Node.js application that monitors PM2 processes and sends uptime notifications to Discord via webhooks.

## Features

- Monitor PM2 processes in real-time
- Send uptime notifications to Discord
- Customizable embed messages
- Environment-based configuration

## Prerequisites

- Node.js (v14 or higher)
- PM2 process manager
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
   ```

## Configuration

### Environment Variables

Create a `.env` file in the project root and configure the following variables:

- `WEBHOOK_URL`: Your Discord webhook URL
- `MESSAGE_ID`: The ID of the Discord message to update (optional)

### Example .env file:
```env
WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
MESSAGE_ID=1234567890123456789
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

Edit the `PROCESS_NAME` variable in `index.js` to match your PM2 process name:

```javascript
const PROCESS_NAME = 'your-process-name'; // Change this to your process name
```

### 4. Run the Application

```bash
node index.js
```

Or use PM2 to run it as a background process:

```bash
pm2 start index.js --name "uptime-tracker"
```

## Project Structure

```
pm2-uptime-tracker/
├── index.js          # Main application file
├── package.json      # Project dependencies
├── .env              # Environment variables (not tracked)
├── .gitignore        # Git ignore rules
└── README.md         # This file
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
