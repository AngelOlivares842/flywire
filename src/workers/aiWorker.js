// src/workers/aiWorker.js
import { MLCEngine } from "@mlc-ai/web-llm";

let engine = null;
// Modelo de 0.5B cuantizado: ultra ligero, ideal para no saturar memoria
const MODEL_NAME = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";

self.onmessage = async (e) => {
  const { type, data } = e.data;

  if (type === "INIT") {
    if (engine) return;

    try {
      engine = new MLCEngine();
      engine.setInitProgressCallback((report) => {
        self.postMessage({ type: "PROGRESS", progress: report.text });
      });

      await engine.reload(MODEL_NAME);
      self.postMessage({ type: "READY" });
    } catch (err) {
      self.postMessage({ type: "ERROR", error: err.message });
    }
  }

  if (type === "ANALYZE") {
    if (!engine) {
      self.postMessage({ type: "ERROR", error: "El modelo no está inicializado." });
      return;
    }

    try {
      const prompt = `Analiza brevemente esta neurona de Drosophila (Flywire):
ID: ${data.id}, Tipo: ${data.type}, Neurotransmisor: ${data.neurotransmitter}.
Explica en un solo párrafo corto y claro su función sensorial o motora probable.`;

      const reply = await engine.chat.completions.create({
        messages: [
          { role: "system", content: "Eres un asistente neurocientífico conciso." },
          { role: "user", content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 120 // Limita tokens para liberar la GPU en segundos
      });

      self.postMessage({ 
        type: "RESULT", 
        text: reply.choices[0].message.content 
      });
    } catch (err) {
      self.postMessage({ type: "ERROR", error: err.message });
    }
  }
};