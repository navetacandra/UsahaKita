// Base configuration derived from OpenCodeExecutor
const OPENCODE_BASE_URL = "https://opencode.ai"; // Adjust base URL if needed
const OPENCODE_UA = "opencode";
const RESPONSES_MODELS = new Set([
  "muse-spark-1.2-contributor-free",
  "muse-spark-1.3-contributor-free",
]);

// Helper: Generate browser-compatible unique IDs
function generateRequestId() {
  return `msg_${self.crypto.randomUUID().replace(/-/g, "")}`;
}

function generateSessionId() {
  return `ses_${self.crypto.randomUUID().replace(/-/g, "")}`;
}

// Helper: Strip thinking suffix "model(level)"
function baseModelId(model) {
  return String(model || "").replace(/\([^()]+\)\s*$/, "").trim();
}

// Helper: Determine API endpoint type
function isResponsesModel(model) {
  const base = baseModelId(model);
  return RESPONSES_MODELS.has(base) || base.includes("muse-spark");
}

/**
 * Sends a request to the OpenCode API directly from the browser.
 *
 * @param {Object} options
 * @param {string} options.model - Model identifier (e.g., "opencode/mimo-v2.5-free" or "muse-spark-1.2-contributor-free")
 * @param {Array} options.messages - Array of chat messages
 * @param {boolean} [options.stream=false] - Whether to stream the response
 * @param {string} [options.sessionId] - Optional session ID to reuse
 * @param {Object} [options.extraBody={}] - Additional payload fields (e.g., max_tokens, reasoning_effort)
 */
async function sendOpenCodeRequest({
  model,
  messages,
  stream = false,
  sessionId = generateSessionId(),
  extraBody = {}
}) {
  // 1. Prepare Request Body
  const body = {
    model,
    messages,
    stream,
    ...extraBody
  };

  const isResponses = isResponsesModel(model);

  // 2. Transform Body parameters for Responses models
  if (isResponses) {
    if (body.max_output_tokens === undefined) {
      if (body.max_completion_tokens !== undefined) body.max_output_tokens = body.max_completion_tokens;
      else if (body.max_tokens !== undefined) body.max_output_tokens = body.max_tokens;
    }
    delete body.max_tokens;
    delete body.max_completion_tokens;

    // Handle reasoning effort normalization if present
    if (body.reasoning_effort) {
      body.reasoning = {
        effort: body.reasoning_effort.toLowerCase().trim(),
        summary: "auto"
      };
      delete body.reasoning_effort;
    }
  }

  // 3. Resolve Endpoint URL
  const endpoint = isResponses ? "/zen/v1/responses" : "/zen/v1/chat/completions";
  const url = `${OPENCODE_BASE_URL}${endpoint}`;

  // 4. Construct Required OpenCode Headers
  const headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer public",
    "x-opencode-client": "desktop",
    "x-opencode-session": sessionId,
    "x-opencode-request": generateRequestId(),
    "x-opencode-project": "global",
    "Accept": stream ? "text/event-stream" : "*/*"
  };

  // 5. Execute Request
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`OpenCode API error ${response.status}: ${await response.text()}`);
  }

  return response;
}

async function main() {
  try {
    const response = await sendOpenCodeRequest({
      model: "mimo-v2.5-free",
      messages: [
        { role: "user", content: "Hello from the browser!" }
      ]
    });

    const data = await response.json();
    console.log("Response:", data);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
