// app/api/gemini/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  const { message, context } = await req.json();

  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  try {
    console.log('=== Gemini API Debug ===');
    console.log('1. Received Context:', {
      contextLength: context.length,
      roles: context.map((msg: any) => msg.role)
    });

    // Convert context messages to Gemini's format
    const contents = context.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    console.log('2. Processed Context:', { 
      messageCount: contents.length,
      lastMessage: message,
      roles: contents.map((c: { role: string }) => c.role)
    });

    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents,
    });

    const text = result.text || '';
    console.log('3. Response Summary:', {
      responseLength: text.length,
      firstLine: text.split('\n')[0]
    });

    return NextResponse.json({ text }, { status: 200 });

  } catch (err) {
    console.error("Gemini API error:", err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
