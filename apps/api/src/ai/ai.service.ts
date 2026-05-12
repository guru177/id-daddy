import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  constructor(private configService: ConfigService) {}

  private getGroqKey() {
    return this.configService.get<string>('GROQ_API_KEY');
  }

  private getGeminiKey() {
    return this.configService.get<string>('GEMINI_API_KEY');
  }

  // ─── Groq Chat Completion (Primary - Text-to-Design) ──────────────────────
  private async callGroq(systemPrompt: string, userPrompt: string): Promise<string> {
    const groqKey = this.getGroqKey();
    if (!groqKey) throw new Error('GROQ_API_KEY not configured in .env');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 8192,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      this.logger.error(`Groq API Error (${response.status}): ${JSON.stringify(errorData)}`);
      throw new Error(`Groq API returned ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Groq returned empty response');
    return content;
  }

  // ─── Gemini Vision (Image-to-Design) ──────────────────────────────────────
  private async callGeminiVision(imageBuffer: Buffer, mimeType: string, systemPrompt: string): Promise<string> {
    const geminiKey = this.getGeminiKey();
    if (!geminiKey) throw new Error('GEMINI_API_KEY not configured in .env');

    const base64Image = imageBuffer.toString('base64');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: systemPrompt },
            { inlineData: { mimeType, data: base64Image } }
          ]
        }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      this.logger.error(`Gemini Vision API Error (${response.status}): ${JSON.stringify(errorData)}`);
      throw new Error(`Gemini Vision API returned ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini Vision returned empty response');
    return text;
  }

  // ─── Public: Text-to-Design ───────────────────────────────────────────────
  async generateDesignFromText(prompt: string) {
    this.logger.log(`Text-to-Design request: "${prompt}"`);

    const systemPrompt = `You are an expert ID Card Designer AI. Your ONLY job is to output a valid Fabric.js JSON object for an ID card canvas.

CRITICAL RULES:
1. Output ONLY a raw JSON object - NO markdown, NO explanation, NO code blocks
2. The JSON must have "version": "5.3.0" and an "objects" array
3. Canvas size: width=1013, height=638 for horizontal cards
4. Use these variable placeholders as text values: {{firstName}}, {{lastName}}, {{employeeId}}, {{department}}, {{title}}, {{expirationDate}}
5. Include these object types: rect (backgrounds/shapes), i-text (text elements)
6. All text objects with variables must include "isVariable": true
7. Use modern, professional design with appropriate colors based on the prompt

EXAMPLE STRUCTURE:
{
  "version": "5.3.0",
  "objects": [
    {"type": "rect", "left": 0, "top": 0, "width": 1013, "height": 638, "fill": "#1e3a5f", "selectable": false},
    {"type": "i-text", "left": 400, "top": 200, "text": "{{firstName}} {{lastName}}", "fontSize": 36, "fontFamily": "Arial", "fill": "#ffffff", "isVariable": true}
  ]
}`;

    try {
      const rawText = await this.callGroq(systemPrompt, `Design request: ${prompt}`);
      let text = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(text);
    } catch (error: any) {
      this.logger.error(`Text-to-Design Error: ${error.message}`);
      throw error;
    }
  }

  // ─── Public: Image-to-Design ──────────────────────────────────────────────
  async analyzeImageAndGenerateDesign(imageBuffer: Buffer, mimeType: string) {
    this.logger.log(`Image-to-Design request: ${mimeType}, ${imageBuffer.length} bytes`);

    const systemPrompt = `Analyze this ID card image and reconstruct it as a Fabric.js JSON object (version 5.3.0).
    - Identify colors, layout, fonts, and element positions accurately
    - Map text fields to variables: {{firstName}}, {{lastName}}, {{employeeId}}, {{department}}, {{title}}
    - Canvas is 1013x638
    - Output ONLY the raw JSON object. No markdown. No explanation.
    - All variable text elements must include "isVariable": true`;

    try {
      const rawText = await this.callGeminiVision(imageBuffer, mimeType, systemPrompt);
      let text = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(text);
    } catch (error: any) {
      this.logger.error(`Image-to-Design Error: ${error.message}`);
      throw error;
    }
  }
}
