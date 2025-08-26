import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Define our MCP agent with DataFast API tools
type State = {};
type Props = {
  apiKey: string;
};

export class DataFastMCP extends McpAgent<Env, State, Props> {
  server = new McpServer({
    name: "DataFast Analytics API",
    version: "1.0.0",
  });

  async init() {
    // Create a payment tool
    this.server.tool(
      "create_payment",
      {
        amount: z
          .number()
          .describe(
            "Payment amount (e.g., 29.99 for $29.99, 0 for free trials)"
          ),
        currency: z.string().describe('Currency code like "USD", "EUR", "GBP"'),
        transaction_id: z
          .string()
          .describe("Unique transaction ID from your payment provider"),
        datafast_visitor_id: z
          .string()
          .describe("DataFast visitor ID from browser cookies"),
        email: z.string().optional().describe("Customer email"),
        name: z.string().optional().describe("Customer name"),
        customer_id: z
          .string()
          .optional()
          .describe("Customer ID from your payment provider"),
        renewal: z
          .boolean()
          .optional()
          .default(false)
          .describe("Set to true if it's a recurring payment"),
        refunded: z
          .boolean()
          .optional()
          .default(false)
          .describe("Set to true if it's a refunded payment"),
        timestamp: z
          .string()
          .optional()
          .describe("Payment timestamp (defaults to now)"),
      },
      async (params) => {
        try {
          const apiKey = this.props.apiKey;

          const response = await fetch("https://datafa.st/api/v1/payments", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              amount: params.amount,
              currency: params.currency,
              transaction_id: params.transaction_id,
              datafast_visitor_id: params.datafast_visitor_id,
              ...(params.email && { email: params.email }),
              ...(params.name && { name: params.name }),
              ...(params.customer_id && { customer_id: params.customer_id }),
              ...(params.renewal !== undefined && { renewal: params.renewal }),
              ...(params.refunded !== undefined && {
                refunded: params.refunded,
              }),
              ...(params.timestamp && { timestamp: params.timestamp }),
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
                  text: `Error ${response.status}: ${
                    errorData.error?.message || response.statusText
                  }`,
                },
              ],
              isError: true,
            };
          }

          const result = (await response.json()) as {
            message: string;
            transaction_id: string;
          };
          return {
            content: [
              {
                type: "text",
                text: `✅ Payment recorded successfully!\nMessage: ${result.message}\nTransaction ID: ${result.transaction_id}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Network error: ${
                  error instanceof Error
                    ? error.message
                    : "Unknown error occurred"
                }`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Create a custom goal tool
    this.server.tool(
      "create_goal",
      {
        datafast_visitor_id: z
          .string()
          .describe("The DataFast unique ID of the visitor"),
        name: z
          .string()
          .describe(
            "Name for the goal (lowercase letters, numbers, underscores, hyphens, max 32 chars)"
          ),
        metadata: z
          .record(z.string())
          .optional()
          .describe(
            "Custom parameters to enrich your event data (max 10 properties, each max 32 chars key, 255 chars value)"
          ),
      },
      async ({ datafast_visitor_id, name, metadata }) => {
        try {
          const apiKey = this.props.apiKey;

          const response = await fetch("https://datafa.st/api/v1/goals", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              datafast_visitor_id,
              name,
              ...(metadata && { metadata }),
            }),
          });

          if (!response.ok) {
            const errorData = (await response.json().catch(() => ({}))) as {
              error?: { message?: string };
            };
            let errorMessage = `Error ${response.status}: ${
              errorData.error?.message || response.statusText
            }`;

            if (response.status === 400) {
              errorMessage +=
                " (Note: This might be because the visitor is detected as a bot or has no prior pageviews)";
            } else if (response.status === 404) {
              errorMessage +=
                " (Note: This might be because the visitor has no prior pageviews)";
            }

            return {
              content: [
                {
                  type: "text",
                  text: errorMessage,
                },
              ],
              isError: true,
            };
          }

          const result = (await response.json()) as {
            message: string;
            event_id?: string;
          };
          return {
            content: [
              {
                type: "text",
                text: `✅ Goal created successfully!\nMessage: ${
                  result.message
                }\nEvent ID: ${result.event_id || "N/A"}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Network error: ${
                  error instanceof Error
                    ? error.message
                    : "Unknown error occurred"
                }`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Get visitor data tool
    this.server.tool(
      "get_visitor_data",
      {
        datafast_visitor_id: z
          .string()
          .describe("The DataFast visitor ID to retrieve data for"),
      },
      async ({ datafast_visitor_id }) => {
        try {
          const apiKey = this.props.apiKey;

          const response = await fetch(
            `https://datafa.st/api/v1/visitors/${datafast_visitor_id}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            const errorData = (await response.json().catch(() => ({}))) as {
              error?: { message?: string };
            };
            let errorMessage = `Error ${response.status}: ${
              errorData.error?.message || response.statusText
            }`;

            if (response.status === 400) {
              errorMessage +=
                " (Note: This might be because the visitor is detected as a bot)";
            }

            return {
              content: [
                {
                  type: "text",
                  text: errorMessage,
                },
              ],
              isError: true,
            };
          }

          const result = (await response.json()) as {
            status: string;
            data?: {
              visitorId: string;
              identity?: any;
              activity?: any;
              prediction?: any;
            };
          };

          if (result.status === "success" && result.data) {
            const visitor = result.data;
            let visitorInfo = `📊 Visitor Data for ID: ${visitor.visitorId}\n\n`;

            // Identity information
            if (visitor.identity) {
              visitorInfo += `🌍 Location: ${visitor.identity.city}, ${visitor.identity.country} (${visitor.identity.countryCode})\n`;
              visitorInfo += `🖥️ Device: ${visitor.identity.device.type} - ${visitor.identity.browser.name} ${visitor.identity.browser.version} on ${visitor.identity.os.name}\n`;
              visitorInfo += `📐 Viewport: ${visitor.identity.viewport.width}x${visitor.identity.viewport.height}\n`;

              if (visitor.identity.params) {
                const params = visitor.identity.params;
                const trafficSource =
                  params.ref || params.utm_source || "Direct";
                visitorInfo += `🔗 Traffic Source: ${trafficSource}\n`;
              }
            }

            // Activity information
            if (visitor.activity) {
              const activity = visitor.activity;
              visitorInfo += `\n📈 Activity:\n`;
              visitorInfo += `   • Visits: ${activity.visitCount}\n`;
              visitorInfo += `   • Pageviews: ${activity.pageViewCount}\n`;
              visitorInfo += `   • First visit: ${new Date(
                activity.firstVisitAt
              ).toLocaleString()}\n`;
              visitorInfo += `   • Time since first visit: ${Math.round(
                activity.timeSinceFirstVisit / (1000 * 60 * 60 * 24)
              )} days\n`;
              visitorInfo += `   • Current URL: ${activity.currentUrl}\n`;

              if (
                activity.completedCustomGoals &&
                activity.completedCustomGoals.length > 0
              ) {
                visitorInfo += `   • Completed goals: ${activity.completedCustomGoals
                  .map((g: { name: string }) => g.name)
                  .join(", ")}\n`;
              }
            }

            // Prediction information
            if (visitor.prediction) {
              const prediction = visitor.prediction;
              visitorInfo += `\n🎯 Prediction:\n`;
              visitorInfo += `   • Conversion score: ${prediction.score}/100\n`;
              visitorInfo += `   • Conversion rate: ${(
                prediction.conversionRate * 100
              ).toFixed(2)}%\n`;
              visitorInfo += `   • Expected value: $${prediction.expectedValue.toFixed(
                2
              )}\n`;
              visitorInfo += `   • Confidence: ${(
                prediction.confidence * 100
              ).toFixed(1)}%\n`;
            } else {
              visitorInfo += `\n🎯 Prediction: Not available (visitor might be a customer or revenue attribution isn't set up)\n`;
            }

            return {
              content: [
                {
                  type: "text",
                  text: visitorInfo,
                },
              ],
            };
          } else {
            return {
              content: [
                {
                  type: "text",
                  text: "Unexpected response format from DataFast API",
                },
              ],
            };
          }
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Network error: ${
                  error instanceof Error
                    ? error.message
                    : "Unknown error occurred"
                }`,
              },
            ],
            isError: true,
          };
        }
      }
    );
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
