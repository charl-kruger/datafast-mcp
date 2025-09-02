import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Framework detection types
type FrameworkType = 'nextjs' | 'vue' | 'react' | 'angular' | 'laravel' | 'django' | 'astro' | 'svelte' | 'nuxt' | 'vanilla';

type FrameworkConfig = {
  name: string;
  scriptTemplate: string;
  proxyTemplate?: string;
  installInstructions: string;
};

// Define our MCP agent with DataFast API tools
type State = Record<string, never>;
type Props = {
  apiKey: string;
};

export class DataFastMCP extends McpAgent<Env, State, Props> {
  server = new McpServer({
    name: "DataFast Analytics API",
    version: "1.0.0",
  });

  // Framework configurations for DataFa.st setup
  private frameworks: Record<FrameworkType, FrameworkConfig> = {
    nextjs: {
      name: 'Next.js',
      scriptTemplate: `// Add to your _app.js or layout.js
<Script
  defer
  data-website-id="{WEBSITE_ID}"
  data-domain="{DOMAIN}"
  src="{SCRIPT_SRC}"
/>`,
      proxyTemplate: `// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/js/script.js',
        destination: 'https://datafa.st/js/script.js'
      },
      {
        source: '/api/events',
        destination: 'https://datafa.st/api/events'
      }
    ]
  }
}`,
      installInstructions: 'Import Script from "next/script" and add the tracking script to your _app.js or root layout.'
    },
    vue: {
      name: 'Vue.js',
      scriptTemplate: `<!-- Add to your index.html or main component -->
<script
  defer
  data-website-id="{WEBSITE_ID}"
  data-domain="{DOMAIN}"
  src="{SCRIPT_SRC}"
></script>`,
      proxyTemplate: `// vue.config.js
module.exports = {
  devServer: {
    proxy: {
      '/js/script.js': {
        target: 'https://datafa.st',
        changeOrigin: true
      },
      '/api/events': {
        target: 'https://datafa.st',
        changeOrigin: true
      }
    }
  }
}`,
      installInstructions: 'Add the script tag to your public/index.html or main App.vue component.'
    },
    react: {
      name: 'React',
      scriptTemplate: `// Add to your index.html or App.js
<script
  defer
  data-website-id="{WEBSITE_ID}"
  data-domain="{DOMAIN}"
  src="{SCRIPT_SRC}"
></script>`,
      installInstructions: 'Add the script tag to your public/index.html file in the <head> section.'
    },
    angular: {
      name: 'Angular',
      scriptTemplate: `<!-- Add to your index.html -->
<script
  defer
  data-website-id="{WEBSITE_ID}"
  data-domain="{DOMAIN}"
  src="{SCRIPT_SRC}"
></script>`,
      installInstructions: 'Add the script tag to your src/index.html file in the <head> section.'
    },
    laravel: {
      name: 'Laravel',
      scriptTemplate: `{{-- Add to your blade template --}}
<script
  defer
  data-website-id="{WEBSITE_ID}"
  data-domain="{DOMAIN}"
  src="{SCRIPT_SRC}"
></script>`,
      installInstructions: 'Add the script tag to your main layout blade template (e.g., app.blade.php).'
    },
    django: {
      name: 'Django',
      scriptTemplate: `<!-- Add to your base template -->
<script
  defer
  data-website-id="{WEBSITE_ID}"
  data-domain="{DOMAIN}"
  src="{SCRIPT_SRC}"
></script>`,
      installInstructions: 'Add the script tag to your base.html template in the <head> section.'
    },
    astro: {
      name: 'Astro',
      scriptTemplate: `---
// Add to your Layout.astro
---
<script
  defer
  data-website-id="{WEBSITE_ID}"
  data-domain="{DOMAIN}"
  src="{SCRIPT_SRC}"
></script>`,
      installInstructions: 'Add the script tag to your main layout component.'
    },
    svelte: {
      name: 'SvelteKit',
      scriptTemplate: `<!-- Add to your app.html -->
<script
  defer
  data-website-id="{WEBSITE_ID}"
  data-domain="{DOMAIN}"
  src="{SCRIPT_SRC}"
></script>`,
      installInstructions: 'Add the script tag to your src/app.html file in the <head> section.'
    },
    nuxt: {
      name: 'Nuxt.js',
      scriptTemplate: `// Add to nuxt.config.js
export default {
  head: {
    script: [
      {
        defer: true,
        'data-website-id': '{WEBSITE_ID}',
        'data-domain': '{DOMAIN}',
        src: '{SCRIPT_SRC}'
      }
    ]
  }
}`,
      installInstructions: 'Add the script configuration to your nuxt.config.js file.'
    },
    vanilla: {
      name: 'Vanilla HTML',
      scriptTemplate: `<!-- Add to your HTML -->
<script
  defer
  data-website-id="{WEBSITE_ID}"
  data-domain="{DOMAIN}"
  src="{SCRIPT_SRC}"
></script>`,
      installInstructions: 'Add the script tag to your HTML file in the <head> section.'
    }
  };

  async init() {
    // Tool 1: Generate tracking script for detected framework
    this.server.tool(
      "generate_tracking_script",
      "Generate DataFa.st tracking script for your specific framework. Automatically detects framework or accepts manual selection.",
      {
        websiteId: z.string().describe("Your website ID from DataFa.st dashboard (required - get this from https://datafa.st/dashboard)"),
        domain: z.string().describe("Your website domain (e.g., 'example.com')"),
        framework: z.enum(['nextjs', 'vue', 'react', 'angular', 'laravel', 'django', 'astro', 'svelte', 'nuxt', 'vanilla']).optional().describe("Framework to use (will auto-detect if not provided)"),
        useProxy: z.boolean().optional().describe("Whether to set up proxy to avoid ad blockers (recommended: true)")
      },
      async (params) => {
        const { websiteId, domain, framework, useProxy = true } = params;
        
        // Auto-detect framework if not provided
        let detectedFramework: FrameworkType = framework || 'vanilla';
        if (!framework) {
          // Framework detection logic would go here
          // For now, defaulting to vanilla
          detectedFramework = 'vanilla';
        }
        
        const config = this.frameworks[detectedFramework];
        const scriptSrc = useProxy ? '/js/script.js' : 'https://datafa.st/js/script.js';
        
        const script = config.scriptTemplate
          .replace('{WEBSITE_ID}', websiteId)
          .replace('{DOMAIN}', domain)
          .replace('{SCRIPT_SRC}', scriptSrc);
        
        let response = `🚀 **DataFa.st Tracking Script for ${config.name}**\n\n`;
        response += `**Script:**\n\`\`\`${detectedFramework === 'nextjs' || detectedFramework === 'nuxt' ? 'javascript' : 'html'}\n${script}\n\`\`\`\n\n`;
        response += `**Installation:** ${config.installInstructions}\n\n`;
        
        if (useProxy && config.proxyTemplate) {
          response += `**Proxy Configuration (Recommended):**\n\`\`\`javascript\n${config.proxyTemplate}\n\`\`\`\n\n`;
          response += `ℹ️ **Why use proxy?** Proxying through your domain prevents ad blockers from blocking tracking and improves data accuracy.\n\n`;
        }
        
        response += `⚠️ **Important:** Get your website ID from https://datafa.st/dashboard\n`;
        response += `📚 **Next steps:** Use the \`validate_installation\` tool after setup to test tracking.`;
        
        return {
          content: [{ type: "text", text: response }]
        };
      }
    );

    // Tool 2: Create custom goal
    this.server.tool(
      "create_goal",
      "Create a custom conversion goal in DataFa.st to track user actions like signups, purchases, or downloads.",
      {
        visitorId: z.string().describe("DataFa.st visitor ID from browser cookies - find it in DevTools > Application > Cookies > datafast_visitor_id"),
        name: z.string().describe("Goal name (lowercase, max 32 chars, e.g. 'newsletter_signup', 'purchase')"),
        metadata: z.record(z.string()).optional().describe("Optional metadata object with custom properties (max 10 properties)")
      },
      async (params) => {
        const apiKey = this.props.apiKey;
        const { visitorId, name, metadata } = params;

        const response = await fetch("https://datafa.st/api/v1/goals", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            datafast_visitor_id: visitorId,
            name: name,
            metadata: metadata
          }),
        });

        if (!response.ok) {
          const errorData = (await response.json().catch(() => ({}))) as {
            error?: { message?: string };
          };
          return {
            content: [
              {
                type: "text",
                text: `❌ **Goal Creation Failed**\nError ${response.status}: ${
                  errorData.error?.message || response.statusText
                }\n\n**Common issues:**\n- Visitor must have at least one prior pageview\n- Goal name must be lowercase, max 32 characters\n- Invalid visitor ID`,
              },
            ],
            isError: true,
          };
        }

        const result = (await response.json()) as {
          event_id: string;
          message: string;
        };
        
        return {
          content: [
            {
              type: "text",
              text: `✅ **Goal "${name}" Created Successfully!**\n\nEvent ID: ${result.event_id}\nMessage: ${result.message}\n\n🎯 This goal will now be tracked in your DataFa.st analytics dashboard.`,
            },
          ],
        };
      }
    );

    // Tool 3: Track payment for revenue attribution
    this.server.tool(
      "track_payment",
      "Track a payment in DataFa.st for revenue attribution to marketing channels. Links revenue to traffic sources.",
      {
        visitorId: z.string().describe("DataFa.st visitor ID from browser cookies - find it in DevTools > Application > Cookies > datafast_visitor_id"),
        amount: z.number().describe("Payment amount (e.g., 29.99 for $29.99)"),
        currency: z.string().describe("Currency code (USD, EUR, GBP, etc.)"),
        transactionId: z.string().describe("Unique transaction ID from your payment system"),
        email: z.string().optional().describe("Customer email address"),
        name: z.string().optional().describe("Customer name"),
        customerId: z.string().optional().describe("Customer ID from your payment provider"),
        renewal: z.boolean().optional().describe("Is this a recurring/renewal payment?"),
        refunded: z.boolean().optional().describe("Is this payment refunded?")
      },
      async (params) => {
        const apiKey = this.props.apiKey;
        const { visitorId, amount, currency, transactionId, email, name, customerId, renewal, refunded } = params;

        const response = await fetch("https://datafa.st/api/v1/payments", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            datafast_visitor_id: visitorId,
            amount,
            currency,
            transaction_id: transactionId,
            email,
            name,
            customer_id: customerId,
            renewal,
            refunded
          }),
        });

        if (!response.ok) {
          const errorData = (await response.json().catch(() => ({}))) as {
            error?: { message?: string };
          };
          return {
            content: [
              {
                type: "text",
                text: `❌ **Payment Tracking Failed**\nError ${response.status}: ${
                  errorData.error?.message || response.statusText
                }\n\n**Common issues:**\n- Invalid visitor ID\n- Duplicate transaction ID\n- Invalid currency code\n- Missing required fields`,
              },
            ],
            isError: true,
          };
        }

        const result = (await response.json()) as {
          transaction_id: string;
          message: string;
        };
        
        return {
          content: [
            {
              type: "text",
              text: `💰 **Payment Tracked Successfully!**\n\nTransaction ID: ${result.transaction_id}\nAmount: ${amount} ${currency}\nMessage: ${result.message}\n\n📊 This revenue is now attributed to the visitor's traffic source in your DataFa.st dashboard.`,
            },
          ],
        };
      }
    );

    // Tool 4: Get visitor analytics data
    this.server.tool(
      "get_visitor_data",
      "Retrieve detailed analytics data for a specific visitor, including conversion predictions and activity history.",
      {
        visitorId: z.string().describe("DataFa.st visitor ID - find it in your browser's DevTools > Application > Cookies > datafast_visitor_id")
      },
      async (params) => {
        const apiKey = this.props.apiKey;
        const { visitorId } = params;

        const response = await fetch(`https://datafa.st/api/v1/visitors/${visitorId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = (await response.json().catch(() => ({}))) as {
            error?: { message?: string };
          };
          return {
            content: [
              {
                type: "text",
                text: `❌ **Visitor Data Retrieval Failed**\nError ${response.status}: ${
                  errorData.error?.message || response.statusText
                }\n\n**Common issues:**\n- Invalid visitor ID\n- Visitor not found\n- API key permissions`,
              },
            ],
            isError: true,
          };
        }

        const data = await response.json() as {
          identity: {
            country: string;
            region: string;
            city: string;
            browser: string;
            device_type: string;
            os: string;
          };
          activity: {
            visit_count: number;
            pageview_count: number;
            first_visit: string;
            last_visit: string;
            current_url: string;
            pages: string[];
            goals: Array<{ name: string; timestamp: string; metadata?: Record<string, unknown> }>;
          };
          prediction: {
            conversion_score: number;
            conversion_rate: number;
            expected_revenue: number;
            confidence: number;
          };
        };
        
        let response_text = `👤 **Visitor Analytics Data**\n\n`;
        
        // Identity section
        response_text += `**🌍 Identity & Location:**\n`;
        response_text += `• Location: ${data.identity.city}, ${data.identity.region}, ${data.identity.country}\n`;
        response_text += `• Browser: ${data.identity.browser}\n`;
        response_text += `• Device: ${data.identity.device_type}\n`;
        response_text += `• OS: ${data.identity.os}\n\n`;
        
        // Activity section
        response_text += `**📊 Activity:**\n`;
        response_text += `• Visits: ${data.activity.visit_count}\n`;
        response_text += `• Pageviews: ${data.activity.pageview_count}\n`;
        response_text += `• First visit: ${data.activity.first_visit}\n`;
        response_text += `• Last visit: ${data.activity.last_visit}\n`;
        response_text += `• Current URL: ${data.activity.current_url}\n`;
        
        if (data.activity.goals.length > 0) {
          response_text += `• Completed goals: ${data.activity.goals.map(g => g.name).join(', ')}\n`;
        }
        
        // Prediction section
        response_text += `\n**🎯 Conversion Prediction:**\n`;
        response_text += `• Conversion Score: ${data.prediction.conversion_score}/100\n`;
        response_text += `• Conversion Rate: ${(data.prediction.conversion_rate * 100).toFixed(1)}%\n`;
        response_text += `• Expected Revenue: $${data.prediction.expected_revenue.toFixed(2)}\n`;
        response_text += `• Confidence: ${(data.prediction.confidence * 100).toFixed(1)}%\n\n`;
        
        // Actionable insights
        if (data.prediction.conversion_score < 30) {
          response_text += `💡 **Recommendation:** Low conversion likelihood - consider showing lead magnets or special offers.\n`;
        } else if (data.prediction.conversion_score > 70) {
          response_text += `💡 **Recommendation:** High conversion potential - create urgency or showcase premium features.\n`;
        }
        
        return {
          content: [{ type: "text", text: response_text }]
        };
      }
    );

    // Tool 5: Help and guidance
    this.server.tool(
      "datafast_help",
      "Get help and guidance on using DataFa.st MCP tools. Shows available tools, common workflows, and next steps.",
      {
        topic: z.enum(['overview', 'setup', 'tracking', 'analytics', 'troubleshooting', 'all']).optional().describe("Specific help topic (default: 'all')")
      },
      async (params) => {
        const { topic = 'all' } = params;
        
        let response = `🚀 **DataFa.st MCP Help Center**\n\n`;
        
        if (topic === 'all' || topic === 'overview') {
          response += `## What can this MCP do?\n\n`;
          response += `The DataFa.st MCP helps you integrate analytics and revenue tracking into your applications with zero friction:\n\n`;
          response += `📊 **Generate tracking scripts** for 10+ frameworks (Next.js, React, Vue, etc.)\n`;
          response += `🛡️ **Set up ad blocker protection** with proxy configurations\n`;
          response += `🎯 **Track custom goals** like signups, downloads, conversions\n`;
          response += `💰 **Attribute revenue** to marketing channels and traffic sources\n`;
          response += `📈 **Analyze visitor behavior** with AI-powered conversion predictions\n`;
          response += `✅ **Validate installations** and troubleshoot issues\n\n`;
        }
        
        if (topic === 'all' || topic === 'setup') {
          response += `## 🚀 Quick Setup Workflow\n\n`;
          response += `**1. Get your Website ID** from https://datafa.st/dashboard\n\n`;
          response += `**2. Generate tracking code:**\n`;
          response += `\`\`\`\ngenerate_tracking_script(\n  websiteId: "your-website-id",\n  domain: "yourdomain.com",\n  framework: "nextjs", // or your framework\n  useProxy: true // recommended\n)\n\`\`\`\n\n`;
          response += `**3. Install the generated code** in your app\n\n`;
          response += `**4. Test installation:**\n`;
          response += `\`\`\`\nvalidate_installation(\n  domain: "yourdomain.com",\n  websiteId: "your-website-id",\n  useProxy: true\n)\n\`\`\`\n\n`;
        }
        
        if (topic === 'all' || topic === 'tracking') {
          response += `## 🎯 Tracking & Analytics\n\n`;
          response += `**Get your visitor ID:**\n`;
          response += `- Visit your website with DataFa.st installed\n`;
          response += `- Open DevTools → Application → Cookies → \`datafast_visitor_id\`\n\n`;
          response += `**Track goals:**\n`;
          response += `\`\`\`\ncreate_goal(\n  visitorId: "your-visitor-id",\n  name: "newsletter_signup"\n)\n\`\`\`\n\n`;
          response += `**Track payments:**\n`;
          response += `\`\`\`\ntrack_payment(\n  visitorId: "your-visitor-id",\n  amount: 29.99,\n  currency: "USD",\n  transactionId: "txn-123"\n)\n\`\`\`\n\n`;
        }
        
        if (topic === 'all' || topic === 'analytics') {
          response += `## 📈 Analytics & Insights\n\n`;
          response += `**Get visitor analytics:**\n`;
          response += `\`\`\`\nget_visitor_data(visitorId: "your-visitor-id")\n\`\`\`\n\n`;
          response += `This returns:\n`;
          response += `- 🌍 Location and device info\n`;
          response += `- 📊 Visit counts and pageviews\n`;
          response += `- 🎯 Completed goals and activities\n`;
          response += `- 🤖 AI conversion predictions (0-100 score)\n`;
          response += `- 💰 Expected revenue estimates\n\n`;
        }
        
        if (topic === 'all' || topic === 'troubleshooting') {
          response += `## 🔧 Common Issues & Solutions\n\n`;
          response += `**No data in dashboard?**\n`;
          response += `- Wait 5-10 minutes after setup\n`;
          response += `- Use \`validate_installation\` tool\n`;
          response += `- Check browser network tab for requests\n\n`;
          response += `**Can't find visitor ID?**\n`;
          response += `- Ensure tracking script is installed\n`;
          response += `- Visit your site first to generate the cookie\n`;
          response += `- Look in DevTools → Application → Cookies\n\n`;
          response += `**Ad blockers blocking tracking?**\n`;
          response += `- Use \`useProxy: true\` when generating scripts\n`;
          response += `- Follow the generated proxy configuration\n\n`;
        }
        
        if (topic === 'all') {
          response += `## 🛠️ Available Tools\n\n`;
          response += `- **\`generate_tracking_script\`** - Create framework-specific code\n`;
          response += `- **\`validate_installation\`** - Test your setup\n`;
          response += `- **\`create_goal\`** - Track conversions\n`;
          response += `- **\`track_payment\`** - Revenue attribution\n`;
          response += `- **\`get_visitor_data\`** - Analytics insights\n`;
          response += `- **\`datafast_help\`** - This help system\n\n`;
          
          response += `## 📚 Resources\n\n`;
          response += `Access setup guides:\n`;
          response += `- \`setup://datafast/onboarding\` - General guide\n`;
          response += `- \`setup://datafast/nextjs\` - Next.js guide\n`;
          response += `- \`setup://datafast/react\` - React guide\n`;
          response += `- And guides for Vue, Angular, Laravel, Django, etc.\n\n`;
          
          response += `## 🤔 What would you like to do?\n\n`;
          response += `**New to DataFa.st?** Start with \`generate_tracking_script\`\n`;
          response += `**Already installed?** Try \`validate_installation\`\n`;
          response += `**Want to track goals?** Use \`create_goal\`\n`;
          response += `**Need analytics data?** Use \`get_visitor_data\`\n`;
          response += `**Having issues?** Run \`validate_installation\` for troubleshooting\n\n`;
          
          response += `💡 **Tip:** All tools include detailed guidance and error messages to help you succeed!`;
        }
        
        return {
          content: [{ type: "text", text: response }]
        };
      }
    );

    // Tool 6: Validate installation
    this.server.tool(
      "validate_installation",
      "Validate that DataFa.st tracking is properly installed and working on your website. Checks script loading and event tracking.",
      {
        domain: z.string().describe("Your website domain to test (e.g., 'example.com')"),
        websiteId: z.string().describe("Your DataFa.st website ID"),
        useProxy: z.boolean().optional().describe("Whether you're using proxy setup")
      },
      async (params) => {
        const { domain, websiteId, useProxy = false } = params;
        
        let response = `🔍 **DataFa.st Installation Validation for ${domain}**\n\n`;
        
        // Basic validation checklist
        response += `**Validation Checklist:**\n\n`;
        
        response += `✅ **1. Script Integration**\n`;
        response += `• Ensure the tracking script is in your website's <head> section\n`;
        response += `• Script should include: data-website-id="${websiteId}"\n`;
        response += `• Script should include: data-domain="${domain}"\n\n`;
        
        if (useProxy) {
          response += `✅ **2. Proxy Configuration**\n`;
          response += `• Verify proxy routes are configured: /js/script.js → https://datafa.st/js/script.js\n`;
          response += `• Verify events route: /api/events → https://datafa.st/api/events\n`;
          response += `• Test proxy by visiting: https://${domain}/js/script.js\n\n`;
        } else {
          response += `✅ **2. Direct Script Loading**\n`;
          response += `• Script src should be: https://datafa.st/js/script.js\n`;
          response += `• Note: Direct loading may be blocked by ad blockers\n\n`;
        }
        
        response += `✅ **3. Manual Testing Steps**\n`;
        response += `• Open your website in browser\n`;
        response += `• Open DevTools → Network tab\n`;
        response += `• Look for successful requests to ${useProxy ? `${domain}/js/script.js` : 'datafa.st/js/script.js'}\n`;
        response += `• Navigate between pages to generate pageview events\n`;
        response += `• Check for POST requests to ${useProxy ? `${domain}/api/events` : 'datafa.st/api/events'}\n\n`;
        
        response += `✅ **4. Dashboard Verification**\n`;
        response += `• Visit https://datafa.st/dashboard\n`;
        response += `• Check for recent pageviews in real-time\n`;
        response += `• Verify visitor count increases\n\n`;
        
        response += `✅ **5. Get Your Visitor ID for Testing**\n`;
        response += `• Open DevTools → Application tab → Cookies\n`;
        response += `• Look for cookie named: \`datafast_visitor_id\`\n`;
        response += `• Copy the visitor ID value (domain-scoped to your site)\n`;
        response += `• Use this ID with \`get_visitor_data\` to test analytics retrieval\n`;
        response += `• Example: \`get_visitor_data(visitorId: "abc-123-def-456")\`\n\n`;
        
        response += `🚨 **Troubleshooting Common Issues:**\n`;
        response += `• **No script loading:** Check script placement and syntax\n`;
        response += `• **Script blocked:** Enable proxy setup to bypass ad blockers\n`;
        response += `• **Wrong website ID:** Double-check ID from dashboard\n`;
        response += `• **CORS errors:** Ensure domain matches dashboard settings\n`;
        response += `• **No events:** Check browser console for JavaScript errors\n\n`;
        
        response += `📊 **Next Steps:**\n`;
        response += `• Use \`create_goal\` to track conversions\n`;
        response += `• Use \`track_payment\` for revenue attribution\n`;
        response += `• Use \`get_visitor_data\` to analyze visitor behavior\n\n`;
        
        response += `💡 **Pro Tip:** Wait 5-10 minutes after installation before checking dashboard data.`;
        
        return {
          content: [{ type: "text", text: response }]
        };
      }
    );

    // Add resource templates for framework-specific setup guides
    this.addResourceTemplates();
  }

  private addResourceTemplates() {
    // Setup guides for each framework
    Object.entries(this.frameworks).forEach(([frameworkKey, config]) => {
      const framework = frameworkKey as FrameworkType;
      
      this.server.resource(
        `${framework}_setup_guide`,
        `setup://datafast/${framework}`,
        {
          name: `${config.name} Setup Guide`,
          description: `Complete setup guide for integrating DataFa.st analytics with ${config.name}`,
          mimeType: "text/markdown"
        },
        async () => {
          const guide = this.generateFrameworkGuide(framework, config);
          return {
            contents: [{
              uri: `setup://datafast/${framework}`,
              mimeType: "text/markdown",
              text: guide
            }]
          };
        }
      );
    });

    // General onboarding resource
    this.server.resource(
      "datafast_onboarding",
      "setup://datafast/onboarding",
      {
        name: "DataFa.st Onboarding Guide",
        description: "Complete guide to getting started with DataFa.st analytics",
        mimeType: "text/markdown"
      },
      async () => {
        const guide = `# DataFa.st Analytics Onboarding Guide

## Quick Start Checklist

### 1. Get Your Website ID
- Visit [DataFa.st Dashboard](https://datafa.st/dashboard)
- Create a new website or select existing one
- Copy your **Website ID** (you'll need this for setup)

### 2. Choose Your Setup Method
Use the MCP tools to generate framework-specific code:

\`\`\`
generate_tracking_script(
  websiteId: "your-website-id",
  domain: "yourdomain.com",
  framework: "nextjs", // or your framework
  useProxy: true // recommended
)
\`\`\`

### 3. Install Tracking Code
Follow the generated instructions for your specific framework.

### 4. Validate Installation
\`\`\`
validate_installation(
  domain: "yourdomain.com",
  websiteId: "your-website-id",
  useProxy: true
)
\`\`\`

### 5. Set Up Goals & Revenue Tracking
\`\`\`
create_goal(
  visitorId: "visitor-id-from-cookies",
  name: "newsletter_signup"
)

track_payment(
  visitorId: "visitor-id-from-cookies",
  amount: 29.99,
  currency: "USD",
  transactionId: "unique-transaction-id"
)
\`\`\`

## Common Issues & Solutions

### Ad Blockers Blocking Tracking
**Solution:** Use proxy setup with \`useProxy: true\`

### Missing Website ID
**Solution:** Get it from https://datafa.st/dashboard

### No Data in Dashboard
**Solution:** 
1. Wait 5-10 minutes after setup
2. Check browser network tab for requests
3. Verify script placement and syntax

### Revenue Attribution Not Working
**Solution:**
1. Ensure visitor has pageviews before payment tracking
2. Use correct visitor ID from cookies
3. Verify API key permissions

## Framework Support
- Next.js ✅
- Vue.js ✅  
- React ✅
- Angular ✅
- Laravel ✅
- Django ✅
- Astro ✅
- SvelteKit ✅
- Nuxt.js ✅
- Vanilla HTML ✅

## Need Help?
1. Use the validation tool to troubleshoot
2. Check network requests in browser DevTools
3. Verify settings in DataFa.st dashboard
`;
        
        return {
          contents: [{
            uri: "setup://datafast/onboarding",
            mimeType: "text/markdown",
            text: guide
          }]
        };
      }
    );
  }

  private generateFrameworkGuide(framework: FrameworkType, config: FrameworkConfig): string {
    const guide = `# ${config.name} + DataFa.st Setup Guide

## Installation Steps

### 1. Get Your Website ID
Visit [DataFa.st Dashboard](https://datafa.st/dashboard) and copy your Website ID.

### 2. Add Tracking Script
${config.installInstructions}

**Script Template:**
\`\`\`${framework === 'nextjs' || framework === 'nuxt' ? 'javascript' : 'html'}
${config.scriptTemplate.replace('{WEBSITE_ID}', 'your-website-id').replace('{DOMAIN}', 'yourdomain.com').replace('{SCRIPT_SRC}', 'https://datafa.st/js/script.js')}
\`\`\`

### 3. Proxy Setup (Recommended)
Avoid ad blocker issues by proxying through your domain:

${config.proxyTemplate ? `\`\`\`javascript\n${config.proxyTemplate}\n\`\`\`` : 'Manual proxy configuration required for this framework.'}

### 4. Validation
After setup, test your installation:
1. Open browser DevTools → Network tab
2. Visit your website
3. Look for requests to datafa.st or your proxy endpoints
4. Check DataFa.st dashboard for real-time data

## Goals & Revenue Tracking

### Track Custom Goals

**Get Visitor ID from Browser:**
1. Open DevTools → Application tab → Cookies
2. Find \`datafast_visitor_id\` cookie (domain-scoped)
3. Copy the visitor ID value

**JavaScript Example:**
\`\`\`javascript
// Get visitor ID from cookies
const visitorId = document.cookie
  .split('; ')
  .find(row => row.startsWith('datafast_visitor_id='))
  ?.split('=')[1];

// Track goal via API
fetch('/api/datafast-goal', {
  method: 'POST',
  body: JSON.stringify({
    visitorId,
    name: 'newsletter_signup',
    metadata: { source: 'homepage' }
  })
});
\`\`\`

**Using MCP Tools:**
\`\`\`
create_goal(visitorId: "your-visitor-id-from-cookies", name: "newsletter_signup")
\`\`\`

### Track Revenue
\`\`\`javascript
// Track payment for revenue attribution
fetch('/api/datafast-payment', {
  method: 'POST',
  body: JSON.stringify({
    visitorId,
    amount: 29.99,
    currency: 'USD',
    transactionId: 'txn_123',
    email: 'customer@example.com'
  })
});
\`\`\`

## Framework-Specific Tips

${this.getFrameworkSpecificTips(framework)}

## Troubleshooting

### Common Issues
1. **Script not loading**: Check script placement and syntax
2. **No data in dashboard**: Wait 5-10 minutes, check network requests
3. **Ad blocker interference**: Use proxy setup
4. **CORS errors**: Verify domain settings in dashboard

### Support
- [DataFa.st Documentation](https://datafa.st/docs)
- [Dashboard](https://datafa.st/dashboard)
- Check browser console for errors
`;

    return guide;
  }

  private getFrameworkSpecificTips(framework: FrameworkType): string {
    const tips: Record<FrameworkType, string> = {
      nextjs: `
- Use \`next/script\` component for optimal loading
- Add to \`_app.js\` or root layout for all pages
- Proxy configuration goes in \`next.config.js\`
- Works with both App Router and Pages Router`,
      vue: `
- Add to \`public/index.html\` for global tracking
- Or use in main component with \`v-html\`
- Proxy config in \`vue.config.js\` for development
- Use environment variables for different domains`,
      react: `
- Add to \`public/index.html\` in the \`<head>\` section
- For SPA routing, ensure script runs on route changes
- Consider using React Helmet for dynamic insertion`,
      angular: `
- Add to \`src/index.html\` in the \`<head>\` section
- For Angular Universal (SSR), ensure script runs client-side only
- Use Angular environment files for different configurations`,
      laravel: `
- Add to main Blade layout (e.g., \`app.blade.php\`)
- Use Laravel's \`asset()\` helper for local assets
- Consider using environment variables for website ID
- Works with Livewire and Inertia.js`,
      django: `
- Add to base template (e.g., \`base.html\`)
- Use Django's \`static\` template tag for local assets
- Consider using settings.py for configuration
- Works with Django channels and HTMX`,
      astro: `
- Add to Layout component in \`<head>\` section
- Works with both SSG and SSR modes
- Use Astro's client-side hydration if needed`,
      svelte: `
- Add to \`src/app.html\` in the \`<head>\` section
- For SvelteKit, ensure script runs on all routes
- Use \`$env\` for environment-specific configuration`,
      nuxt: `
- Add to \`nuxt.config.js\` in the \`head.script\` array
- Use \`@nuxtjs/google-analytics\` pattern for organization
- Works with both SSR and SPA modes
- Use runtime config for environment variables`,
      vanilla: `
- Add directly to HTML \`<head>\` section
- Ensure script loads on all pages
- Use JavaScript to dynamically track events
- Consider using a tag manager for easier management`
    };

    return tips[framework] || 'No specific tips available for this framework.';
  }
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    // Extract API key from query parameters
    const apiKey = url.searchParams.get("api_key");
    if (!apiKey) {
      return new Response(
        "DataFast API key is required. Please provide it as a query parameter: ?api_key=your_api_key",
        {
          status: 401,
        }
      );
    }

    // Store API key in context props for the MCP agent to use
    ctx.props = {
      apiKey: apiKey,
    };

    if (url.pathname === "/sse" || url.pathname === "/sse/message") {
      return DataFastMCP.serveSSE("/sse").fetch(request, env, ctx);
    }

    if (url.pathname === "/mcp") {
      return DataFastMCP.serve("/mcp").fetch(request, env, ctx);
    }

    return new Response("Not found", { status: 404 });
  },
};
