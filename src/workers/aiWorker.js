import { CreateMLCEngine } from '@mlc-ai/web-llm';

let engine = null;

self.onmessage = async (e) => {
  const { type, data } = e.data;

  if (type === 'CHECK_WEBGPU') {
    const available = 'gpu' in navigator;
    self.postMessage({ type: 'WEBGPU_AVAILABLE', available });
  }
  else if (type === 'INIT') {
    try {
      engine = await CreateMLCEngine('Qwen2.5-0.5B-Instruct-q4f16_1-MLC', {
        initProgressCallback: (info) => {
          self.postMessage({ type: 'PROGRESS', progress: info.text });
        },
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
      const n = data;
      const ntProfile = n.ntScores
        ? Object.entries(n.ntScores)
            .filter(([, v]) => v > 0.05)
            .sort((a, b) => b[1] - a[1])
            .map(([k, v]) => `${k.toUpperCase()}: ${(v * 100).toFixed(0)}%`)
            .join(', ')
        : '';

      const prompt = `Analiza esta neurona real del conectoma de Drosophila melanogaster (FlyWire):
- ID: ${n.id}
- Tipo celular: ${n.cellType || n.label || 'No clasificada'}
- Neurotransmisor: ${n.neurotransmitter} (${n.type})
- Perfil NT: ${ntProfile || 'N/A'}
- Región: ${n.region} (neuropil: ${n.neuropil})
- Hemisferio: ${n.hemisphere || 'bilateral'}
- Conexiones: ${n.connectionCount || 'desconocidas'}

Explica brevemente su función probable en el cerebro de la mosca.`;

      const chunks = await engine.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'Eres un neurocientífico experto en el conectoma de Drosophila melanogaster. Usa los datos reales de FlyWire. Responde en español, conciso y educativo. Máximo 3 oraciones.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 200,
        stream: true,
      });

      for await (const chunk of chunks) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) self.postMessage({ type: 'STREAM_CHUNK', text });
      }
      self.postMessage({ type: 'STREAM_DONE' });
    } catch (err) {
      self.postMessage({ type: 'ERROR', error: err.message });
    }
  }
};