// src/pages/api/analisis-ia.js
import { GoogleGenAI } from '@google/genai';

// Para poder procesar POST requests en Astro
export const prerender = false; 

export const POST = async ({ request }) => {
  try {
    const data = await request.json();
    
    // Inicializar SDK
    const ai = new GoogleGenAI({ apiKey: import.meta.env.GEMINI_API_KEY });
    
    // Prompt educativo
    const prompt = `Actúa como un neurocientífico analizando la base de datos Flywire.ai de la Drosophila melanogaster. 
    El estudiante seleccionó la neurona ID ${data.id}. Sus propiedades son:
    - Tipo: ${data.type}
    - Neurotransmisor dominante: ${data.neurotransmitter}
    
    En dos párrafos breves, amigables y con base científica, explícale al estudiante qué función suele tener este tipo de neurona en el cerebro de la mosca (por ejemplo, procesamiento visual, memoria, escape) y cómo afecta el neurotransmisor indicado.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5',
        contents: prompt,
    });

    return new Response(JSON.stringify({ analysis: response.text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Error conectando con Gemini:", error);
    return new Response(JSON.stringify({ analysis: "Hubo un error al procesar el análisis de la red." }), { status: 500 });
  }
}