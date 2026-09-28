import { CreateMLCEngine } from "@mlc-ai/web-llm";

let engine = null;

self.onmessage = async (e) => {
  const { type, data } = e.data;

  if (type === 'CHECK_WEBGPU') {
    const available = 'gpu' in navigator;
    self.postMessage({ type: 'WEBGPU_AVAILABLE', available });
  } 
  else if (type === 'INIT') {
    try {
      const initProgressCallback = (info) => {
        self.postMessage({ type: 'PROGRESS', progress: info.text });
      };
      
      // Load Qwen model with provided settings
      engine = await CreateMLCEngine("Qwen2.5-0.5B-Instruct-q4f16_1-MLC", {
        initProgressCallback,
      });
      self.postMessage({ type: 'READY' });
    } catch (err) {
      self.postMessage({ type: 'ERROR', error: err.message });
    }
  } 
  else if (type === 'ANALYZE') {
    if (!engine) {
      self.postMessage({ type: 'ERROR', error: 'Engine not initialized' });
      return;
    }
    
    try {
      const { id, type: nType, neurotransmitter, region, description } = data;
      
      const prompt = `Analiza la siguiente neurona:
ID: ${id}
Tipo: ${nType}
Neurotransmisor: ${neurotransmitter}
Región: ${region}
Descripción: ${description}`;

      const messages = [
        { role: "system", content: "Eres un neurocientífico experto en el conectoma de Drosophila melanogaster (Flywire). Responde siempre en español, de forma concisa y educativa." },
        { role: "user", content: prompt }
      ];

      const chunks = await engine.chat.completions.create({
        messages,
        temperature: 0.6,
        max_tokens: 150,
        stream: true,
      });

      for await (const chunk of chunks) {
        const text = chunk.choices[0]?.delta?.content || "";
        if (text) {
          self.postMessage({ type: 'STREAM_CHUNK', text });
        }
      }
      self.postMessage({ type: 'STREAM_DONE' });

    } catch (err) {
      self.postMessage({ type: 'ERROR', error: err.message });
    }
  }
};