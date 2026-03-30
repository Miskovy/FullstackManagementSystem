import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini Client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Missing Gemini API Key." }, { status: 500 });
  }
  
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        // System instructions to guide the model's output
        systemInstruction: `You are an AI assistant for an Assignment and Scheduling app.
Your job is to parse natural language requests and extract the details into a structured JSON format.
You must output ONLY valid JSON without any markdown blocks or conversational text.
Return JSON with the following schema:
{
  "intent": "create_assignment" | "create_schedule" | "create_template" | "unknown",
  "data": {
     "title": "String",
     "description": "String",
     "priority": "low" | "medium" | "high" | "urgent",
     "due_date": "ISO8601 String or null",
     "recurrence_type": "daily" | "weekly" | "monthly" | null,
     "trigger_time": "HH:MM:SS format or null",
     "config": {
        "days": [number, number], // 0-6 for weekly (0=Sunday)
        "dates": [number] // 1-31 for monthly
     } // Note: config is optional
  },
  "message": "A friendly message confirming the extracted data or asking for clarification if 'unknown'."
}`
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Sometimes the model wraps in ```json ... ```, so clean it
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsedJson = JSON.parse(cleanedText);

    return NextResponse.json(parsedJson);
  } catch (error: any) {
    console.error('Error generating AI response:', error);
    return NextResponse.json({ error: 'Failed to process AI response' }, { status: 500 });
  }
}
