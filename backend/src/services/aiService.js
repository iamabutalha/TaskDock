const { GoogleGenAI } = require("@google/genai");
const ApiError = require("../utils/ApiError.js");

const MODEL = process.env.AI_MODEL || "gemini-pro";

let client = null;
const getClient = () => {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key || key === "your-gemini-api-kye") {
    throw new ApiError(503, "Google AI API key is not provided");
  }

  if (!client) {
    client = new GoogleGenAI(key);
  }

  return client;
};

const extractJson = (text) => {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\n```/i);
  const candidate = fenced ? fenced[1] : text;

  const start = candidate.search(/[[{]/);

  if (start === -1) throw new ApiError(502, "AI returned unexpacted response");
  const end = Math.max(candidate.lastIndexOf("]"), candidate.lastIndexOf("}"));

  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch (error) {
    throw new ApiError(502, "AI returned unexpacted response");
  }
};

const runPrompt = async (prompt) => {
  try {
    const response = await getClient().models.generateContent({
      model: MODEL,
      content: prompt,
    });

    return response.text;
  } catch (err) {
    if (err.isApiError) throw err;

    const status = err.status || err.statusCode;

    if (status === 429) {
      throw new ApiError(429, "AI quota exceeded");
    }

    if (status == 400 || status === 401 || status === 403) {
      throw new ApiError(503, "AI request rejected verify api key");
    }

    console.error("Gemini request failed", err.message);
    throw new ApiError(500, "Failed to generate content");
  }
};

const VALID_PRIORITIES = ["low", "medium", "high", "urgent"];
const normalizeTask = (t) => ({
  title: String(t.title || t.name || "")
    .trim()
    .slice(0, 200),
  description: String(t.description || "")
    .trim()
    .slice(0, 1000),
  priority: VALID_PRIORITIES.includes(t.priority) ? t.priority : "medium",
});

const generateTasks = async (goal, count = 6) => {
  const prompt = `You are a senior project manager. Break the following goal into ${count} concrete, actionable , kanban tasks
    Goal: "${goal}"
    
    Respond ONLY with a JSON array. Each item {"title": string, "description": string (1-2 sentences), "priority": "low"|"medium"|"high"|"urgent"}.
    No markdown, no commentary.
    `;
  const json = extractJson(await runPrompt(prompt));
  if (!Array.isArray(json)) {
    throw new ApiError(502, "AI returned unexpected response");
  }
  return json.map(normalizeTask).filter((t) => t.title);
};

const breakdownTask = async (title, description = "", count = 5) => {
  const prompt = `Break the following task into ${count} subtasks. Be specific and actionable.

    Task: "${title}"
    Description: "${description}"

    Respond ONLY with a JSON array. Each item {"title": string, "description": string (1-2 sentences), "priority": "low"|"medium"|"high"|"urgent"}.
    No markdown, no commentary.
    `;

  const json = extractJson(await runPrompt(prompt));
  if (!Array.isArray(json)) {
    throw new ApiError(502, "AI returned unexpected response");
  }
  return json.map(normalizeTask).filter((t) => t.title);
};

const summarizeBoard = async ({ boardTitle, columns }) => {
  const snapshot = columns.map(
    (c) =>
      `${c.title} (${c.tasks.length}):\n` +
      (c.tasks.map((t) => `  - ${t.title} [${t.priority}]`).join("\n") ||
        "none"),
  );

  const prompt = `You are a scrum master. Write a consice sprint summary for the Kanban board 
  "${boardTitle}"
  
  Current board state: ${snapshot}
  
  
  Respond Only with JSON: {
  "headline": string (one sentence overview),
  "completed": string [] (key done items),
  "inProgress": "string [] (what actively begin worked),
  "risks": string [] (blockers/risks/overdue concerns),
  "recommendations": string [] (next priority)
  }
  No markdown, no commentary.
  `;

  return extractJson(await runPrompt(prompt));
};

module.exports = { generateTasks, summarizeBoard, breakdownTask };
