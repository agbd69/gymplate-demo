export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    response.status(501).json({ error: "OPENAI_API_KEY is not configured" });
    return;
  }

  const { text } = request.body || {};
  if (!text) {
    response.status(400).json({ error: "Missing meal text" });
    return;
  }

  const aiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: "把中文口述饮食解析成 JSON。估算常见食物克数和每项热量、蛋白质、碳水、脂肪。只返回 JSON。"
        },
        {
          role: "user",
          content: text
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "meal_parse_result",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              meals: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    name: { type: "string" },
                    grams: { type: "number" },
                    calories: { type: "number" },
                    protein: { type: "number" },
                    carbs: { type: "number" },
                    fat: { type: "number" },
                    source: { type: "string" }
                  },
                  required: ["name", "grams", "calories", "protein", "carbs", "fat", "source"]
                }
              }
            },
            required: ["meals"]
          }
        }
      }
    })
  });

  if (!aiResponse.ok) {
    response.status(aiResponse.status).json({ error: await aiResponse.text() });
    return;
  }

  const data = await aiResponse.json();
  const content = data.output_text || data.output?.[0]?.content?.[0]?.text || "{\"meals\":[]}";
  response.status(200).json(JSON.parse(content));
}
