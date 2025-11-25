import { GoogleGenAI, Type } from "@google/genai";
import { OcrResult } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export const scanDocument = async (
  imageBase64: string,
  mimeType: string
): Promise<OcrResult> => {
  const ai = getAiClient();

  const prompt = `
    Analyze this document image. 
    1. Extract the main text content accurately.
    2. Provide a brief summary of what this document is about.
    3. If there are key items, dates, or amounts, list them.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "Full extracted text from the document" },
            summary: { type: Type.STRING, description: "A concise summary of the document" },
            items: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Key items, dates, or data points extracted" 
            }
          },
          required: ["text", "summary"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as OcrResult;
    }
    throw new Error("No response text from Gemini");
  } catch (error) {
    console.error("Gemini Scan Error:", error);
    throw error;
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the Data-URL prefix (e.g. "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};
