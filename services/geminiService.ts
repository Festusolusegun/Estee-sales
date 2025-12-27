
import { GoogleGenAI } from "@google/genai";
import { Product } from '../types';

export class GeminiService {
  async getChatResponse(message: string, products: Product[]) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Formatting multi-unit prices for the AI
    const productListString = products.map(p => {
      const units = Object.entries(p.pricePerUnit).map(([unit, price]) => `${unit}: ₦${price.toLocaleString()}`).join(', ');
      return `${p.name} (${units})`;
    }).join('; ');
    
    const systemInstruction = `
      You are the AI Assistant for Estee Wholesales (Nigeria). 
      We identify users by Phone Number, not Email.
      Items come in various units: Kongo, Bags, 5L-Bottles, 10L-Bottles, Portion, Crate, Carton, and Kg.
      Available stock and rates: ${productListString}.
      Users can ask about current rates for specific units. 
      If they want to buy, tell them to select their unit on the product card, add to cart, and indicate interest.
      Once they indicate interest, they should upload a receipt of payment for admin verification.
      Be friendly, professional, and use a helpful tone. Format all prices with the Naira (₦) symbol.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: message,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      return response.text || "I'm sorry, I couldn't process that request.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "I'm having a connection issue. Please try again or call our support line.";
    }
  }
}

export const gemini = new GeminiService();
