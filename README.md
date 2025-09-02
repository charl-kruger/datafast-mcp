# DataFa.st MCP Server

A Model Context Protocol (MCP) server that helps developers easily integrate DataFa.st analytics into their applications. This MCP solves the biggest onboarding challenges users face: script installation complexity and revenue attribution setup.

## Features

🚀 **Framework-Specific Setup** - Automatically generates tracking code for 10+ popular frameworks  
🛡️ **Ad Blocker Circumvention** - Provides proxy configurations to avoid tracking blocks  
📊 **Revenue Attribution** - Easy payment and goal tracking tools  
✅ **Installation Validation** - Built-in testing and troubleshooting guides  
📚 **Comprehensive Resources** - Framework-specific setup guides and documentation  

## Supported Frameworks

- Next.js
- Vue.js  
- React
- Angular
- Laravel
- Django
- Astro
- SvelteKit
- Nuxt.js
- Vanilla HTML/JavaScript

## Getting Started

### 1. Deploy the MCP Server

```bash
# Install dependencies
npm install

# Deploy to Cloudflare Workers
npm run deploy
```

### 2. Connect to Your IDE

Add the DataFa.st MCP server to your development environment. Choose your preferred method:

#### Claude Code (Anthropic)
Add to your Claude Code MCP configuration:

```json
{
  "mcpServers": {
    "datafast": {
      "command": "node",
      "args": [
        "-e",
        "const { SSEClientTransport } = require('@modelcontextprotocol/sdk/client/sse.js'); const client = new SSEClientTransport(new URL('https://datafast-mcp.invsy.workers.dev/sse?api_key=YOUR_DATAFAST_API_KEY')); client.connect();"
      ]
    }
  }
}
```

#### Cursor IDE
Add to your `.cursor/mcp.json` file:

```json
{
  "mcpServers": {
    "datafast-mcp": {
      "type": "sse",
      "url": "https://datafast-mcp.invsy.workers.dev/sse?api_key=YOUR_DATAFAST_API_KEY"
    }
  }
}
```

#### Zed Editor
Add to your Zed settings (`~/.config/zed/settings.json`):

```json
{
  "assistant": {
    "version": "2",
    "provider": {
      "name": "anthropic",
      "default_model": "claude-3-5-sonnet-20241022",
      "api_key": "YOUR_ANTHROPIC_API_KEY",
      "low_speed_timeout_in_seconds": 60
    }
  },
  "context_servers": {
    "datafast-mcp": {
      "type": "sse",
      "url": "https://datafast-mcp.invsy.workers.dev/sse?api_key=YOUR_DATAFAST_API_KEY"
    }
  }
}
```

#### VS Code with MCP Extension
1. Install the MCP extension for VS Code
2. Add to your VS Code settings (`settings.json`):

```json
{
  "mcp.servers": {
    "datafast": {
      "transport": {
        "type": "sse",
        "url": "https://datafast-mcp.invsy.workers.dev/sse?api_key=YOUR_DATAFAST_API_KEY"
      }
    }
  }
}
```

#### Continue.dev
Add to your Continue configuration (`.continue/config.json`):

```json
{
  "models": [...],
  "contextProviders": [...],
  "mcpServers": [
    {
      "name": "datafast",
      "transport": {
        "type": "sse", 
        "url": "https://datafast-mcp.invsy.workers.dev/sse?api_key=YOUR_DATAFAST_API_KEY"
      }
    }
  ]
}
```

#### Generic MCP Client
For any MCP-compatible client using the standard protocol:

**SSE Endpoint:**
```
https://datafast-mcp.invsy.workers.dev/sse?api_key=YOUR_DATAFAST_API_KEY
```

**HTTP Endpoint:** 
```
https://datafast-mcp.invsy.workers.dev/mcp?api_key=YOUR_DATAFAST_API_KEY
```

#### Local Development
For local development and testing:

```json
{
  "datafast-mcp": {
    "type": "sse",
    "url": "http://localhost:8787/sse?api_key=YOUR_DATAFAST_API_KEY"
  }
}
```

> **⚠️ Important:** Replace `YOUR_DATAFAST_API_KEY` with your actual DataFa.st API key from the [DataFa.st Dashboard](https://datafa.st/dashboard)

### 3. Get Your Website ID

Visit [DataFa.st Dashboard](https://datafa.st/dashboard) and copy your Website ID - you'll need this for setup.

### 4. Verify MCP Connection

After setting up the MCP server in your IDE, verify it's working:

1. **Check Available Tools**: Look for DataFa.st tools in your IDE's MCP tool list:
   - `datafast_help`
   - `generate_tracking_script`
   - `create_goal` 
   - `track_payment`
   - `get_visitor_data`
   - `validate_installation`

2. **Test Connection**: Try running a simple command like:
   ```
   datafast_help()
   ```
   or
   ```
   generate_tracking_script(websiteId: "test", domain: "example.com")
   ```

3. **Access Resources**: Check if you can access setup guides:
   - `setup://datafast/onboarding`
   - `setup://datafast/nextjs`
   - `setup://datafast/react`

If tools don't appear, check the troubleshooting section below.

## Available Tools

### `datafast_help`
Get comprehensive help and guidance on using the DataFa.st MCP tools.

```
datafast_help() // Shows complete overview and workflow
datafast_help(topic: "setup") // Setup-specific help
datafast_help(topic: "tracking") // Goal and payment tracking help
datafast_help(topic: "analytics") // Analytics and insights help
datafast_help(topic: "troubleshooting") // Common issues and solutions
```

### `generate_tracking_script`
Generates framework-specific tracking code with optional proxy setup.

```
generate_tracking_script(
  websiteId: "your-website-id",
  domain: "yourdomain.com", 
  framework: "nextjs", // optional, auto-detects
  useProxy: true // recommended
)
```

### `create_goal`
Track custom conversion events like signups, downloads, etc.

```
create_goal(
  visitorId: "visitor-id-from-cookies", // Get from DevTools > Application > Cookies > datafast_visitor_id
  name: "newsletter_signup",
  metadata: { source: "homepage" } // optional
)
```

### `track_payment`
Attribute revenue to marketing channels for ROI tracking.

```
track_payment(
  visitorId: "visitor-id-from-cookies", // Get from DevTools > Application > Cookies > datafast_visitor_id
  amount: 29.99,
  currency: "USD",
  transactionId: "unique-id",
  email: "customer@example.com" // optional
)
```

### `get_visitor_data`
Retrieve detailed visitor analytics and conversion predictions.

```
get_visitor_data(visitorId: "visitor-id-from-cookies") // Get from DevTools > Application > Cookies > datafast_visitor_id
```

### `validate_installation`
Test and troubleshoot your DataFa.st installation.

```
validate_installation(
  domain: "yourdomain.com",
  websiteId: "your-website-id",
  useProxy: true
)
```

## Available Resources

The MCP provides comprehensive setup guides accessible via resource URIs:

- `setup://datafast/onboarding` - General onboarding guide
- `setup://datafast/nextjs` - Next.js specific guide
- `setup://datafast/vue` - Vue.js specific guide  
- `setup://datafast/react` - React specific guide
- ... (and more for each framework)

## Quick Start Example

1. **Get help and overview**:
   ```
   datafast_help()
   ```

2. **Generate tracking script**:
   ```
   generate_tracking_script(websiteId: "abc123", domain: "mysite.com", framework: "nextjs", useProxy: true)
   ```

3. **Install the generated code** in your application

4. **Validate installation**:
   ```
   validate_installation(domain: "mysite.com", websiteId: "abc123", useProxy: true)
   ```

5. **Get your visitor ID for testing**:
   - Visit your website with DataFa.st installed
   - Open DevTools → Application tab → Cookies
   - Find cookie named `datafast_visitor_id` (scoped to your domain)
   - Copy the visitor ID value

6. **Track conversions**:
   ```
   create_goal(visitorId: "your-actual-visitor-id", name: "signup")
   track_payment(visitorId: "your-actual-visitor-id", amount: 29.99, currency: "USD", transactionId: "txn456")
   ```

## Common Issues & Solutions

### No Data in Dashboard
- Wait 5-10 minutes after installation
- Check browser network tab for requests
- Verify script placement and syntax
- Use validation tool for troubleshooting

### Ad Blockers Blocking Tracking  
- Use `useProxy: true` in `generate_tracking_script`
- Follow the generated proxy configuration instructions

### Revenue Attribution Not Working
- Ensure visitor has pageviews before payment tracking
- Use correct visitor ID from cookies (`datafast_visitor_id`)
- Verify API key permissions

### Can't Find Visitor ID
- Ensure DataFa.st tracking script is installed and running
- Visit your website first to generate the cookie
- Check DevTools > Application > Cookies for `datafast_visitor_id`
- Visitor ID is domain-specific - use the one from your actual domain
- If no cookie exists, tracking script may not be working properly

### MCP Connection Issues
- Verify your DataFa.st API key is correct and active
- Check that the MCP server URL is accessible: `https://datafast-mcp.invsy.workers.dev/sse?api_key=YOUR_KEY`
- For local development, ensure the server is running: `npm run dev`
- Restart your IDE/editor after adding MCP configuration
- Check IDE/editor logs for MCP connection errors

### Tools Not Appearing
- Refresh your IDE's MCP connection
- Verify the MCP server is properly configured in your IDE settings
- Check that your IDE supports the MCP protocol
- Try reconnecting to the MCP server

## Development

```bash
# Start development server
npm run dev

# Run type checking
npm run type-check

# Fix linting issues
npm run lint:fix

# Deploy to production  
npm run deploy
```

## Architecture

This MCP server runs on Cloudflare Workers and provides:

- **Tools** for interactive DataFa.st operations
- **Resources** for framework-specific documentation
- **Prompts** for guided setup workflows (future enhancement)

## Support

For issues with the MCP server, please create an issue in this repository.  
For DataFa.st-specific questions, visit [DataFa.st Documentation](https://datafa.st/docs).
