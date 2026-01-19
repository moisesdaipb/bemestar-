
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.GEMINI_API_KEY || '' });

export const getSupportAgentResponse = async (userMessage: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userMessage,
      config: {
        systemInstruction: `Você é o assistente virtual da plataforma Vitalidade, um portal de bem-estar corporativo.
        Seu objetivo é ajudar os colaboradores a tirar dúvidas sobre agendamentos de massagens, consultoria financeira e jurídica.
        Seja amigável, profissional e direto. Use português do Brasil.`,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Desculpe, estou tendo problemas para processar sua solicitação agora. Tente novamente em breve.";
  }
};
