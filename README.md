# DataFast Analytics MCP Server

A Model Context Protocol (MCP) server for interacting with DataFast analytics API, deployed on Cloudflare Workers. This server provides tools to track payments, create custom goals, and retrieve visitor data from your DataFast account.

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

### Connect to Claude Desktop

To connect to your remote MCP server from Claude Desktop:

1. Follow [Anthropic's Quickstart](https://modelcontextprotocol.io/quickstart/user)
2. Go to Settings > Developer > Edit Config
3. Add this configuration:

```json
{
  "mcpServers": {
    "datafast": {
      "command": "npx",
      "args": ["mcp-remote", "http://localhost:8787/sse?api_key=YOUR_API_KEY"]
    }
  }
}
```

Replace `YOUR_API_KEY` with your actual DataFast API key.

### Connect to Cloudflare AI Playground

1. Go to https://playground.ai.cloudflare.com/
2. Enter your MCP server URL with API key:
   ```
   https://datafast-mcp-server.your-account.workers.dev/sse?api_key=YOUR_API_KEY
   ```
3. You can now use the DataFast tools directly from the playground!

## Available Tools

### 1. create_payment

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

### 2. create_goal

Create a custom goal for a specific visitor.

**Parameters:**

- `datafast_visitor_id` (string): The DataFast unique ID of the visitor
- `name` (string): Name for the goal (lowercase letters, numbers, underscores, hyphens, max 32 chars)
- `metadata` (object, optional): Custom parameters to enrich your event data

### 3. get_visitor_data

Retrieve identity, activity, and prediction data for a specific visitor.

**Parameters:**

- `datafast_visitor_id` (string): The DataFast visitor ID to retrieve data for

**Returns:**

- Location and device information
- Visit and pageview counts
- Traffic source attribution
- Completed goals
- Conversion predictions (if available)

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
