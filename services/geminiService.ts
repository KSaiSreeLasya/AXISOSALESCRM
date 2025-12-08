import { GoogleGenAI } from "@google/genai";
import { Lead } from "../types";

// Safety check for API key availability without crashing
const apiKey = process.env.API_KEY || ''; 
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const analyzeLead = async (lead: Lead): Promise<string> => {
  if (!ai) {
    return "API Key is missing. Please configure the environment variable or Settings.";
  }

  try {
    const prompt = `
      Act as a solar sales expert. Analyze this residential/commercial lead:
      
      Lead Data:
      Name: ${lead.name}
      Property Type: ${lead.propertyType}
      Avg Monthly Bill: ${lead.avgBill}
      Status: ${lead.status}
      Address: ${lead.address}
      
      Provide:
      1. Qualification Score (0-100%) based on bill amount and property type.
      2. Estimated System Size needed (in kW) based on the bill (approx Rs 1000 bill = 100 units).
      3. A quick script for the sales call to address this specific customer.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No analysis could be generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to analyze lead. Please check your API usage or network connection.";
  }
};