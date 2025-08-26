# DataFast Analytics MCP Server

A Model Context Protocol (MCP) server for interacting with DataFast analytics API, deployed on Cloudflare Workers. This server provides tools to track payments, create custom goals, and retrieve visitor data from your DataFast account.

[![Deploy to Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/ai/tree/main/demos/remote-mcp-authless)

## Overview

The DataFast MCP Server bridges the gap between your development workflow and DataFast's powerful analytics platform. Whether you're building with Claude Code, Cursor IDE, or any MCP-compatible client, this server provides:

- **🤖 AI-Powered Implementation**: Generate production-ready tracking code for any framework
- **📊 Real-Time Analytics**: Track payments, goals, and visitor behavior instantly
- **🔧 Complete Integration**: From configuration to debugging in one tool
- **⚡ Serverless Architecture**: Deploy globally with zero maintenance

## Requirements

- Node.js 18+
- A DataFast account with API access
- MCP-compatible client (Claude Code, Cursor IDE, etc.)

## Features

- **Track Payments**: Record payment transactions with detailed metadata
- **Create Goals**: Set up custom conversion goals for visitor tracking
- **Get Visitor Data**: Retrieve comprehensive visitor analytics including identity, activity, and conversion predictions
- **Secure Authentication**: API key-based authentication via query parameters
- **Real-time Data**: Access to live visitor behavior and prediction data

## DataFast API Integration

This MCP server integrates with the following DataFast API endpoints:

- `POST /api/v1/payments` - Track payments and revenue attribution
- `POST /api/v1/goals` - Create custom goals for conversion tracking
- `GET /api/v1/visitors/{id}` - Retrieve detailed visitor analytics

## Authentication

The server requires a DataFast API key passed as a query parameter in the MCP server URL:

```
https://your-server.workers.dev/sse?api_key=your_datafast_api_key
```

The API key is securely extracted in the server and used for all DataFast API calls.

## Get started

### Deploy to Cloudflare Workers

[![Deploy to Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/ai/tree/main/demos/remote-mcp-authless)

### Local Development

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Start development server:

```bash
npm run dev
```

Your server will be available at: `http://localhost:8787`

## Usage

### Server Endpoints

The MCP server exposes two endpoints:

- **`/sse?api_key=YOUR_API_KEY`** - Server-Sent Events endpoint for MCP connections
- **`/mcp?api_key=YOUR_API_KEY`** - Direct MCP protocol endpoint

### Connect to Claude Desktop

To connect to your remote MCP server from Claude Desktop:

1. **Install mcp-remote** (if not already installed):

   ```bash
   npm install -g mcp-remote
   ```

2. **Follow [Anthropic's Quickstart](https://modelcontextprotocol.io/quickstart/user)** to enable developer mode

3. **Go to Settings > Developer > Edit Config** and add this configuration:

   **For Local Development:**

   ```json
   {
     "mcpServers": {
       "datafast": {
         "command": "npx",
         "args": [
           "mcp-remote",
           "http://localhost:8787/sse?api_key=YOUR_API_KEY"
         ]
       }
     }
   }
   ```

   **For Production:**

   ```json
   {
     "mcpServers": {
       "datafast": {
         "command": "npx",
         "args": [
           "mcp-remote",
           "https://datafast-mcp-server.your-account.workers.dev/sse?api_key=YOUR_API_KEY"
         ]
       }
     }
   }
   ```

4. **Restart Claude Desktop** and check that the tools are available

   **Example config file** (save as `claude_config.json`):

   ```json
   {
     "mcpServers": {
       "datafast": {
         "command": "npx",
         "args": [
           "mcp-remote",
           "http://localhost:8787/sse?api_key=df_1234567890abcdef"
         ]
       }
     }
   }
   ```

### Connect to Cloudflare AI Playground

1. Go to https://playground.ai.cloudflare.com/
2. Enter your MCP server URL with API key:
   ```
   https://datafast-mcp-server.your-account.workers.dev/sse?api_key=YOUR_API_KEY
   ```
3. You can now use the DataFast tools directly from the playground!

### Connect to Claude Code

Claude Code is Anthropic's CLI tool that supports MCP servers. To use your DataFast MCP server:

1. **Install Claude Code** (if not already installed):

   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

2. **Configure the MCP server** by creating a config file at `~/Library/Application Support/ClaudeCode/claude_code_config.json`:

   ```json
   {
     "mcpServers": {
       "datafast": {
         "command": "npx",
         "args": [
           "mcp-remote",
           "http://localhost:8787/sse?api_key=YOUR_API_KEY"
         ]
       }
     }
   }
   ```

3. **Start Claude Code**:

   ```bash
   claude
   ```

4. **Use DataFast tools** in your Claude Code session:
   - Ask Claude to analyze visitor data: "Show me the analytics for visitor abc-123"
   - Generate tracking code: "Generate React tracking code for my payment flow"
   - Create webhook handlers: "Generate a Stripe webhook handler for payments"
   - Debug implementation: "Generate debugging tools for my server-side tracking"
   - Set up configuration: "Generate a production config for my Next.js app"

### Connect to Cursor IDE

Cursor supports MCP servers through the MCP protocol. To integrate your DataFast MCP server:

1. **Install the MCP SDK** (if using a custom MCP client):

   ```bash
   npm install @modelcontextprotocol/sdk
   ```

2. **Create a Cursor MCP configuration** in your project or global settings:

   **Option A: Direct connection (if Cursor supports it)**

   - Check Cursor's MCP settings for direct URL input
   - Use: `http://localhost:8787/sse?api_key=YOUR_API_KEY`

   **Option B: Use mcp-remote proxy**

   - Configure Cursor to use mcp-remote as an external tool
   - Point it to your MCP server URL

3. **Access DataFast tools** within Cursor:

   - Generate implementation code: "Generate Vue.js tracking code for user onboarding"
   - Create webhook handlers: "Create a LemonSqueezy webhook for subscription tracking"
   - Debug issues: "Generate server debugging tools to troubleshoot payment tracking"
   - Set up configuration: "Generate a server config template for production"

4. **Integration examples**:
   - **Payment Flow**: Track payments when users complete purchases in your app
   - **User Onboarding**: Create goals when users complete registration steps
   - **Subscription Management**: Handle webhooks for recurring payments
   - **Analytics Dashboard**: Build visitor analytics into your admin panel
   - **A/B Testing**: Track conversion goals for different feature variations

### Test Your Connection

To verify your MCP server is working:

1. **Test the endpoint directly:**

   ```bash
   curl "http://localhost:8787/sse?api_key=YOUR_API_KEY"
   ```

   You should see a Server-Sent Events stream start.

2. **Check Claude Desktop:**
   - Go to any conversation
   - Type `/datafast` or ask about DataFast tools
   - You should see the available tools listed

### Troubleshooting Connection Issues

**"Server not responding"**

- Check that your server is running (`npm run dev`)
- Verify the URL is correct: `http://localhost:8787/sse?api_key=...`
- Make sure your API key is valid

**"Unauthorized" error**

- Double-check your DataFast API key
- Ensure it's passed as `api_key=` parameter in the URL
- Verify the API key has the correct permissions

**"Tools not showing in Claude"**

- Restart Claude Desktop after config changes
- Check that mcp-remote is installed: `npx mcp-remote --version`
- Verify the JSON configuration is valid (no trailing commas)

**"Network errors"**

- For local development, ensure no firewall is blocking port 8787
- For production, verify your Workers domain is accessible

## Example Usage

Once connected, you can ask Claude to use the DataFast tools. Here are some example prompts:

### Track a Payment

```
I just received a $29.99 payment from customer john@example.com with transaction ID "tx_123456".
Please track this payment for visitor ID "a3ab2331-989f-4cfa-91c6-2461c9e3c6bd".
```

### Create a Custom Goal

```
Track that visitor "a3ab2331-989f-4cfa-91c6-2461c9e3c6bd" completed the "newsletter_signup" goal.
```

### Get Visitor Analytics

```
Show me the analytics data for visitor "a3ab2331-989f-4cfa-91c6-2461c9e3c6bd".
```

### Analyze Traffic Source

```
What's the traffic source and conversion prediction for visitor "a3ab2331-989f-4cfa-91c6-2461c9e3c6bd"?
```

## Available Tools

### Core API Tools

#### 1. create_payment

Track a payment transaction and attribute revenue to traffic sources.

**Parameters:**

- `amount` (number): Payment amount (e.g., 29.99 for $29.99, 0 for free trials)
- `currency` (string): Currency code like "USD", "EUR", "GBP"
- `transaction_id` (string): Unique transaction ID from your payment provider
- `datafast_visitor_id` (string): DataFast visitor ID from browser cookies
- `email` (string, optional): Customer email
- `name` (string, optional): Customer name
- `customer_id` (string, optional): Customer ID from payment provider
- `renewal` (boolean, optional): Set to true for recurring payments
- `refunded` (boolean, optional): Set to true for refunded payments
- `timestamp` (string, optional): Payment timestamp

#### 2. create_goal

Create a custom goal for a specific visitor.

**Parameters:**

- `datafast_visitor_id` (string): The DataFast unique ID of the visitor
- `name` (string): Name for the goal (lowercase letters, numbers, underscores, hyphens, max 32 chars)
- `metadata` (object, optional): Custom parameters to enrich your event data

#### 3. get_visitor_data

Retrieve comprehensive identity, activity, and prediction data for a specific visitor.

**Parameters:**

- `datafast_visitor_id` (string): The DataFast visitor ID to retrieve data for

**Returns:**

- Location and device information
- Visit and pageview counts
- Traffic source attribution
- Completed goals
- Conversion predictions (if available)

### Advanced API Tools

#### 4. batch_create_goals

Create multiple goals at once for efficient bulk operations.

**Parameters:**

- `goals` (array): Array of goal objects, each containing:
  - `datafast_visitor_id` (string): The DataFast unique ID of the visitor
  - `name` (string): Name for the goal
  - `metadata` (object, optional): Custom parameters for the goal

**Use cases:**

- Track user onboarding milestones for multiple users
- Create goals for different user segments simultaneously
- Bulk goal creation for marketing campaigns

#### 5. validate_visitor

Check if a visitor ID is valid and has available data before performing operations.

**Parameters:**

- `datafast_visitor_id` (string): The DataFast visitor ID to validate

**Use cases:**

- Pre-check visitor IDs before creating goals or payments
- Validate visitor data before analysis
- Debug visitor tracking issues

#### 6. create_revenue_goal

Create a goal that also tracks associated revenue in a single operation.

**Parameters:**

- `datafast_visitor_id` (string): The DataFast unique ID of the visitor
- `goal_name` (string): Name for the goal
- `revenue_amount` (number): Revenue amount associated with this goal
- `currency` (string, optional): Currency code (defaults to "USD")
- `metadata` (object, optional): Additional custom parameters

**Use cases:**

- Track purchases with specific goal completion
- Revenue attribution for marketing campaigns
- E-commerce conversion tracking

#### 7. get_analytics_summary

Get a concise analytics summary for quick visitor insights.

**Parameters:**

- `datafast_visitor_id` (string): The DataFast visitor ID to analyze
- `include_prediction` (boolean, optional): Whether to include conversion predictions (default: true)

**Use cases:**

- Quick visitor assessment for customer support
- Fast analytics overview for decision making
- Simplified reporting for non-technical users

### Implementation Helper Tools

#### 8. generate_tracking_code

Generate browser tracking code for different JavaScript frameworks.

**Parameters:**

- `framework` (string): Framework to generate code for ("vanilla", "react", "vue", "angular", "nextjs", "nuxt")
- `features` (array): Features to include ("visitor_id", "goals", "payments", "events")
- `include_comments` (boolean): Whether to include explanatory comments

**Generated Code Includes:**

- Script initialization
- Visitor ID retrieval
- Goal tracking functions
- Payment tracking functions
- Framework-specific integration patterns

#### 9. generate_webhook_handler

Generate webhook handler code for payment providers.

**Parameters:**

- `provider` (string): Payment provider ("stripe", "paypal", "lemonsqueezy", "paddle", "custom")
- `language` (string): Programming language ("javascript", "typescript", "python", "php", "go")
- `features` (array): Features to include ("payment_tracking", "goal_tracking", "refund_handling", "metadata_extraction")

**Generated Code Includes:**

- Webhook signature verification
- Payment processing logic
- Goal creation for subscriptions
- Refund handling
- Error handling and logging

#### 10. generate_config_template

Generate configuration templates for different platforms and environments.

**Parameters:**

- `environment` (string): Environment type ("development", "staging", "production")
- `platform` (string): Platform type ("web", "mobile", "server", "lambda")
- `features` (array): Features to configure ("tracking", "goals", "payments", "analytics", "debugging")

**Generated Code Includes:**

- Complete configuration objects
- Environment variables templates
- API client setup
- Feature flags and settings
- Platform-specific configurations

#### 11. generate_debugging_tools

Generate debugging and testing tools for different platforms.

**Parameters:**

- `platform` (string): Platform type ("browser", "server", "mobile")
- `features` (array): Debugging features ("visitor_tracking", "payment_debug", "goal_tracking", "network_monitoring", "error_tracking")

**Generated Code Includes:**

- Data validation functions
- Performance monitoring
- Network request monitoring
- Error tracking
- Console debugging helpers
- Log export functionality

## Development & Integration Examples

### IDE Integration Use Cases

**With Claude Code:**

- Analyze visitor behavior patterns in real-time
- Track goal completion during development
- Monitor payment attribution effectiveness
- Validate visitor data before implementing features

**With Cursor IDE:**

- Batch create goals for new feature releases
- Track user engagement with different code paths
- Monitor conversion rates for A/B tests
- Validate visitor data in development workflow

### Automation Examples

**E-commerce Integration:**

```javascript
// Track successful purchases
await create_payment({
  amount: 99.99,
  currency: "USD",
  transaction_id: "order_12345",
  datafast_visitor_id: visitorId,
  customer_email: "customer@example.com",
});
```

**User Onboarding:**

```javascript
// Create goals for onboarding steps
await batch_create_goals({
  goals: [
    { datafast_visitor_id: visitorId, name: "account_created" },
    { datafast_visitor_id: visitorId, name: "profile_completed" },
    { datafast_visitor_id: visitorId, name: "first_feature_used" },
  ],
});
```

**Revenue Tracking:**

```javascript
// Track subscription revenue with goal
await create_revenue_goal({
  datafast_visitor_id: visitorId,
  goal_name: "subscription_started",
  revenue_amount: 29.99,
  currency: "USD",
  metadata: { plan: "premium", period: "monthly" },
});
```

### Implementation Examples

**Generate React Tracking Code:**

```javascript
// Ask your AI assistant: "Generate React tracking code for my payment flow"

// This will generate complete React hooks and components for:
// - Visitor ID management
// - Payment tracking
// - Goal creation
// - Error handling
```

**Create Stripe Webhook Handler:**

```javascript
// Ask your AI assistant: "Generate a Stripe webhook handler for payments and subscriptions"

// This creates production-ready code for:
// - Webhook signature verification
// - Payment processing
// - Subscription goal tracking
// - Refund handling
```

**Set Up Server Configuration:**

```javascript
// Ask your AI assistant: "Generate a production server config for my Node.js app"

// This generates complete configuration for:
// - API client setup
// - Environment variables
// - Feature flags
// - Error handling
```

**Debug Implementation Issues:**

```javascript
// Ask your AI assistant: "Generate debugging tools for my server-side tracking"

// This creates tools for:
// - Data validation
// - Network monitoring
// - Performance tracking
// - Error logging
```

### Complete Integration Workflow

Here's how to use the DataFast MCP server for a complete integration:

1. **Generate Configuration:**

   ```
   "Generate a production server config for my Node.js e-commerce app"
   ```

2. **Create Tracking Code:**

   ```
   "Generate Next.js tracking code with payment and goal tracking"
   ```

3. **Set Up Webhooks:**

   ```
   "Generate Stripe webhook handlers for payments and subscriptions"
   ```

4. **Add Debugging:**

   ```
   "Generate server debugging tools for payment tracking"
   ```

5. **Test Implementation:**

   ```
   "Validate visitor ID and test payment tracking"
   ```

6. **Monitor Performance:**
   ```
   "Get analytics summary for visitor behavior analysis"
   ```

## Quick Start

### 🚀 5-Minute Setup

1. **Get your DataFast API key** from [DataFast Dashboard](https://datafa.st) → Settings → API

2. **Deploy to Cloudflare** (one-click):

   ```bash
   # Or deploy manually
   npm install
   npm run deploy
   ```

3. **Connect to Claude Code:**

   ```bash
   npm install -g @anthropic-ai/claude-code
   claude
   ```

   Then add the MCP server configuration with your API key.

4. **Start building:**
   ```
   "Generate React tracking code for my payment flow"
   "Create goals for user onboarding steps"
   "Track a $29.99 payment for visitor abc-123"
   ```

### 📱 Mobile Development

For React Native or mobile development:

```javascript
// Ask your AI: "Generate React Native DataFast integration"
```

### 🏢 Enterprise Setup

For production enterprise environments:

```javascript
// Ask your AI: "Generate production config for AWS Lambda deployment"
"Create Stripe webhook handlers for enterprise payment processing";
```

## API Key Setup

1. Navigate to your Website's Settings > API tab in the DataFast dashboard
2. Generate a new API key
3. Copy the key immediately (it won't be shown again)
4. Use it in your MCP server URL as a query parameter

## Error Handling

The server provides comprehensive error handling for:

- Missing or invalid API keys
- Bot detection (400 errors)
- Missing pageviews (404 errors)
- Network connectivity issues
- Invalid request parameters

## Security Notes

- API keys are passed via query parameters for simplicity
- Consider using environment variables for production deployments
- Never expose API keys in client-side code or public repositories
- The server validates all input parameters before making API calls

## API Reference

### Core Endpoints

| Endpoint                | Method | Description                            |
| ----------------------- | ------ | -------------------------------------- |
| `/sse?api_key=YOUR_KEY` | GET    | Server-Sent Events for MCP connections |
| `/mcp?api_key=YOUR_KEY` | POST   | Direct MCP protocol communication      |

### DataFast API Integration

This MCP server provides a wrapper around the DataFast API endpoints:

- **Payments API**: `POST /api/v1/payments` - Revenue tracking and attribution
- **Goals API**: `POST /api/v1/goals` - Conversion goal creation
- **Visitors API**: `GET /api/v1/visitors/{id}` - Visitor analytics and predictions

For complete API documentation, visit [DataFast API Docs](https://datafa.st/api).

## Architecture

### Cloudflare Workers + Durable Objects

- **Workers**: Serverless execution environment
- **Durable Objects**: Stateful persistence for MCP sessions
- **WebSocket Hibernation**: Cost-effective long-running connections
- **Global Distribution**: Automatic CDN and edge deployment

### Security Architecture

- **Query Parameter Authentication**: API keys passed securely in URLs
- **Bearer Token Forwarding**: Proper authentication with DataFast API
- **Input Validation**: Comprehensive Zod schema validation
- **Error Sanitization**: Safe error messages without sensitive data

## Troubleshooting

### Common Issues

**Connection Failed**

```bash
# Test the endpoint directly
curl "http://localhost:8787/sse?api_key=YOUR_API_KEY"
```

**Invalid API Key**

- Verify your DataFast API key in the dashboard
- Ensure no extra spaces in the URL
- Check API key permissions

**Tools Not Appearing**

- Restart your MCP client (Claude Code/Cursor)
- Verify JSON configuration syntax
- Check console for connection errors

**Rate Limiting**

- DataFast API has rate limits based on your plan
- Implement exponential backoff in your application
- Consider batching requests when possible

### Debug Mode

Enable debug logging by adding `debug=true` to your DataFast script:

```html
<script
  src="https://datafa.st/js/script.js"
  data-website-id="YOUR_ID"
  data-debug="true"
></script>
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd datafast-mcp

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run type-check

# Format code
npm run format
```

### Adding New Tools

1. Define the tool in the `init()` method using `this.server.tool()`
2. Add comprehensive Zod validation
3. Include detailed descriptions for AI assistance
4. Add error handling and logging
5. Update this README with the new tool documentation

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [DataFast Docs](https://datafa.st/docs)
- **API Reference**: [DataFast API](https://datafa.st/api)
- **Community**: [GitHub Discussions](https://github.com/discussions)
- **Issues**: [GitHub Issues](https://github.com/issues)

## Changelog

### v1.0.0

- Initial release with 11 MCP tools
- Support for all major JavaScript frameworks
- Webhook handler generation for payment providers
- Comprehensive debugging and testing tools
- Claude Code and Cursor IDE integration

---

**Built with ❤️ for the DataFast community**
