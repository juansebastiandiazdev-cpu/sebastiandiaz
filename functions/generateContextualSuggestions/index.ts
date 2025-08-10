


import { InvocationContext, HttpRequest, HttpResponseInit } from "@azure/functions";
import { GoogleGenAI, Type } from "@google/genai";

const httpTrigger = async function (context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const { contextType, contextData } = await req.json() as { contextType: 'teamMember', contextData: any };

        if (!contextType || !contextData) {
            return { status: 400, jsonBody: { error: "Bad Request: 'contextType' and 'contextData' are required." } };
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { status: 500, jsonBody: { error: "API key not configured." } };
        }

        const ai = new GoogleGenAI({ apiKey });
        
        let systemInstruction = '';
        if (contextType === 'teamMember') {
            systemInstruction = `You are an expert HR Business Partner and Coach. An employee has been identified with a high turnover risk. Based on their PTL (Potential Turnover Likelihood) report, suggest 2-3 specific, actionable suggestions for their manager. The output must be a valid JSON object with a single key "suggestions", which is an array of objects. Each suggestion object must have "text" (string, the button label) and "action" (an object with "type": 'navigate' and "view": 'coaching' or 'tasks', and optionally a 'filter' object).
- If the main driver is performance, suggest navigating to the coaching tab.
- If the main driver is workload/overdue tasks, suggest navigating to their tasks view with an 'Overdue' status filter.
- Example: {"suggestions": [{"text": "Start a coaching session", "action": {"type": "navigate", "view": "coaching"}}]}
- The entire response must be a single, valid, raw JSON object. Do not use markdown formatting.`;
        } else {
             return { status: 400, jsonBody: { error: "Unsupported context type." } };
        }
        
        const userPrompt = `CONTEXT_DATA: ${JSON.stringify(contextData)}\n\nGenerate the suggestions.`;
        
        const schema = {
            type: Type.OBJECT,
            properties: {
                suggestions: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            text: { type: Type.STRING },
                            action: {
                                type: Type.OBJECT,
                                properties: {
                                    type: { type: Type.STRING },
                                    view: { type: Type.STRING },
                                    filter: { type: Type.OBJECT }
                                }
                            }
                        },
                        required: ['text', 'action']
                    }
                }
            },
            required: ['suggestions']
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        const result = JSON.parse(response.text);

        return { status: 200, jsonBody: result };

    } catch (error) {
        context.error('Error in generateContextualSuggestions function:', error);
        return {
            status: 500,
            jsonBody: { error: 'An internal error occurred.', details: (error as Error).message },
        };
    }
};

export default httpTrigger;