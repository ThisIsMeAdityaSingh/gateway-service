# Gateway Service

A robust Firebase Functions-based API gateway that serves as a secure proxy between Telegram webhooks and your main service. Built with TypeScript, featuring rate limiting, request verification, and automatic cleanup.

## 🚀 Features

- **Telegram Webhook Proxy**: Securely receives and forwards Telegram webhooks to your main service
- **Rate Limiting**: In-memory rate limiter with configurable settings (10 requests/minute per user by default)
- **Request Verification**: Validates incoming Telegram requests using secret tokens
- **Header Management**: Safely forwards HTTP headers while filtering hop-by-hop headers
- **Memory Management**: Automatic cleanup of old rate limit data to prevent memory leaks

## 🏗️ Architecture

```
Telegram Webhook → Gateway Service → Main Service Worker
                      ↓
               Rate Limiter
               Request Verifier
               Header Filtering
```

## 📋 Prerequisites

- Node.js 24+
- Firebase CLI
- A Firebase project
- Telegram bot token and webhook secret

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ThisIsMeAdityaSingh/gateway-service.git
   cd gateway-service
   ```

2. **Install dependencies**
   ```bash
   cd functions
   npm install
   ```

3. **Configure Firebase**
   ```bash
   firebase login
   firebase init functions
   ```

## ⚙️ Configuration

### Environment Variables

Set these secrets in your Firebase Functions configuration:

```bash
# Telegram webhook secret token
firebase functions:secrets:set TELEGRAM_SECRET

# Main service endpoint URL
firebase functions:secrets:set MAIN_SERVICE_ENDPOINT

# Main service host header
firebase functions:secrets:set MAIN_SERVICE_HOST
```

### Rate Limiter Settings

The default rate limiter allows 10 requests per minute per Telegram user. You can customize this in `functions/src/rate-limiter/limiter-settings.ts`:

```typescript
export const rateLimiterSettings = {
    timeWindow: 60 * 1000,      // 1 minute window
    tokens: 10,                 // Max tokens per window
    maxRefilTokens: 10,         // Tokens to refill
    costOfRequest: 1,           // Cost per request
    cleanUpWindow: 10 * 60 * 1000, // Cleanup every 10 minutes
    // ... other settings
};
```

## 🚀 Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase**
   ```bash
   npm run deploy
   ```

3. **Check logs**
   ```bash
   npm run logs
   ```

## 🧪 Development

### Local Development

1. **Start the emulator**
   ```bash
   npm run serve
   ```

2. **Run tests**
   ```bash
   npm test
   ```

3. **Lint code**
   ```bash
   npm run lint
   ```

### Project Structure

```
functions/
├── src/
│   ├── controller/
│   │   ├── index.ts              # Main Express app setup
│   │   └── telegram/
│   │       └── index.ts          # Telegram webhook handler
│   ├── middlewares/
│   │   └── verify-telegram-request.ts  # Request verification
│   ├── rate-limiter/
│   │   ├── index.ts              # Rate limiter implementation
│   │   └── limiter-settings.ts   # Rate limiter configuration
│   ├── utility/
│   │   ├── cleanup-service.ts    # Memory cleanup service
│   │   └── index.ts              # Utility functions
│   ├── tests/                    # Test files
│   └── index.ts                  # Firebase Functions entry point
├── package.json
├── tsconfig.json
└── jest.config.cjs
```

## 🔒 Security Features

- **Request Verification**: Validates Telegram webhook authenticity using secret tokens
- **Rate Limiting**: Prevents abuse with configurable per-user limits
- **Header Filtering**: Removes sensitive hop-by-hop headers before forwarding
- **Input Validation**: Validates Telegram user IDs and request structure

## 📊 Rate Limiting

The service implements a token bucket algorithm:
- Each Telegram user gets 10 tokens per minute
- Each request costs 1 token
- Tokens refill gradually over time
- Exceeded limits return HTTP 429 with `Retry-After` header

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Tests cover:
- Rate limiting functionality
- Request validation
- Error handling
- Token refill logic

## 📝 API Endpoints

### POST /telegram

Receives Telegram webhooks and proxies them to your main service.

**Headers:**
- `x-telegram-bot-api-secret-token`: Your Telegram webhook secret
- `Content-Type`: `application/json`

**Rate Limits:**
- 10 requests per minute per Telegram user

**Response:**
- `200`: Success (proxied response from main service)
- `401`: Unauthorized (invalid secret token)
- `429`: Too Many Requests (rate limit exceeded)
- `502`: Gateway Error (main service unavailable)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

**"Server misconfigured" error:**
- Ensure all required secrets are set in Firebase Functions configuration

**Rate limiting not working:**
- Check that Telegram requests include valid user IDs in `body.message.from.id`

**Deployment fails:**
- Run `npm run lint` and `npm run build` locally first
- Ensure Firebase project is properly configured

**Webhook not receiving requests:**
- Verify Telegram webhook URL points to your deployed function
- Check Firebase Functions logs for errors

## 🔧 Firebase Functions Configuration

The service is configured with:
- **Memory**: 128MB
- **Timeout**: 60 seconds
- **Max Instances**: 4
- **Runtime**: Node.js 24

These settings are optimized for cost-efficiency while handling Telegram webhook traffic.
