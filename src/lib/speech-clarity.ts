import { AiVoiceSettings, DEFAULT_AI_VOICE_SETTINGS } from './settings.functions';

/**
 * Phonetic & clarity preprocessor for technical mock interviews.
 * Converts markdown, raw symbols, and technical acronyms into crisp, 
 * natural speech that web speech synthesizers pronounce with high precision.
 */
export function cleanTextForSpeech(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // 1. Replace code fences with an articulate spoken transition
  text = text.replace(/```[\s\S]*?```/g, 'Here is the relevant code challenge in your editor.');
  text = text.replace(/`([^`]+)`/g, '$1');

  // 2. Remove markdown formatting markers (bold, italic, headers, blockquotes)
  text = text.replace(/#{1,6}\s+/g, '');
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');
  text = text.replace(/>\s+/g, '');

  // 3. Clean up list markers & question indexes (e.g., "1.", "- ", "Q1:", "Q2 -")
  text = text.replace(/\bQ\d+[:\-.]\s*/gi, '');
  text = text.replace(/^\s*[-*•]\s+/gm, '');
  text = text.replace(/^\s*\d+\.\s+/gm, '');

  // 4. Expand abbreviations and common Latin shortcuts for natural cadence
  text = text.replace(/\be\.g\.?,?\s*/gi, 'for example, ');
  text = text.replace(/\bi\.e\.?,?\s*/gi, 'that is, ');
  text = text.replace(/\betc\.?\b/gi, 'and so forth');
  text = text.replace(/\bvs\.?\b/gi, 'versus');
  text = text.replace(/\bw\/\b/gi, 'with');
  text = text.replace(/\bw\/o\b/gi, 'without');

  // 5. Expand technical acronyms so they are enunciated phonetically
  text = text.replace(/\bCI\/CD\b/g, 'C.I. C.D.');
  text = text.replace(/\bAPI\b/g, 'A.P.I.');
  text = text.replace(/\bAPIs\b/g, 'A.P.I.s');
  text = text.replace(/\bSQL\b/g, 'S.Q.L.');
  text = text.replace(/\bNoSQL\b/g, 'No S.Q.L.');
  text = text.replace(/\bREST\b/g, 'Rest');
  text = text.replace(/\bRESTful\b/g, 'Restful');
  text = text.replace(/\bAWS\b/g, 'A.W.S.');
  text = text.replace(/\bGCP\b/g, 'G.C.P.');
  text = text.replace(/\bLLM\b/g, 'L.L.M.');
  text = text.replace(/\bLLMs\b/g, 'L.L.M.s');
  text = text.replace(/\bRAG\b/g, 'Rag');
  text = text.replace(/\bSTAR method\b/gi, 'S.T.A.R. method');
  text = text.replace(/\bSTAR\b/g, 'S.T.A.R.');
  text = text.replace(/\bPub\/Sub\b/gi, 'Pub Sub');
  text = text.replace(/\bWPM\b/gi, 'words per minute');
  text = text.replace(/\bUI\/UX\b/gi, 'user interface and experience');
  text = text.replace(/\bUI\b/g, 'U.I.');
  text = text.replace(/\bUX\b/g, 'U.X.');
  text = text.replace(/\bPR\b/g, 'pull request');
  text = text.replace(/\bPRs\b/g, 'pull requests');
  text = text.replace(/\bO\(1\)\b/gi, 'order of 1');
  text = text.replace(/\bO\(n\)\b/gi, 'order of n');
  text = text.replace(/\bO\(log n\)\b/gi, 'order of log n');
  text = text.replace(/\bO\(n\^2\)\b/gi, 'order of n squared');

  // 6. Natural breathing pauses: convert slashes and semicolons to pauses
  text = text.replace(/\s*\/\s*/g, ' or ');
  text = text.replace(/;/g, ',');

  // 7. Remove brackets and parentheses without losing content
  text = text.replace(/[\[\]()]/g, ' ');

  // 8. Collapse whitespace and trim
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Resolves the highest clarity voice from available browser speech synthesis voices.
 * Prioritizes Microsoft Natural Online, Google Natural, Samantha, Daniel, and Indian English neural models.
 */
export function resolveBestSpeechVoice(
  voices: SpeechSynthesisVoice[],
  settings?: Partial<AiVoiceSettings>
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  const preferredNames = settings?.preferred_browser_voices || DEFAULT_AI_VOICE_SETTINGS.preferred_browser_voices;
  const targetAccent = settings?.accent || 'en-IN';
  const targetGender = settings?.speaker_gender || 'female';

  // 1. Direct match on preferred high-clarity voice names
  for (const prefName of preferredNames) {
    const match = voices.find(v => v.name.toLowerCase().includes(prefName.toLowerCase()));
    if (match) return match;
  }

  // 2. High-clarity Natural Online voices (Edge & Windows 11 neural)
  const naturalVoices = voices.filter(v => 
    v.name.toLowerCase().includes('natural') || 
    v.name.toLowerCase().includes('online') ||
    v.name.toLowerCase().includes('neural')
  );

  if (targetAccent) {
    const langPrefix = targetAccent.toLowerCase();
    const matchedNatural = naturalVoices.find(v => v.lang.toLowerCase().replace('_', '-').startsWith(langPrefix));
    if (matchedNatural) return matchedNatural;
  }

  // 3. Indian English Natural / Google Voices
  if (targetAccent === 'en-IN') {
    const inVoice = voices.find(v => 
      v.lang.toLowerCase().includes('en-in') && 
      (v.name.includes('Google') || v.name.includes('Neerja') || v.name.includes('Heera') || v.name.includes('Prabhat'))
    );
    if (inVoice) return inVoice;
  }

  // 4. Quality English Google / Apple voices
  const googleVoice = voices.find(v => 
    v.lang.toLowerCase().startsWith('en') && 
    (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Aria') || v.name.includes('Guy'))
  );
  if (googleVoice) return googleVoice;

  // 5. Gender-matching English voice
  if (targetGender === 'female') {
    const femaleVoice = voices.find(v => 
      v.lang.toLowerCase().startsWith('en') && 
      (v.name.toLowerCase().includes('female') || v.name.includes('Zira') || v.name.includes('Jenny'))
    );
    if (femaleVoice) return femaleVoice;
  }

  // 6. Fallback to any English voice
  const fallbackEnglish = voices.find(v => v.lang.toLowerCase().startsWith('en'));
  return fallbackEnglish || voices[0] || null;
}
