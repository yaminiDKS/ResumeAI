
import { GoogleGenAI, Type } from "@google/genai";
import { ResearchResult, ResumeAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Step 1: Use Gemini 2.5 Flash with Google Search to get real-time market trends.
 */
export const researchMarketTrends = async (jobDescription: string): Promise<ResearchResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze this Job Description and find the current market trends, hot keywords, and recruiter expectations for this specific role in 2024/2025. 
      
      Job Description:
      ${jobDescription.substring(0, 5000)}`, // Truncate to avoid massive context if pasted weirdly
      config: {
        tools: [{ googleSearch: {} }],
        // Note: responseMimeType is NOT allowed with googleSearch
      },
    });

    const text = response.text || "No specific market trends found.";
    
    // Extract grounding chunks (URLs)
    const links: string[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
          links.push(chunk.web.uri);
        }
      });
    }

    return {
      trends: text,
      groundingLinks: [...new Set(links)], // Remove duplicates
    };
  } catch (error) {
    console.error("Error researching market trends:", error);
    throw new Error("Failed to research market trends. Please check your API key or try again.");
  }
};

/**
 * Step 2: Use Gemini 3 Pro with Thinking Budget to deeply analyze and rewrite the resume in LaTeX.
 */
export const optimizeResume = async (
  resumeLatex: string,
  jobDescription: string,
  marketTrends: string
): Promise<ResumeAnalysis> => {
  try {
    const prompt = `
      You are an expert Resume Writer, Career Coach, and LaTeX Typesetting Specialist. 
      
      Input Data:
      1. Candidate's Resume (LaTeX Code): ${resumeLatex}
      2. Target Job Description (JD): ${jobDescription}
      3. Current Market Research for this Role: ${marketTrends}

      Your Task:
      Analyze the resume against the JD and Market Research. 
      Rewrite the resume content to maximize the chances of shortlisting (ATS optimization) while maintaining a clean, professional LaTeX structure.
      
      Rules:
      1. The output "optimizedResumeLatex" MUST be valid, compilable LaTeX code.
      2. Preserve the user's existing LaTeX template structure (commands, packages, formatting) if it is good. If it is messy or plain text, convert it to a professional, modern LaTeX resume template.
      3. Integrate keywords and skills naturally into the LaTeX content.
      4. Escape JSON special characters properly in the output string (e.g., backslashes for LaTeX commands).
      5. Do NOT include markdown formatting (like \`\`\`latex) within the JSON string value. Just the raw LaTeX code.

      You MUST output a JSON object with the following schema:
      {
        "matchScore": number (0-100),
        "marketInsights": string[] (List of 3-5 specific insights applied from the research),
        "missingKeywords": string[] (List of critical keywords found in JD but missing in Resume),
        "suggestedSkills": string[] (List of skills to highlight based on market trends),
        "improvementSummary": string (A concise paragraph explaining the strategy used for the rewrite),
        "optimizedResumeLatex": string (The full, rewritten resume in valid LaTeX source code)
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }, // Max thinking for deep analysis
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchScore: { type: Type.INTEGER },
            marketInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvementSummary: { type: Type.STRING },
            optimizedResumeLatex: { type: Type.STRING },
          },
          required: ["matchScore", "marketInsights", "missingKeywords", "suggestedSkills", "improvementSummary", "optimizedResumeLatex"]
        }
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");

    return JSON.parse(jsonText) as ResumeAnalysis;

  } catch (error) {
    console.error("Error optimizing resume:", error);
    throw new Error("Failed to optimize resume. The model might be overloaded or the input is too complex.");
  }
};
