// app/api/gemini/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  const { message } = await req.json();

  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  try {
    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: message }] }],
    });

    const text = result.text;

    return NextResponse.json({ text }, { status: 200 });

  } catch (err) {
    console.error("Gemini API error:", err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
