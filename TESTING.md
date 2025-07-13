# PM2 Uptime Tracker - Testing Guide

This guide will help you test all features of your PM2 Uptime Tracker to ensure everything works correctly.

## 🧪 Testing Overview

The tracker includes several types of tests:
1. **Configuration System Tests** - Verify config loading and validation
2. **Component Tests** - Test individual services and utilities
3. **Integration Tests** - Test the complete monitoring workflow
4. **Manual Tests** - Interactive testing with real PM2 processes

## 🚀 Quick Test Commands

```bash
# Run all configuration tests
npm run test

# Run the interactive setup wizard
npm run setup

# Test with debug logging
npm run test:debug

# Run integration tests
npm run test:integration

# Test specific components
npm run test:config
npm run test:embeds
npm run test:discord
```

## 📋 Test Checklist

### ✅ Configuration System Tests

Run these tests to verify your configuration system:

```bash
# Test configuration loading
npm run test:config

# Test setup wizard
npm run setup

# Test configuration validation
npm run test:validate
```

**What it tests:**
- ✅ JSON configuration loading
- ✅ Environment variable loading
- ✅ Configuration merging and priority
- ✅ Validation functions
- ✅ Default value handling

### ✅ Component Tests

Test individual components:

```bash
# Test embed generation
npm run test:embeds

# Test Discord service
npm run test:discord

# Test PM2 service
npm run test:pm2

# Test logger
npm run test:logger
```

### ✅ Integration Tests

Test the complete workflow:

```bash
# Test with a mock PM2 process
npm run test:integration

# Test with real PM2 process (requires setup)
npm run test:live
```

## 🔧 Manual Testing Steps

### 1. Configuration Testing

**Test Different Configuration Methods:**

```bash
# Method 1: Test JSON configuration
echo '{"discord":{"webhookUrl":"test","messageId":"test"},"monitoring":{"processName":"test"}}' > config.json
npm run test:config

# Method 2: Test environment variables
echo "WEBHOOK_URL=test" > .env
echo "MESSAGE_ID=test" >> .env
echo "PROCESS_NAME=test" >> .env
npm run test:config

# Method 3: Test setup wizard
npm run setup
```

### 2. Embed Testing

**Test Custom Embeds:**

```bash
# Test default embeds
npm run test:embeds

# Test custom embeds
cp embeds.json embeds.backup.json
# Edit embeds.json with custom content
npm run test:embeds
mv embeds.backup.json embeds.json
```

### 3. Discord Integration Testing

**Test Discord Webhook (Safe Mode):**

```bash
# Test Discord service without sending messages
npm run test:discord:dry

# Test with real webhook (requires valid webhook URL)
npm run test:discord:live
```

### 4. PM2 Process Testing

**Test with Mock PM2 Process:**

```bash
# Create a simple test script
echo "setInterval(() => console.log('Test process running'), 1000);" > test-process.js

# Start it with PM2
pm2 start test-process.js --name "test-process"

# Test monitoring
PROCESS_NAME=test-process npm run test:live

# Cleanup
pm2 delete test-process
rm test-process.js
```

## 🛠️ Advanced Testing Scenarios

### Testing Multiple Processes

```bash
# Start multiple test processes
pm2 start test-process.js --name "test-app-1"
pm2 start test-process.js --name "test-app-2"
pm2 start test-process.js --name "test-app-3"

# Test multiple process monitoring
npm run test:multiple

# Cleanup
pm2 delete all
```

### Testing Failure Scenarios

```bash
# Test process crash detection
pm2 start test-process.js --name "crash-test"
pm2 stop crash-test
# Monitor should detect the stop

# Test process restart detection
pm2 restart crash-test
# Monitor should detect the restart

# Test process error handling
pm2 delete crash-test
# Monitor should handle process not found
```

### Testing Configuration Changes

```bash
# Test hot configuration reload
npm run test:config:hot

# Test invalid configuration handling
npm run test:config:invalid

# Test configuration migration
npm run test:config:migrate
```

## 📊 Performance Testing

### Load Testing

```bash
# Test with high frequency updates
npm run test:performance:high-freq

# Test with multiple processes
npm run test:performance:multiple

# Test memory usage
npm run test:performance:memory
```

### Stress Testing

```bash
# Test rapid status changes
npm run test:stress:status-changes

# Test network failures
npm run test:stress:network

# Test PM2 connection issues
npm run test:stress:pm2-connection
```

## 🔍 Debug Testing

### Enable Debug Mode

```bash
# Run with debug logging
DEBUG=* npm start

# Run with specific debug categories
DEBUG=config,discord,pm2 npm start

# Test with debug configuration
npm run test:debug
```

### Test Logging

```bash
# Test different log levels
LOG_LEVEL=debug npm run test
LOG_LEVEL=info npm run test
LOG_LEVEL=warn npm run test
LOG_LEVEL=error npm run test

# Test file logging
LOG_TO_FILE=true npm run test
cat logs/uptime-tracker.log
```

## 🎯 Real-World Testing

### Production-Like Testing

1. **Set up a real Discord webhook:**
   ```bash
   npm run setup
   # Follow the wizard to configure your webhook
   ```

2. **Create a test bot/process:**
   ```bash
   # Create a simple test process
   echo "console.log('Test bot started'); setInterval(() => {}, 1000);" > test-bot.js
   pm2 start test-bot.js --name "test-bot"
   ```

3. **Configure monitoring:**
   ```json
   {
     "discord": {
       "webhookUrl": "your-real-webhook-url",
       "messageId": "your-message-id"
     },
     "monitoring": {
       "processName": "test-bot",
       "updateInterval": 10000,
       "quickCheckInterval": 2000
     }
   }
   ```

4. **Start monitoring:**
   ```bash
   npm start
   ```

5. **Test scenarios:**
   ```bash
   # Test restart detection
   pm2 restart test-bot
   
   # Test stop detection
   pm2 stop test-bot
   
   # Test start detection
   pm2 start test-bot
   
   # Test error handling
   pm2 delete test-bot
   ```

## 📈 Monitoring the Tests

### Test Results

Check test results in:
- Console output
- Log files (if file logging enabled)
- Discord channel (for integration tests)
- Metrics endpoint (if enabled)

### Expected Behaviors

**Configuration Tests:**
- ✅ All configuration methods load correctly
- ✅ Validation catches invalid configurations
- ✅ Default values are applied when needed

**Discord Tests:**
- ✅ Embeds are generated correctly
- ✅ Webhooks receive messages
- ✅ Message updates work properly

**PM2 Tests:**
- ✅ Process status is detected correctly
- ✅ Status changes trigger notifications
- ✅ Restart counting works

**Integration Tests:**
- ✅ Complete workflow from PM2 to Discord
- ✅ Error handling and recovery
- ✅ Performance under load

## 🔧 Troubleshooting Tests

### Common Test Issues

1. **"Cannot connect to PM2"**
   - Ensure PM2 is running: `pm2 status`
   - Check PM2 permissions

2. **"Discord webhook failed"**
   - Verify webhook URL is correct
   - Check Discord server permissions
   - Test webhook independently

3. **"Configuration not loading"**
   - Check file permissions
   - Verify JSON syntax
   - Check environment variables

### Debug Steps

1. **Enable verbose logging:**
   ```bash
   LOG_LEVEL=debug npm run test
   ```

2. **Test components individually:**
   ```bash
   npm run test:config
   npm run test:embeds
   npm run test:discord
   ```

3. **Check system requirements:**
   ```bash
   node --version  # Should be v14+
   pm2 --version   # Should be installed
   npm list        # Check dependencies
   ```

## 📝 Test Reports

### Generate Test Reports

```bash
# Generate comprehensive test report
npm run test:report

# Generate performance report
npm run test:performance:report

# Generate configuration analysis
npm run test:config:analyze
```

### Test Coverage

```bash
# Check test coverage
npm run test:coverage

# View detailed coverage report
npm run test:coverage:html
```

## 🎉 Validation Checklist

Before deploying, ensure all tests pass:

- [ ] Configuration system tests pass
- [ ] All components work independently
- [ ] Discord integration works
- [ ] PM2 monitoring works
- [ ] Error handling works correctly
- [ ] Performance is acceptable
- [ ] Real-world scenarios work
- [ ] Documentation is accurate

## 🚀 Next Steps

Once testing is complete:

1. **Deploy to production** with confidence
2. **Monitor** the monitoring system itself
3. **Set up alerts** for the monitoring system
4. **Document** any custom configurations
5. **Share** your setup with the team

Remember: The monitoring system is only as good as its configuration and testing!
