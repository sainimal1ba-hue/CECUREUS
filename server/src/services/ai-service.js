/**
 * CECUREUS — Local AI Mental Wellness Engine (Powered by Microsoft Phi-3 Mini via Ollama)
 *
 * Why this file was created:
 * This service implements the conversational artificial intelligence core for "Ally", CecureUs's on-device/local
 * mental wellness companion. It was created to provide high-empathy, private psychological support without sending
 * sensitive mental health data to third-party cloud AI vendors:
 * 1. Local Private LLM Inference: Communicates directly with Ollama (`http://127.0.0.1:11434`) running Microsoft Phi-3 Mini.
 * 2. Multi-turn Conversational Memory: Formats prior conversation history to maintain context and continuity.
 * 3. Clinical Crisis Protocols: Instantly detects self-harm, suicidal ideation, or severe distress keywords and provides
 *    immediate national tele-mental health helplines (14416 / 1800-891-4416) and emergency services (112).
 * 4. Resilient Fallback Engine: Provides structured, psychologically grounded fallback responses if the LLM engine is busy.
 */

const http = require('http');
const config = require('../config');
const logger = require('../config/logger');

const OLLAMA_HOST = config.ai.ollamaHost;
const OLLAMA_PORT = config.ai.ollamaPort;
const OLLAMA_MODEL = config.ai.ollamaModel;

const ALLY_SYSTEM_PROMPT = `You are Ally, a warm, caring, empathetic mental wellness companion from CecureUs.
Your core mission is to support human emotional health, stress relief, and psychological well-being.

STRICT BEHAVIORAL RULES:
1. YOU ARE A WELLNESS COMPANION, NOT A PROGRAMMER OR TECHNICAL ASSISTANT.
   - NEVER write, output, format, or generate programming code, algorithms, scripts, or technical syntax under any circumstances.
   - If a user mentions frustration, stress, anxiety, or feeling stuck with coding, programming, exams, or work tasks (for example: "I'm stressed cause I don't know how to reverse a string" or "I have a bug I can't fix"):
     * DO NOT write the code or solve the technical problem.
     * DO address the emotional burden: validate their stress, imposter syndrome, and mental fatigue.
     * Encourage them to step away from the keyboard, take three deep breaths, drink some water, and remember that problem-solving takes patience and breaks foster clarity.
2. Listen actively and validate feelings with genuine human warmth, kindness, and non-judgmental empathy.
3. Ask gentle, open-ended questions to help the user unpack what is really weighing on them.
4. Suggest simple, evidence-based coping tools when helpful (box breathing, 4-7-8 breathing, sensory 5-4-3-2-1 grounding, mindful pacing).
5. Keep answers natural, comforting, concise (1-3 short paragraphs), mobile-friendly, and free from robotic or technical jargon.
6. CRISIS PROTOCOL: If the user indicates self-harm, suicidal thoughts, or danger, respond with immediate tenderness, care, and direct them to the national helpline (14416 / 1800-891-4416 or 112) and our in-app professional counsellors.`;

/**
 * Call Ollama Chat API
 */
async function callOllamaChat(messages) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [
        { role: 'system', content: ALLY_SYSTEM_PROMPT },
        ...messages,
      ],
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        num_predict: 250,
      },
    });

    const req = http.request(
      {
        hostname: OLLAMA_HOST,
        port: OLLAMA_PORT,
        path: '/api/chat',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: 45000,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const parsed = JSON.parse(data);
              const responseText = parsed.message?.content?.trim();
              if (responseText) {
                resolve(responseText);
              } else {
                reject(new Error('Empty response from Ollama Phi-3'));
              }
            } else {
              reject(new Error(`Ollama returned status ${res.statusCode}: ${data}`));
            }
          } catch (err) {
            reject(err);
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Ollama Phi-3 request timed out after 45s'));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Fallback empathetic generator if Ollama is unreachable
 */
function getEmpatheticFallback(topic, userMessage) {
  const msg = (userMessage || '').toLowerCase();
  if (msg.includes('die') || msg.includes('suicide') || msg.includes('kill myself') || msg.includes('hurt myself')) {
    return "I hear how much pain you are carrying right now, and I care deeply about your safety. You don't have to go through this alone. Please reach out right now to the National Mental Health Helpline at 14416 (available 24/7 toll-free) or connect with one of our licensed CecureUs counsellors in the Counsellor tab. There is help, and you are not alone.";
  }
  if (msg.includes('stress') || msg.includes('overwhelm') || msg.includes('burnout')) {
    return "I hear how much pressure you're under right now. When everything piles up, it helps to pause for just 30 seconds and take a slow breath. What is the single biggest thing weighing on your shoulders today?";
  }
  if (msg.includes('anxi') || msg.includes('panic') || msg.includes('scared') || msg.includes('fear')) {
    return "It sounds like anxiety is feeling really intense for you right now. Let's do a quick grounding check: feel your feet flat on the floor, and take a long, slow exhale. Would you like to tell me more about what triggered this feeling?";
  }
  return `Thank you for sharing that with me. I'm here to listen and support you through this. Can you tell me a little more about how this has been affecting you today?`;
}

/**
 * Main function to generate intelligent Ally response
 * @param {Array<{role: string, content: string}>} history - Previous messages
 * @param {string} currentMessage - Latest user message
 * @param {string} topic - Conversation topic
 */
async function generateAllyResponse(history = [], currentMessage = '', topic = 'General Check-in') {
  try {
    // Format history for Ollama chat format
    const formattedMessages = history
      .slice(-6) // Keep last 6 messages for prompt efficiency and fast response
      .map((m) => ({
        role: m.role === 'ally' ? 'assistant' : 'user',
        content: m.content,
      }));

    // Append latest user message if not already present
    if (currentMessage && (!formattedMessages.length || formattedMessages[formattedMessages.length - 1].content !== currentMessage)) {
      formattedMessages.push({ role: 'user', content: currentMessage });
    }

    logger.info('Generating response with Ollama Phi-3...', {
      model: OLLAMA_MODEL,
      messageCount: formattedMessages.length,
      topic,
    });

    const aiResponse = await callOllamaChat(formattedMessages);
    logger.info('Ollama Phi-3 response generated successfully');
    return aiResponse;
  } catch (error) {
    logger.warn('Ollama Phi-3 call failed, using graceful empathetic fallback', {
      error: error.message,
    });
    return getEmpatheticFallback(topic, currentMessage);
  }
}

module.exports = {
  generateAllyResponse,
  callOllamaChat,
};
