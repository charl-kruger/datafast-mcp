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

    // Add batch operations tool
    this.server.tool(
      "batch_create_goals",
      {
        goals: z
          .array(
            z.object({
              datafast_visitor_id: z
                .string()
                .describe("The DataFast unique ID of the visitor"),
              name: z.string().describe("Name for the goal"),
              metadata: z
                .record(z.string())
                .optional()
                .describe("Custom parameters for the goal"),
            })
          )
          .describe("Array of goals to create"),
      },
      async ({ goals }) => {
        try {
          const apiKey = this.props.apiKey;
          const results = [];

          for (const goal of goals) {
            try {
              const response = await fetch("https://datafa.st/api/v1/goals", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  datafast_visitor_id: goal.datafast_visitor_id,
                  name: goal.name,
                  ...(goal.metadata && { metadata: goal.metadata }),
                }),
              });

              if (response.ok) {
                const result = (await response.json()) as {
                  message: string;
                  event_id?: string;
                };
                results.push({
                  goal: goal.name,
                  visitor: goal.datafast_visitor_id,
                  success: true,
                  message: result.message,
                  event_id: result.event_id,
                });
              } else {
                const errorData = (await response.json().catch(() => ({}))) as {
                  error?: { message?: string };
                };
                results.push({
                  goal: goal.name,
                  visitor: goal.datafast_visitor_id,
                  success: false,
                  error: errorData.error?.message || response.statusText,
                });
              }
            } catch (error) {
              results.push({
                goal: goal.name,
                visitor: goal.datafast_visitor_id,
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
              });
            }
          }

          const successCount = results.filter((r) => r.success).length;
          const failureCount = results.filter((r) => !r.success).length;

          let summary = `✅ Batch goal creation completed!\n`;
          summary += `   • Successful: ${successCount}\n`;
          summary += `   • Failed: ${failureCount}\n\n`;

          summary += `📋 Results:\n`;
          results.forEach((result) => {
            if (result.success) {
              summary += `   ✅ ${result.goal} for ${result.visitor}: ${result.message}\n`;
            } else {
              summary += `   ❌ ${result.goal} for ${result.visitor}: ${result.error}\n`;
            }
          });

          return {
            content: [
              {
                type: "text",
                text: summary,
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

    // Add visitor validation tool
    this.server.tool(
      "validate_visitor",
      {
        datafast_visitor_id: z
          .string()
          .describe("The DataFast visitor ID to validate"),
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

          if (response.ok) {
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
              return {
                content: [
                  {
                    type: "text",
                    text: `✅ Visitor ID "${datafast_visitor_id}" is valid and has data available.`,
                  },
                ],
              };
            } else {
              return {
                content: [
                  {
                    type: "text",
                    text: `❌ Visitor ID "${datafast_visitor_id}" returned unexpected response format.`,
                  },
                ],
                isError: true,
              };
            }
          } else {
            const errorData = (await response.json().catch(() => ({}))) as {
              error?: { message?: string };
            };
            let errorMessage = `❌ Visitor ID "${datafast_visitor_id}" is invalid: `;

            if (response.status === 400) {
              errorMessage += "Detected as bot or invalid format";
            } else if (response.status === 404) {
              errorMessage +=
                "No pageviews found - visitor needs to visit your site first";
            } else {
              errorMessage += errorData.error?.message || response.statusText;
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
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Network error validating visitor "${datafast_visitor_id}": ${
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

    // Add goal tracking with revenue
    this.server.tool(
      "create_revenue_goal",
      {
        datafast_visitor_id: z
          .string()
          .describe("The DataFast unique ID of the visitor"),
        goal_name: z.string().describe("Name for the goal"),
        revenue_amount: z
          .number()
          .describe("Revenue amount associated with this goal"),
        currency: z
          .string()
          .default("USD")
          .describe("Currency code for the revenue"),
        metadata: z
          .record(z.string())
          .optional()
          .describe("Additional custom parameters"),
      },
      async ({
        datafast_visitor_id,
        goal_name,
        revenue_amount,
        currency,
        metadata,
      }) => {
        try {
          const apiKey = this.props.apiKey;

          // First create the goal
          const goalResponse = await fetch("https://datafa.st/api/v1/goals", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              datafast_visitor_id,
              name: goal_name,
              metadata: {
                revenue_amount: revenue_amount.toString(),
                currency,
                ...metadata,
              },
            }),
          });

          if (!goalResponse.ok) {
            const errorData = (await goalResponse.json().catch(() => ({}))) as {
              error?: { message?: string };
            };
            let errorMessage = `Error ${goalResponse.status}: ${
              errorData.error?.message || goalResponse.statusText
            }`;

            if (goalResponse.status === 400) {
              errorMessage +=
                " (Note: This might be because the visitor is detected as a bot or has no prior pageviews)";
            } else if (goalResponse.status === 404) {
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

          const goalResult = (await goalResponse.json()) as {
            message: string;
            event_id?: string;
          };

          // Then create a payment record for the revenue
          const paymentResponse = await fetch(
            "https://datafa.st/api/v1/payments",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                amount: revenue_amount,
                currency: currency,
                transaction_id: `goal_${goal_name}_${Date.now()}`, // Generate unique ID
                datafast_visitor_id: datafast_visitor_id,
                renewal: false,
                refunded: false,
              }),
            }
          );

          let paymentMessage = "";
          if (paymentResponse.ok) {
            const paymentResult = (await paymentResponse.json()) as {
              message: string;
              transaction_id: string;
            };
            paymentMessage = `\n💰 Revenue tracked: ${paymentResult.message}`;
          } else {
            paymentMessage = `\n⚠️ Goal created but revenue tracking failed`;
          }

          return {
            content: [
              {
                type: "text",
                text: `✅ Revenue goal created successfully!\n🎯 Goal: ${goalResult.message}\n${paymentMessage}`,
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

    // Add analytics summary tool
    this.server.tool(
      "get_analytics_summary",
      {
        datafast_visitor_id: z
          .string()
          .describe("The DataFast visitor ID to analyze"),
        include_prediction: z
          .boolean()
          .default(true)
          .describe("Whether to include conversion predictions"),
      },
      async ({ datafast_visitor_id, include_prediction }) => {
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
            let summary = `📊 Quick Analytics for Visitor ${visitor.visitorId}\n\n`;

            // Activity summary
            if (visitor.activity) {
              const activity = visitor.activity;
              summary += `📈 Activity Summary:\n`;
              summary += `   • Total visits: ${activity.visitCount}\n`;
              summary += `   • Pageviews: ${activity.pageViewCount}\n`;
              summary += `   • First visit: ${new Date(
                activity.firstVisitAt
              ).toLocaleDateString()}\n`;

              if (activity.timeSinceFirstVisit) {
                const days = Math.round(
                  activity.timeSinceFirstVisit / (1000 * 60 * 60 * 24)
                );
                summary += `   • Customer age: ${days} days\n`;
              }

              if (
                activity.completedCustomGoals &&
                activity.completedCustomGoals.length > 0
              ) {
                summary += `   • Completed goals: ${activity.completedCustomGoals.length}\n`;
              }
            }

            // Prediction summary (if requested and available)
            if (include_prediction && visitor.prediction) {
              const prediction = visitor.prediction;
              summary += `\n🎯 Conversion Prediction:\n`;
              summary += `   • Score: ${prediction.score}/100 (${
                prediction.score >= 50 ? "High" : "Low"
              } potential)\n`;

              if (prediction.expectedValue) {
                summary += `   • Expected value: $${prediction.expectedValue.toFixed(
                  2
                )}\n`;
              }

              if (prediction.confidence) {
                summary += `   • Confidence: ${(
                  prediction.confidence * 100
                ).toFixed(1)}%\n`;
              }
            }

            // Traffic source
            if (visitor.identity && visitor.identity.params) {
              const params = visitor.identity.params;
              const source = params.ref || params.utm_source || "Direct";
              summary += `\n🔗 Traffic Source: ${source}\n`;
            }

            // Location
            if (visitor.identity) {
              const identity = visitor.identity;
              if (identity.city && identity.country) {
                summary += `\n🌍 Location: ${identity.city}, ${identity.country}\n`;
              }
            }

            return {
              content: [
                {
                  type: "text",
                  text: summary,
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

    // IMPLEMENTATION HELPER TOOLS

    // Generate browser tracking code
    this.server.tool(
      "generate_tracking_code",
      {
        framework: z
          .enum(["vanilla", "react", "vue", "angular", "nextjs", "nuxt"])
          .describe("The framework to generate code for"),
        features: z
          .array(z.enum(["visitor_id", "goals", "payments", "events"]))
          .default(["visitor_id"])
          .describe("Features to include in the tracking code"),
        include_comments: z
          .boolean()
          .default(true)
          .describe("Whether to include explanatory comments"),
      },
      async ({ framework, features, include_comments }) => {
        const comments = include_comments;

        let code = "";

        if (framework === "vanilla") {
          code = `// DataFast Browser Tracking Code
${comments ? "// 1. Include the DataFast script in your HTML head" : ""}
<script src="https://datafa.st/js/script.js" data-website-id="YOUR_WEBSITE_ID"></script>

${comments ? "// 2. Get visitor ID and track events" : ""}
<script>
  // Get visitor ID after DataFast loads
  window.addEventListener('datafast:ready', function() {
    const visitorId = window.datafast?.getVisitorId();
    console.log('DataFast Visitor ID:', visitorId);

    // Store for later use (e.g., in forms, purchases)
    window.datafastVisitorId = visitorId;
  });

  // Track custom goals
  function trackGoal(goalName, metadata = {}) {
    if (window.datafast?.trackGoal) {
      window.datafast.trackGoal(goalName, metadata);
    }
  }

  // Track payments
  function trackPayment(amount, currency, transactionId, metadata = {}) {
    // Send to your server for processing
    fetch('/api/track-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        currency,
        transaction_id: transactionId,
        datafast_visitor_id: window.datafastVisitorId,
        ...metadata
      })
    });
  }
</script>`;
        } else if (framework === "react") {
          code = `// DataFast React Integration
import { useEffect, useState } from 'react';

${comments ? "// 1. DataFast Hook" : ""}
export const useDataFast = () => {
  const [visitorId, setVisitorId] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const handleReady = () => {
      const id = window.datafast?.getVisitorId();
      setVisitorId(id);
      setIsLoaded(true);
    };

    // Check if already loaded
    if (window.datafast) {
      handleReady();
    } else {
      window.addEventListener('datafast:ready', handleReady);
    }

    return () => window.removeEventListener('datafast:ready', handleReady);
  }, []);

  const trackGoal = (name, metadata = {}) => {
    if (window.datafast?.trackGoal) {
      window.datafast.trackGoal(name, metadata);
    }
  };

  const trackPayment = async (amount, currency, transactionId, metadata = {}) => {
    try {
      const response = await fetch('/api/track-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          transaction_id: transactionId,
          datafast_visitor_id: visitorId,
          ...metadata
        })
      });
      return response.json();
    } catch (error) {
      console.error('Payment tracking failed:', error);
    }
  };

  return { visitorId, isLoaded, trackGoal, trackPayment };
};

${comments ? "// 2. Usage in components" : ""}
// Example usage in a purchase component
const PurchaseComponent = () => {
  const { visitorId, trackPayment } = useDataFast();

  const handlePurchase = async (product) => {
    // Track the payment
    await trackPayment(product.price, 'USD', product.id, {
      product_name: product.name,
      category: product.category
    });

    // Track goal
    window.datafast?.trackGoal('purchase_completed', {
      product_id: product.id,
      amount: product.price
    });
  };

  return (
    <div>
      <button onClick={() => handlePurchase({ id: 'prod_1', name: 'Premium Plan', price: 29.99, category: 'subscription' })}>
        Purchase Premium Plan
      </button>
    </div>
  );
};`;
        } else if (framework === "vue") {
          code = `// DataFast Vue Integration
import { ref, onMounted, onUnmounted } from 'vue';

${comments ? "// 1. DataFast Composable" : ""}
export const useDataFast = () => {
  const visitorId = ref(null);
  const isLoaded = ref(false);

  const trackGoal = (name, metadata = {}) => {
    if (window.datafast?.trackGoal) {
      window.datafast.trackGoal(name, metadata);
    }
  };

  const trackPayment = async (amount, currency, transactionId, metadata = {}) => {
    try {
      const response = await fetch('/api/track-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          transaction_id: transactionId,
          datafast_visitor_id: visitorId.value,
          ...metadata
        })
      });
      return response.json();
    } catch (error) {
      console.error('Payment tracking failed:', error);
    }
  };

  onMounted(() => {
    const handleReady = () => {
      visitorId.value = window.datafast?.getVisitorId();
      isLoaded.value = true;
    };

    if (window.datafast) {
      handleReady();
    } else {
      window.addEventListener('datafast:ready', handleReady);
    }
  });

  onUnmounted(() => {
    window.removeEventListener('datafast:ready', handleReady);
  });

  return { visitorId, isLoaded, trackGoal, trackPayment };
};

${comments ? "// 2. Usage in components" : ""}
// Example usage in a Vue component
<template>
  <div>
    <button @click="handlePurchase" :disabled="!isLoaded">
      Purchase Premium Plan
    </button>
    <p v-if="visitorId">Visitor ID: {{ visitorId }}</p>
  </div>
</template>

<script setup>
import { useDataFast } from '@/composables/useDataFast';

const { visitorId, isLoaded, trackPayment } = useDataFast();

const handlePurchase = async () => {
  await trackPayment(29.99, 'USD', 'tx_123', {
    product_name: 'Premium Plan',
    category: 'subscription'
  });

  window.datafast?.trackGoal('purchase_completed', {
    amount: 29.99,
    product: 'premium_plan'
  });
};
</script>`;
        } else if (framework === "nextjs") {
          code = `// DataFast Next.js Integration

${comments ? "// 1. pages/_app.js or app/layout.js" : ""}
import Script from 'next/script';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Script
        src="https://datafa.st/js/script.js"
        data-website-id="YOUR_WEBSITE_ID"
        strategy="afterInteractive"
      />
      <Component {...pageProps} />
    </>
  );
}

${comments ? "// 2. API Route for tracking payments" : ""}
// pages/api/track-payment.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency, transaction_id, datafast_visitor_id, ...metadata } = req.body;

    // Call DataFast API
    const response = await fetch('https://datafa.st/api/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${process.env.DATAFAST_API_KEY}\`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        transaction_id,
        datafast_visitor_id,
        ...metadata
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'Payment tracking failed');
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Payment tracking error:', error);
    res.status(500).json({ error: error.message });
  }
}

${comments ? "// 3. Client-side tracking hook" : ""}
// hooks/useDataFast.js
import { useEffect, useState } from 'react';

export const useDataFast = () => {
  const [visitorId, setVisitorId] = useState(null);

  useEffect(() => {
    const handleReady = () => {
      const id = window.datafast?.getVisitorId();
      setVisitorId(id);
    };

    if (window.datafast) {
      handleReady();
    } else {
      window.addEventListener('datafast:ready', handleReady);
    }

    return () => window.removeEventListener('datafast:ready', handleReady);
  }, []);

  const trackGoal = (name, metadata = {}) => {
    if (window.datafast?.trackGoal) {
      window.datafast.trackGoal(name, metadata);
    }
  };

  const trackPayment = async (amount, currency, transactionId, metadata = {}) => {
    try {
      const response = await fetch('/api/track-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          transaction_id: transactionId,
          datafast_visitor_id: visitorId,
          ...metadata
        })
      });
      return response.json();
    } catch (error) {
      console.error('Payment tracking failed:', error);
    }
  };

  return { visitorId, trackGoal, trackPayment };
};

${comments ? "// 4. Usage in components" : ""}
// components/PurchaseButton.js
import { useDataFast } from '../hooks/useDataFast';

export default function PurchaseButton({ product }) {
  const { visitorId, trackPayment } = useDataFast();

  const handlePurchase = async () => {
    const result = await trackPayment(
      product.price,
      'USD',
      \`order_\${Date.now()}\`,
      {
        product_name: product.name,
        category: product.category
      }
    );

    if (result) {
      // Handle success
      console.log('Payment tracked:', result);
    }
  };

  return (
    <button onClick={handlePurchase}>
      Purchase {product.name} - \${product.price}
    </button>
  );
}`;
        } else if (framework === "angular") {
          code = `// DataFast Angular Integration

${comments ? "// 1. DataFast Service" : ""}
// services/datafast.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

declare global {
  interface Window {
    datafast: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class DataFastService {
  private visitorIdSubject = new BehaviorSubject<string | null>(null);
  public visitorId$ = this.visitorIdSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeDataFast();
  }

  private initializeDataFast() {
    const handleReady = () => {
      const visitorId = window.datafast?.getVisitorId();
      this.visitorIdSubject.next(visitorId);
    };

    if (window.datafast) {
      handleReady();
    } else {
      window.addEventListener('datafast:ready', handleReady);
    }
  }

  trackGoal(name: string, metadata: any = {}) {
    if (window.datafast?.trackGoal) {
      window.datafast.trackGoal(name, metadata);
    }
  }

  trackPayment(amount: number, currency: string, transactionId: string, metadata: any = {}): Observable<any> {
    const currentVisitorId = this.visitorIdSubject.value;
    return this.http.post('/api/track-payment', {
      amount,
      currency,
      transaction_id: transactionId,
      datafast_visitor_id: currentVisitorId,
      ...metadata
    });
  }
}

${comments ? "// 2. Add script to index.html" : ""}
<!-- index.html -->
<script src="https://datafa.st/js/script.js" data-website-id="YOUR_WEBSITE_ID"></script>

${comments ? "// 3. Usage in components" : ""}
// purchase.component.ts
import { Component } from '@angular/core';
import { DataFastService } from '../services/datafast.service';

@Component({
  selector: 'app-purchase',
  template: \`
    <div>
      <button (click)="handlePurchase()" [disabled]="!visitorId">
        Purchase Premium Plan
      </button>
      <p *ngIf="visitorId">Visitor ID: {{ visitorId }}</p>
    </div>
  \`
})
export class PurchaseComponent {
  visitorId: string | null = null;

  constructor(private dataFastService: DataFastService) {}

  ngOnInit() {
    this.dataFastService.visitorId$.subscribe(id => {
      this.visitorId = id;
    });
  }

  handlePurchase() {
    this.dataFastService.trackPayment(29.99, 'USD', 'tx_123', {
      product_name: 'Premium Plan',
      category: 'subscription'
    }).subscribe({
      next: (result) => console.log('Payment tracked:', result),
      error: (error) => console.error('Payment tracking failed:', error)
    });

    this.dataFastService.trackGoal('purchase_completed', {
      amount: 29.99,
      product: 'premium_plan'
    });
  }
}`;
        } else if (framework === "nuxt") {
          code = `// DataFast Nuxt Integration

${comments ? "// 1. plugins/datafast.client.js" : ""}
export default defineNuxtPlugin(() => {
  // Add DataFast script
  const script = document.createElement('script');
  script.src = 'https://datafa.st/js/script.js';
  script.setAttribute('data-website-id', 'YOUR_WEBSITE_ID');
  document.head.appendChild(script);
});

${comments ? "// 2. composables/useDataFast.js" : ""}
export const useDataFast = () => {
  const visitorId = ref(null);
  const isLoaded = ref(false);

  onMounted(() => {
    const handleReady = () => {
      visitorId.value = window.datafast?.getVisitorId();
      isLoaded.value = true;
    };

    if (window.datafast) {
      handleReady();
    } else {
      window.addEventListener('datafast:ready', handleReady);
    }
  });

  onUnmounted(() => {
    window.removeEventListener('datafast:ready', handleReady);
  });

  const trackGoal = (name, metadata = {}) => {
    if (window.datafast?.trackGoal) {
      window.datafast.trackGoal(name, metadata);
    }
  };

  const trackPayment = async (amount, currency, transactionId, metadata = {}) => {
    try {
      const response = await $fetch('/api/track-payment', {
        method: 'POST',
        body: {
          amount,
          currency,
          transaction_id: transactionId,
          datafast_visitor_id: visitorId.value,
          ...metadata
        }
      });
      return response;
    } catch (error) {
      console.error('Payment tracking failed:', error);
    }
  };

  return { visitorId, isLoaded, trackGoal, trackPayment };
};

${comments ? "// 3. API route for payment tracking" : ""}
// server/api/track-payment.post.js
export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  try {
    const response = await fetch('https://datafa.st/api/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${process.env.DATAFAST_API_KEY}\`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: result.error?.message || 'Payment tracking failed'
      });
    }

    return result;
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error'
    });
  }
});

${comments ? "// 4. Usage in components" : ""}
// components/PurchaseButton.vue
<template>
  <div>
    <button @click="handlePurchase" :disabled="!isLoaded">
      Purchase Premium Plan - $29.99
    </button>
    <p v-if="visitorId">Visitor ID: {{ visitorId }}</p>
  </div>
</template>

<script setup>
const { visitorId, isLoaded, trackPayment } = useDataFast();

const handlePurchase = async () => {
  const result = await trackPayment(29.99, 'USD', \`order_\${Date.now()}\`, {
    product_name: 'Premium Plan',
    category: 'subscription'
  });

  if (result) {
    console.log('Payment tracked:', result);
  }

  // Track goal
  window.datafast?.trackGoal('purchase_completed', {
    amount: 29.99,
    product: 'premium_plan'
  });
};
</script>`;
        }

        return {
          content: [
            {
              type: "text",
              text: `Here's the ${framework} implementation code for DataFast tracking:\n\n${code}\n\n${
                comments
                  ? "💡 This code includes comprehensive comments explaining each part of the implementation."
                  : ""
              }`,
            },
          ],
        };
      }
    );

    // Generate webhook handler for payment providers
    this.server.tool(
      "generate_webhook_handler",
      {
        provider: z
          .enum(["stripe", "paypal", "lemonsqueezy", "paddle", "custom"])
          .describe("The payment provider to generate webhook handler for"),
        language: z
          .enum(["javascript", "typescript", "python", "php", "go"])
          .default("javascript")
          .describe("The programming language for the webhook handler"),
        features: z
          .array(
            z.enum([
              "payment_tracking",
              "goal_tracking",
              "refund_handling",
              "metadata_extraction",
            ])
          )
          .default(["payment_tracking"])
          .describe("Features to include in the webhook handler"),
      },
      async ({ provider, language, features }) => {
        let code = "";

        if (language === "javascript" || language === "typescript") {
          if (provider === "stripe") {
            code = `// Stripe Webhook Handler for DataFast
import { create_payment, create_goal } from './datafast-api.js';

${
  features.includes("payment_tracking")
    ? `
// Handle successful payments
const handlePaymentSuccess = async (event) => {
  const paymentIntent = event.data.object;

  try {
    // Extract visitor ID from metadata (set during checkout)
    const visitorId = paymentIntent.metadata?.datafast_visitor_id;

    if (!visitorId) {
      console.log('No DataFast visitor ID found in payment metadata');
      return;
    }

    // Track the payment
    await create_payment({
      amount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency.toUpperCase(),
      transaction_id: paymentIntent.id,
      datafast_visitor_id: visitorId,
      email: paymentIntent.receipt_email,
      metadata: {
        payment_method: paymentIntent.payment_method_types?.[0] || 'card',
        provider: 'stripe'
      }
    });

    console.log(\`Payment \${paymentIntent.id} tracked successfully\`);
  } catch (error) {
    console.error('Failed to track payment:', error);
  }
};
`
    : ""
}

${
  features.includes("goal_tracking")
    ? `
// Handle subscription creation (track as goal)
const handleSubscriptionCreated = async (event) => {
  const subscription = event.data.object;

  try {
    const visitorId = subscription.metadata?.datafast_visitor_id;

    if (!visitorId) {
      console.log('No DataFast visitor ID found in subscription metadata');
      return;
    }

    // Create goal for subscription
    await create_goal({
      datafast_visitor_id: visitorId,
      name: 'subscription_started',
      metadata: {
        subscription_id: subscription.id,
        plan_id: subscription.items.data[0]?.price?.id,
        provider: 'stripe'
      }
    });

    console.log(\`Subscription \${subscription.id} goal created\`);
  } catch (error) {
    console.error('Failed to create subscription goal:', error);
  }
};
`
    : ""
}

${
  features.includes("refund_handling")
    ? `
// Handle refunds
const handleRefund = async (event) => {
  const refund = event.data.object;

  try {
    // Find original payment to get visitor ID
    // This would require storing payment mappings or querying Stripe
    const visitorId = await findVisitorIdByPaymentId(refund.payment_intent);

    if (!visitorId) {
      console.log('Could not find visitor ID for refund:', refund.id);
      return;
    }

    // Track refund as payment with negative amount
    await create_payment({
      amount: -(refund.amount / 100),
      currency: refund.currency.toUpperCase(),
      transaction_id: refund.id,
      datafast_visitor_id: visitorId,
      refunded: true,
      metadata: {
        original_payment: refund.payment_intent,
        provider: 'stripe'
      }
    });

    console.log(\`Refund \${refund.id} tracked\`);
  } catch (error) {
    console.error('Failed to track refund:', error);
  }
};
`
    : ""
}

// Main webhook handler
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event);
        break;
      case 'charge.refunded':
        await handleRefund(event);
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(\`Webhook Error: \${error.message}\`);
  }
};

// Express route
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);`;
          } else if (provider === "lemonsqueezy") {
            code = `// LemonSqueezy Webhook Handler for DataFast
import { create_payment, create_goal } from './datafast-api.js';

${
  features.includes("payment_tracking")
    ? `
// Handle successful orders
const handleOrderCreated = async (payload) => {
  const order = payload.data;

  try {
    // Extract custom data (visitor ID should be stored here)
    const visitorId = order.attributes.custom_data?.datafast_visitor_id;

    if (!visitorId) {
      console.log('No DataFast visitor ID found in order custom data');
      return;
    }

    // Track the payment
    await create_payment({
      amount: parseFloat(order.attributes.total),
      currency: order.attributes.currency.toUpperCase(),
      transaction_id: order.attributes.identifier,
      datafast_visitor_id: visitorId,
      email: order.attributes.user_email,
      metadata: {
        product_name: order.attributes.first_order_item?.product_name,
        provider: 'lemonsqueezy',
        order_id: order.id
      }
    });

    console.log(\`Order \${order.attributes.identifier} tracked successfully\`);
  } catch (error) {
    console.error('Failed to track order:', error);
  }
};
`
    : ""
}

${
  features.includes("goal_tracking")
    ? `
// Handle subscription creation
const handleSubscriptionCreated = async (payload) => {
  const subscription = payload.data;

  try {
    const visitorId = subscription.attributes.custom_data?.datafast_visitor_id;

    if (!visitorId) {
      console.log('No DataFast visitor ID found in subscription');
      return;
    }

    await create_goal({
      datafast_visitor_id: visitorId,
      name: 'subscription_started',
      metadata: {
        subscription_id: subscription.id,
        product_name: subscription.attributes.product_name,
        provider: 'lemonsqueezy'
      }
    });

    console.log(\`Subscription \${subscription.id} goal created\`);
  } catch (error) {
    console.error('Failed to create subscription goal:', error);
  }
};
`
    : ""
}

// Main webhook handler
export const handleLemonSqueezyWebhook = async (req, res) => {
  try {
    const payload = req.body;

    // Verify webhook signature (implement based on LemonSqueezy docs)
    // const isValid = verifyWebhookSignature(req, payload);
    // if (!isValid) {
    //   return res.status(401).json({ error: 'Invalid signature' });
    // }

    const eventName = payload.meta?.event_name;

    switch (eventName) {
      case 'order_created':
        await handleOrderCreated(payload);
        break;
      case 'subscription_created':
        await handleSubscriptionCreated(payload);
        break;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
};

// Express route
app.post('/api/webhooks/lemonsqueezy', express.json(), handleLemonSqueezyWebhook);`;
          } else {
            code = `// Generic Webhook Handler Template
import { create_payment, create_goal } from './datafast-api.js';

export const handleGenericWebhook = async (req, res) => {
  try {
    const payload = req.body;

    // Extract data based on your provider's webhook format
    const {
      amount,
      currency,
      transaction_id,
      visitor_id,
      email,
      event_type,
      metadata = {}
    } = extractWebhookData(payload);

    if (!visitor_id) {
      console.log('No visitor ID found in webhook payload');
      return res.status(400).json({ error: 'Missing visitor ID' });
    }

    if (event_type === 'payment_success' || event_type === 'order_completed') {
      await create_payment({
        amount: parseFloat(amount),
        currency: currency.toUpperCase(),
        transaction_id: transaction_id,
        datafast_visitor_id: visitor_id,
        email: email,
        metadata: {
          ...metadata,
          provider: 'custom'
        }
      });
    } else if (event_type === 'subscription_created') {
      await create_goal({
        datafast_visitor_id: visitor_id,
        name: 'subscription_started',
        metadata: {
          ...metadata,
          provider: 'custom'
        }
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to extract data from webhook payload
function extractWebhookData(payload) {
  // Customize this based on your payment provider's webhook format
  return {
    amount: payload.amount || payload.total || 0,
    currency: payload.currency || 'USD',
    transaction_id: payload.id || payload.transaction_id,
    visitor_id: payload.metadata?.datafast_visitor_id || payload.custom_data?.visitor_id,
    email: payload.customer_email || payload.user_email,
    event_type: payload.event_type || payload.type,
    metadata: payload.metadata || {}
  };
}`;
          }
        }

        return {
          content: [
            {
              type: "text",
              text: `Here's the ${provider} webhook handler in ${language}:\n\n${code}\n\n💡 This webhook handler will automatically track payments and goals with DataFast when events occur in your payment provider.`,
            },
          ],
        };
      }
    );

    // Generate configuration templates
    this.server.tool(
      "generate_config_template",
      {
        environment: z
          .enum(["development", "staging", "production"])
          .describe("The environment for the configuration"),
        platform: z
          .enum(["web", "mobile", "server", "lambda"])
          .describe("The platform type"),
        features: z
          .array(
            z.enum(["tracking", "goals", "payments", "analytics", "debugging"])
          )
          .default(["tracking", "goals", "payments"])
          .describe("Features to configure"),
      },
      async ({ environment, platform, features }) => {
        let config = "";

        if (platform === "web") {
          config = `// DataFast Web Configuration - ${environment}

export const DATAFAST_CONFIG = {
  // Core settings
  websiteId: '${
    environment === "production"
      ? "YOUR_PRODUCTION_WEBSITE_ID"
      : "YOUR_DEV_WEBSITE_ID"
  }',
  apiUrl: 'https://datafa.st/api/v1',
  scriptUrl: 'https://datafa.st/js/script.js',

  // Environment settings
  environment: '${environment}',
  debug: ${environment !== "production"},

  // Feature flags
  features: {
    tracking: ${features.includes("tracking")},
    goals: ${features.includes("goals")},
    payments: ${features.includes("payments")},
    analytics: ${features.includes("analytics")},
    debugging: ${features.includes("debugging")},
  },

  // Tracking settings
  tracking: {
    autoTrack: true,
    trackPageViews: true,
    trackClicks: false,
    trackScroll: false,
    trackTimeOnPage: true,
  },

  // Goal settings
  goals: {
    autoTrack: ${features.includes("goals")},
    customGoals: [
      'newsletter_signup',
      'account_created',
      'purchase_completed',
      'subscription_started',
    ],
  },

  // Payment settings
  payments: {
    autoTrack: ${features.includes("payments")},
    providers: ['stripe', 'paypal', 'lemonsqueezy'],
    trackRefunds: true,
  },

  // Analytics settings
  analytics: {
    enabled: ${features.includes("analytics")},
    trackPerformance: true,
    trackErrors: ${features.includes("debugging")},
    customEvents: [],
  },

  // Privacy settings
  privacy: {
    respectDNT: true,
    anonymizeIP: false,
    cookieConsent: false,
  },
};

// Initialize DataFast
export const initializeDataFast = () => {
  if (typeof window === 'undefined') return;

  // Add script to page
  const script = document.createElement('script');
  script.src = DATAFAST_CONFIG.scriptUrl;
  script.setAttribute('data-website-id', DATAFAST_CONFIG.websiteId);
  script.async = true;

  // Add debugging if enabled
  if (DATAFAST_CONFIG.debug) {
    script.setAttribute('data-debug', 'true');
  }

  document.head.appendChild(script);

  // Set up event listeners
  window.addEventListener('datafast:ready', () => {
    if (DATAFAST_CONFIG.debug) {
      console.log('DataFast initialized successfully');
    }
  });

  window.addEventListener('datafast:error', (event) => {
    console.error('DataFast error:', event.detail);
  });
};

// React hook for DataFast
export const useDataFastConfig = () => {
  return {
    config: DATAFAST_CONFIG,
    initialize: initializeDataFast,
  };
};`;
        } else if (platform === "server") {
          config = `// DataFast Server Configuration - ${environment}

export const DATAFAST_CONFIG = {
  // API settings
  apiKey: process.env.DATAFAST_API_KEY || '${
    environment === "production"
      ? "your_production_api_key"
      : "your_dev_api_key"
  }',
  baseUrl: 'https://datafa.st/api/v1',

  // Environment
  environment: '${environment}',
  debug: ${environment !== "production"},

  // Feature flags
  features: {
    payments: ${features.includes("payments")},
    goals: ${features.includes("goals")},
    analytics: ${features.includes("analytics")},
    webhooks: true,
  },

  // Webhook settings
  webhooks: {
    enabled: true,
    secret: process.env.DATAFAST_WEBHOOK_SECRET || 'your_webhook_secret',
    endpoints: {
      stripe: '/api/webhooks/stripe',
      paypal: '/api/webhooks/paypal',
      lemonsqueezy: '/api/webhooks/lemonsqueezy',
    },
  },

  // Payment settings
  payments: {
    autoTrack: ${features.includes("payments")},
    providers: ['stripe', 'paypal', 'lemonsqueezy'],
    trackRefunds: true,
    validateBeforeTrack: true,
  },

  // Goal settings
  goals: {
    autoTrack: ${features.includes("goals")},
    batchSize: 10,
    retryAttempts: 3,
  },

  // Analytics settings
  analytics: {
    enabled: ${features.includes("analytics")},
    cacheTimeout: 300, // 5 minutes
    rateLimit: 1000, // requests per hour
  },

  // Security settings
  security: {
    validateApiKey: true,
    rateLimitEnabled: true,
    logRequests: ${features.includes("debugging")},
  },
};

// DataFast API client
export class DataFastAPI {
  constructor(config = DATAFAST_CONFIG) {
    this.config = config;
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
  }

  async request(endpoint, options = {}) {
    const url = \`\${this.baseUrl}\${endpoint}\`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': \`Bearer \${this.apiKey}\`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(error.error?.message || \`HTTP \${response.status}\`);
    }

    return response.json();
  }

  async createPayment(paymentData) {
    return this.request('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async createGoal(goalData) {
    return this.request('/goals', {
      method: 'POST',
      body: JSON.stringify(goalData),
    });
  }

  async getVisitorData(visitorId) {
    return this.request(\`/visitors/\${visitorId}\`);
  }
}

// Export singleton instance
export const dataFastAPI = new DataFastAPI();

// Environment variables template (.env)
export const ENV_TEMPLATE = \`
# DataFast Configuration
DATAFAST_API_KEY=your_datafast_api_key_here
DATAFAST_WEBHOOK_SECRET=your_webhook_secret_here

# Payment Provider Webhook Secrets
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
PAYPAL_WEBHOOK_SECRET=your_paypal_webhook_secret
LEMONSQUEEZY_WEBHOOK_SECRET=your_lemonsqueezy_webhook_secret
\`;`;
        } else if (platform === "lambda") {
          config = `// DataFast AWS Lambda Configuration - ${environment}

export const DATAFAST_CONFIG = {
  // API settings
  apiKey: process.env.DATAFAST_API_KEY || '${
    environment === "production"
      ? "your_production_api_key"
      : "your_dev_api_key"
  }',
  baseUrl: 'https://datafa.st/api/v1',

  // Environment
  environment: '${environment}',
  debug: ${environment !== "production"},

  // Lambda-specific settings
  timeout: 30, // seconds
  memory: 256, // MB
  concurrency: 5,

  // Feature flags
  features: {
    payments: ${features.includes("payments")},
    goals: ${features.includes("goals")},
    analytics: ${features.includes("analytics")},
    batchProcessing: true,
  },

  // Batch settings
  batch: {
    enabled: true,
    maxBatchSize: 10,
    flushInterval: 60, // seconds
  },

  // Webhook settings
  webhooks: {
    enabled: true,
    retryAttempts: 3,
    backoffMultiplier: 2,
  },
};

// Lambda handler for API Gateway
export const createPaymentHandler = async (event) => {
  console.log('Payment event:', JSON.stringify(event, null, 2));

  try {
    const { amount, currency, transaction_id, datafast_visitor_id, ...metadata } = JSON.parse(event.body);

    const response = await fetch(\`\${DATAFAST_CONFIG.baseUrl}/payments\`, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${DATAFAST_CONFIG.apiKey}\`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: parseFloat(amount),
        currency: currency.toUpperCase(),
        transaction_id,
        datafast_visitor_id,
        ...metadata,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'Payment tracking failed');
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Payment tracking error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};

// Lambda handler for SQS batch processing
export const batchGoalsHandler = async (event) => {
  console.log('Batch goals event:', JSON.stringify(event, null, 2));

  const results = [];

  for (const record of event.Records) {
    try {
      const goalData = JSON.parse(record.body);

      const response = await fetch(\`\${DATAFAST_CONFIG.baseUrl}/goals\`, {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${DATAFAST_CONFIG.apiKey}\`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goalData),
      });

      const result = await response.json();

      if (response.ok) {
        results.push({ success: true, goal: goalData.name, result });
      } else {
        results.push({ success: false, goal: goalData.name, error: result.error?.message });
      }
    } catch (error) {
      results.push({ success: false, error: error.message });
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ processed: results.length, results }),
  };
};

// CloudFormation template snippet
export const CLOUDFORMATION_TEMPLATE = {
  DataFastPaymentFunction: {
    Type: 'AWS::Lambda::Function',
    Properties: {
      FunctionName: \`datafast-payment-tracker-\${DATAFAST_CONFIG.environment}\`,
      Runtime: 'nodejs18.x',
      Handler: 'index.createPaymentHandler',
      MemorySize: DATAFAST_CONFIG.memory,
      Timeout: DATAFAST_CONFIG.timeout,
      Environment: {
        Variables: {
          DATAFAST_API_KEY: process.env.DATAFAST_API_KEY,
        },
      },
    },
  },
  ApiGatewayMethod: {
    Type: 'AWS::ApiGateway::Method',
    Properties: {
      HttpMethod: 'POST',
      ResourceId: { Ref: 'ApiGatewayResource' },
      RestApiId: { Ref: 'ApiGateway' },
      AuthorizationType: 'NONE',
      Integration: {
        Type: 'AWS_PROXY',
        IntegrationHttpMethod: 'POST',
        Uri: {
          'Fn::Sub': \`arn:aws:apigateway:\${AWS::Region}:lambda:path/2015-03-31/functions/\${DataFastPaymentFunction.Arn}/invocations\`,
        },
      },
    },
  },
};`;
        }

        return {
          content: [
            {
              type: "text",
              text: `Here's the ${platform} configuration template for ${environment}:\n\n${config}\n\n💡 This template includes all necessary settings, environment variables, and helper functions for your DataFast integration.`,
            },
          ],
        };
      }
    );

    // Generate debugging and testing tools
    this.server.tool(
      "generate_debugging_tools",
      {
        platform: z
          .enum(["browser", "server", "mobile"])
          .describe("The platform to generate debugging tools for"),
        features: z
          .array(
            z.enum([
              "visitor_tracking",
              "payment_debug",
              "goal_tracking",
              "network_monitoring",
              "error_tracking",
            ])
          )
          .default(["visitor_tracking", "payment_debug"])
          .describe("Debugging features to include"),
      },
      async ({ platform, features }) => {
        let code = "";

        if (platform === "browser") {
          code = `// DataFast Browser Debugging Tools

// Debug utility class
class DataFastDebugger {
  constructor() {
    this.logs = [];
    this.isEnabled = true;
    this.initialize();
  }

  initialize() {
    if (typeof window === 'undefined') return;

    // Listen for DataFast events
    window.addEventListener('datafast:ready', () => {
      this.log('DataFast script loaded successfully');
      this.logVisitorId();
    });

    window.addEventListener('datafast:error', (event) => {
      this.error('DataFast error:', event.detail);
    });

    // Monitor network requests
    if (${features.includes("network_monitoring")}) {
      this.monitorNetworkRequests();
    }
  }

  log(message, data = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      data,
    };
    this.logs.push(entry);
    if (this.isEnabled) {
      console.log(\`🔍 DataFast: \${message}\`, data);
    }
  }

  error(message, data = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      data,
    };
    this.logs.push(entry);
    console.error(\`❌ DataFast Error: \${message}\`, data);
  }

  logVisitorId() {
    try {
      const visitorId = window.datafast?.getVisitorId();
      this.log('Visitor ID retrieved', visitorId);
      return visitorId;
    } catch (error) {
      this.error('Failed to get visitor ID', error);
      return null;
    }
  }

  ${
    features.includes("visitor_tracking")
      ? `
  trackVisitorChanges() {
    let lastVisitorId = null;

    const checkVisitorId = () => {
      const currentVisitorId = window.datafast?.getVisitorId();
      if (currentVisitorId !== lastVisitorId) {
        this.log('Visitor ID changed', { from: lastVisitorId, to: currentVisitorId });
        lastVisitorId = currentVisitorId;
      }
    };

    // Check every 5 seconds
    setInterval(checkVisitorId, 5000);
  }
  `
      : ""
  }

  ${
    features.includes("payment_debug")
      ? `
  debugPaymentTracking(amount, currency, transactionId, visitorId) {
    this.log('Payment tracking initiated', {
      amount,
      currency,
      transactionId,
      visitorId,
    });

    // Simulate payment tracking request
    const paymentData = {
      amount,
      currency,
      transaction_id: transactionId,
      datafast_visitor_id: visitorId,
    };

    this.log('Payment data prepared', paymentData);

    // In a real implementation, this would make the API call
    return paymentData;
  }
  `
      : ""
  }

  ${
    features.includes("goal_tracking")
      ? `
  debugGoalTracking(goalName, metadata, visitorId) {
    this.log('Goal tracking initiated', {
      goalName,
      metadata,
      visitorId,
    });

    const goalData = {
      datafast_visitor_id: visitorId,
      name: goalName,
      metadata,
    };

    this.log('Goal data prepared', goalData);
    return goalData;
  }
  `
      : ""
  }

  ${
    features.includes("network_monitoring")
      ? `
  monitorNetworkRequests() {
    // Monitor fetch requests to DataFast
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url, options] = args;

      if (url.includes('datafa.st')) {
        this.log('DataFast API request', { url, options });
      }

      try {
        const response = await originalFetch(...args);

        if (url.includes('datafa.st')) {
          this.log('DataFast API response', {
            url,
            status: response.status,
            statusText: response.statusText,
          });
        }

        return response;
      } catch (error) {
        if (url.includes('datafa.st')) {
          this.error('DataFast API request failed', { url, error });
        }
        throw error;
      }
    };
  }
  `
      : ""
  }

  ${
    features.includes("error_tracking")
      ? `
  trackErrors() {
    window.addEventListener('error', (event) => {
      if (event.error && event.error.stack) {
        this.error('JavaScript error', {
          message: event.error.message,
          stack: event.error.stack,
          filename: event.filename,
          lineno: event.lineno,
        });
      }
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', event.reason);
    });
  }
  `
      : ""
  }

  // Export logs for debugging
  exportLogs() {
    return this.logs;
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
  }

  // Enable/disable logging
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }
}

// Create global instance
if (typeof window !== 'undefined') {
  window.dataFastDebugger = new DataFastDebugger();

  ${
    features.includes("visitor_tracking")
      ? "window.dataFastDebugger.trackVisitorChanges();"
      : ""
  }
  ${
    features.includes("error_tracking")
      ? "window.dataFastDebugger.trackErrors();"
      : ""
  }
}

// Debug helper functions
window.debugDataFast = {
  logVisitorId: () => window.dataFastDebugger?.logVisitorId(),
  exportLogs: () => window.dataFastDebugger?.exportLogs(),
  clearLogs: () => window.dataFastDebugger?.clearLogs(),
  setEnabled: (enabled) => window.dataFastDebugger?.setEnabled(enabled),

  ${
    features.includes("payment_debug")
      ? `
  testPayment: (amount = 29.99, currency = 'USD', transactionId = 'test_tx_123') => {
    const visitorId = window.datafast?.getVisitorId();
    return window.dataFastDebugger?.debugPaymentTracking(amount, currency, transactionId, visitorId);
  },
  `
      : ""
  }

  ${
    features.includes("goal_tracking")
      ? `
  testGoal: (goalName = 'test_goal', metadata = { test: true }) => {
    const visitorId = window.datafast?.getVisitorId();
    return window.dataFastDebugger?.debugGoalTracking(goalName, metadata, visitorId);
  },
  `
      : ""
  }
};

// Console commands
console.log('🔍 DataFast debugging enabled. Use these commands:');
console.log('  debugDataFast.logVisitorId() - Get current visitor ID');
console.log('  debugDataFast.exportLogs() - Export debug logs');
console.log('  debugDataFast.clearLogs() - Clear debug logs');
console.log('  debugDataFast.setEnabled(false) - Disable debug logging');`;
        } else if (platform === "server") {
          code = `// DataFast Server Debugging Tools

import { create_payment, create_goal, get_visitor_data } from './datafast-api.js';

// Debug utility class
export class DataFastServerDebugger {
  constructor(options = {}) {
    this.logs = [];
    this.isEnabled = options.enabled !== false;
    this.logLevel = options.logLevel || 'info';
  }

  log(level, message, data = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };

    this.logs.push(entry);

    if (this.isEnabled && this.shouldLog(level)) {
      const logMethod = level === 'error' ? console.error : console.log;
      logMethod(\`🔍 DataFast \${level.toUpperCase()}: \${message}\`, data);
    }
  }

  shouldLog(level) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.logLevel];
  }

  // Test API connectivity
  async testConnection() {
    try {
      this.log('info', 'Testing DataFast API connection...');

      // Test with a dummy visitor ID format
      const testVisitorId = '00000000-0000-0000-0000-000000000000';

      const startTime = Date.now();
      const response = await fetch(\`https://datafa.st/api/v1/visitors/\${testVisitorId}\`, {
        method: 'GET',
        headers: {
          'Authorization': \`Bearer \${process.env.DATAFAST_API_KEY || 'test_key'}\`,
          'Content-Type': 'application/json',
        },
      });
      const endTime = Date.now();

      this.log('info', \`Connection test completed in \${endTime - startTime}ms\`, {
        status: response.status,
        statusText: response.statusText,
      });

      return {
        success: response.status === 401, // 401 means API key auth works but visitor doesn't exist
        responseTime: endTime - startTime,
        status: response.status,
      };
    } catch (error) {
      this.log('error', 'Connection test failed', error);
      return { success: false, error: error.message };
    }
  }

  // Debug payment tracking
  async debugPaymentTracking(paymentData) {
    this.log('info', 'Debug payment tracking', paymentData);

    try {
      // Validate payment data
      const validation = this.validatePaymentData(paymentData);
      if (!validation.valid) {
        this.log('error', 'Payment data validation failed', validation.errors);
        return { success: false, errors: validation.errors };
      }

      // Simulate API call
      this.log('info', 'Payment data validated, simulating API call...');

      const result = await create_payment(paymentData);
      this.log('info', 'Payment tracking result', result);

      return { success: true, result };
    } catch (error) {
      this.log('error', 'Payment tracking failed', error);
      return { success: false, error: error.message };
    }
  }

  // Debug goal tracking
  async debugGoalTracking(goalData) {
    this.log('info', 'Debug goal tracking', goalData);

    try {
      const validation = this.validateGoalData(goalData);
      if (!validation.valid) {
        this.log('error', 'Goal data validation failed', validation.errors);
        return { success: false, errors: validation.errors };
      }

      const result = await create_goal(goalData);
      this.log('info', 'Goal tracking result', result);

      return { success: true, result };
    } catch (error) {
      this.log('error', 'Goal tracking failed', error);
      return { success: false, error: error.message };
    }
  }

  // Validate payment data
  validatePaymentData(data) {
    const errors = [];

    if (!data.amount || typeof data.amount !== 'number' || data.amount <= 0) {
      errors.push('Invalid amount: must be a positive number');
    }

    if (!data.currency || typeof data.currency !== 'string' || data.currency.length !== 3) {
      errors.push('Invalid currency: must be a 3-letter currency code');
    }

    if (!data.transaction_id || typeof data.transaction_id !== 'string') {
      errors.push('Invalid transaction_id: must be a non-empty string');
    }

    if (!data.datafast_visitor_id || typeof data.datafast_visitor_id !== 'string') {
      errors.push('Invalid datafast_visitor_id: must be a non-empty string');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Validate goal data
  validateGoalData(data) {
    const errors = [];

    if (!data.datafast_visitor_id || typeof data.datafast_visitor_id !== 'string') {
      errors.push('Invalid datafast_visitor_id: must be a non-empty string');
    }

    if (!data.name || typeof data.name !== 'string' || data.name.length === 0) {
      errors.push('Invalid goal name: must be a non-empty string');
    }

    if (data.name && data.name.length > 32) {
      errors.push('Goal name too long: maximum 32 characters');
    }

    if (data.metadata && typeof data.metadata !== 'object') {
      errors.push('Invalid metadata: must be an object');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Performance monitoring
  async monitorPerformance(operation, fn) {
    const startTime = Date.now();
    this.log('debug', \`Starting \${operation}\`);

    try {
      const result = await fn();
      const endTime = Date.now();

      this.log('debug', \`Completed \${operation} in \${endTime - startTime}ms\`, {
        duration: endTime - startTime,
        success: true,
      });

      return result;
    } catch (error) {
      const endTime = Date.now();
      this.log('error', \`Failed \${operation} in \${endTime - startTime}ms\`, {
        duration: endTime - startTime,
        error: error.message,
      });
      throw error;
    }
  }

  // Export logs
  exportLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }

  setLogLevel(level) {
    this.logLevel = level;
  }
}

// Export singleton instance
export const debuggerInstance = new DataFastServerDebugger({
  enabled: process.env.NODE_ENV !== 'production',
  logLevel: process.env.DATAFAST_LOG_LEVEL || 'info',
});

// Debug helper functions
export const debugDataFast = {
  testConnection: () => debuggerInstance.testConnection(),
  debugPayment: (data) => debuggerInstance.debugPaymentTracking(data),
  debugGoal: (data) => debuggerInstance.debugGoalTracking(data),
  exportLogs: () => debuggerInstance.exportLogs(),
  clearLogs: () => debuggerInstance.clearLogs(),
  validatePayment: (data) => debuggerInstance.validatePaymentData(data),
  validateGoal: (data) => debuggerInstance.validateGoalData(data),
  monitorPerformance: (op, fn) => debuggerInstance.monitorPerformance(op, fn),
};

// Auto-test connection on module load (in development)
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    debuggerInstance.testConnection().then(result => {
      if (result.success) {
        console.log('✅ DataFast API connection test passed');
      } else {
        console.log('❌ DataFast API connection test failed:', result);
      }
    });
  }, 1000);
}`;
        } else {
          code = `// DataFast Mobile Debugging Tools (React Native)

// DataFastMobileDebugger.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export class DataFastMobileDebugger {
  constructor() {
    this.logs = [];
    this.isEnabled = __DEV__; // Only enable in development
    this.sessionId = this.generateSessionId();
  }

  generateSessionId() {
    return \`session_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
  }

  log(level, message, data = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      sessionId: this.sessionId,
      platform: 'mobile',
    };

    this.logs.push(entry);

    if (this.isEnabled) {
      const logMethod = level === 'error' ? console.error : console.log;
      logMethod(\`🔍 DataFast \${level.toUpperCase()}: \${message}\`, data);
    }

    // Persist logs
    this.persistLogs();
  }

  async persistLogs() {
    try {
      await AsyncStorage.setItem('datafast_debug_logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to persist debug logs:', error);
    }
  }

  async loadPersistedLogs() {
    try {
      const logs = await AsyncStorage.getItem('datafast_debug_logs');
      if (logs) {
        this.logs = JSON.parse(logs);
      }
    } catch (error) {
      console.error('Failed to load debug logs:', error);
    }
  }

  // Mobile-specific debugging
  debugVisitorId(visitorId) {
    this.log('info', 'Visitor ID retrieved', visitorId);

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(visitorId)) {
      this.log('warn', 'Visitor ID does not match expected UUID format', visitorId);
    }

    return visitorId;
  }

  debugPaymentTracking(paymentData) {
    this.log('info', 'Payment tracking initiated', paymentData);

    // Validate payment data for mobile context
    const validation = this.validatePaymentData(paymentData);
    if (!validation.valid) {
      this.log('error', 'Payment data validation failed', validation.errors);
      return { success: false, errors: validation.errors };
    }

    // Simulate network conditions
    this.simulateNetworkConditions(paymentData);

    return { success: true, data: paymentData };
  }

  validatePaymentData(data) {
    const errors = [];

    if (!data.amount || typeof data.amount !== 'number' || data.amount <= 0) {
      errors.push('Invalid amount: must be a positive number');
    }

    if (!data.currency || typeof data.currency !== 'string' || data.currency.length !== 3) {
      errors.push('Invalid currency: must be a 3-letter currency code');
    }

    if (!data.transaction_id || typeof data.transaction_id !== 'string') {
      errors.push('Invalid transaction_id: must be a non-empty string');
    }

    if (!data.datafast_visitor_id || typeof data.datafast_visitor_id !== 'string') {
      errors.push('Invalid datafast_visitor_id: must be a non-empty string');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  simulateNetworkConditions(data) {
    // Simulate different network conditions for testing
    const conditions = ['fast', 'slow', 'unstable'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];

    this.log('debug', \`Simulating \${condition} network condition\`);

    if (condition === 'slow') {
      // Simulate slow network
      this.log('debug', 'Slow network simulation - payment would take longer');
    } else if (condition === 'unstable') {
      // Simulate network failure
      if (Math.random() < 0.1) { // 10% failure rate
        this.log('error', 'Network failure simulation - payment would fail');
      }
    }
  }

  debugGoalTracking(goalData) {
    this.log('info', 'Goal tracking initiated', goalData);

    const validation = this.validateGoalData(goalData);
    if (!validation.valid) {
      this.log('error', 'Goal data validation failed', validation.errors);
      return { success: false, errors: validation.errors };
    }

    return { success: true, data: goalData };
  }

  validateGoalData(data) {
    const errors = [];

    if (!data.datafast_visitor_id || typeof data.datafast_visitor_id !== 'string') {
      errors.push('Invalid datafast_visitor_id: must be a non-empty string');
    }

    if (!data.name || typeof data.name !== 'string' || data.name.length === 0) {
      errors.push('Invalid goal name: must be a non-empty string');
    }

    if (data.name && data.name.length > 32) {
      errors.push('Goal name too long: maximum 32 characters');
    }

    if (data.metadata && typeof data.metadata !== 'object') {
      errors.push('Invalid metadata: must be an object');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Monitor app state changes
  monitorAppState() {
    // This would integrate with React Native's AppState
    this.log('debug', 'App state monitoring enabled');
  }

  // Debug offline scenarios
  debugOfflineMode(data) {
    this.log('info', 'Testing offline mode behavior', data);
    // Simulate offline storage
    this.log('debug', 'Data would be stored locally until connection restored');
  }

  // Export logs for debugging
  exportLogs() {
    return {
      sessionId: this.sessionId,
      logs: this.logs,
      deviceInfo: {
        platform: 'mobile',
        timestamp: new Date().toISOString(),
      },
    };
  }

  clearLogs() {
    this.logs = [];
    AsyncStorage.removeItem('datafast_debug_logs');
  }
}

// Create global instance
let debuggerInstance = null;

export const getDataFastDebugger = () => {
  if (!debuggerInstance) {
    debuggerInstance = new DataFastMobileDebugger();
  }
  return debuggerInstance;
};

// Debug helper functions
export const debugDataFast = {
  getVisitorId: () => {
    // This would integrate with your mobile DataFast SDK
    const mockId = \`mobile_visitor_\${Date.now()}\`;
    getDataFastDebugger().debugVisitorId(mockId);
    return mockId;
  },

  testPayment: (data) => getDataFastDebugger().debugPaymentTracking(data),
  testGoal: (data) => getDataFastDebugger().debugGoalTracking(data),

  exportLogs: () => getDataFastDebugger().exportLogs(),
  clearLogs: () => getDataFastDebugger().clearLogs(),

  simulateOffline: (data) => getDataFastDebugger().debugOfflineMode(data),

  validatePayment: (data) => getDataFastDebugger().validatePaymentData(data),
  validateGoal: (data) => getDataFastDebugger().validateGoalData(data),
};

// Console commands for React Native debugging
if (__DEV__) {
  console.log('🔍 DataFast mobile debugging enabled. Use:');
  console.log('  debugDataFast.testPayment({ amount: 29.99, currency: "USD", transaction_id: "test", datafast_visitor_id: "test" })');
  console.log('  debugDataFast.testGoal({ name: "test_goal", datafast_visitor_id: "test" })');
  console.log('  debugDataFast.exportLogs()');
}`;
        }

        return {
          content: [
            {
              type: "text",
              text: `Here's the debugging tools for ${platform}:\n\n${code}\n\n💡 These debugging tools will help you troubleshoot DataFast integration issues, validate data, and monitor performance.`,
            },
          ],
        };
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
