import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";
import type { VideoScript } from "./types";

const topic = process.argv[2] || "태양계의 행성들";

const client = new OpenAI({
  baseURL:
    process.env.OPENAI_BASE_URL ||
    "https://dashscope.aliyuncs.com/compatible-mode/v1",
  apiKey: process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY,
});

const model = process.env.QWEN_MODEL || "qwen-plus";

const systemPrompt = `You are a video script generator. Given a topic, create a structured video script as JSON.

The JSON must match this exact schema:
{
  "title": "string - video title",
  "fps": 30,
  "width": 1920,
  "height": 1080,
  "scenes": [
    {
      "id": 1,
      "title": "string - scene title",
      "text": "string - scene body text (1-2 sentences)",
      "backgroundColor": "string - hex color like #1a1a2e",
      "textColor": "string - hex color like #ffffff",
      "durationInFrames": 120
    }
  ]
}

Rules:
- Generate 4-6 scenes
- Each scene should have a distinct backgroundColor
- durationInFrames should be between 90 and 150 (at 30fps, that's 3-5 seconds per scene)
- Use visually appealing color combinations
- Text should be concise and informative
- Respond ONLY with valid JSON, no markdown fences or extra text`;

async function main() {
  console.log(`🎬 Generating video script about: "${topic}"`);
  console.log(`📡 Using model: ${model}`);

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Create a video script about: ${topic}` },
    ],
    temperature: 0.7,
  });

  let content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from Qwen3 API");
  }

  // Strip markdown code fences if present
  content = content.replace(/^```(?:json)?\s*\n?/g, "").replace(/\n?```\s*$/g, "");

  let script: VideoScript;
  try {
    script = JSON.parse(content);
  } catch {
    console.error("Failed to parse JSON response:");
    console.error(content);
    throw new Error("Invalid JSON response from Qwen3");
  }

  // Apply defaults if missing
  script.fps = script.fps || 30;
  script.width = script.width || 1920;
  script.height = script.height || 1080;

  if (!script.scenes || script.scenes.length === 0) {
    throw new Error("No scenes generated");
  }

  const outputPath = path.join(__dirname, "..", "video-script.json");
  fs.writeFileSync(outputPath, JSON.stringify(script, null, 2));

  const totalFrames = script.scenes.reduce((sum, s) => sum + s.durationInFrames, 0);
  const totalSeconds = totalFrames / script.fps;

  console.log(`✅ Script generated successfully!`);
  console.log(`   Title: ${script.title}`);
  console.log(`   Scenes: ${script.scenes.length}`);
  console.log(`   Duration: ${totalSeconds.toFixed(1)}s (${totalFrames} frames)`);
  console.log(`   Output: ${outputPath}`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
