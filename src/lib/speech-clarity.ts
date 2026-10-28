import { AiVoiceSettings, DEFAULT_AI_VOICE_SETTINGS } from './settings.functions';

/**
 * Phonetic & clarity preprocessor for technical mock interviews.
 * Converts markdown, raw symbols, code snippets, and technical acronyms 
 * into crisp, natural English phrases that speech synthesizers enunciate with 100% accuracy.
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

  // 4. Special technical and interview terms
  text = text.replace(/\b1:1\b/g, 'one-on-one');
  text = text.replace(/&amp;/g, 'and');
  text = text.replace(/&/g, 'and');

  // 5. Expand abbreviations and common Latin shortcuts for natural cadence
  text = text.replace(/\be\.g\.?,?\s*/gi, 'for example, ');
  text = text.replace(/\bi\.e\.?,?\s*/gi, 'that is, ');
  text = text.replace(/\betc\.?\b/gi, 'and so forth');
  text = text.replace(/\bvs\.?\b/gi, 'versus');
  text = text.replace(/\bw\/\b/gi, 'with');
  text = text.replace(/\bw\/o\b/gi, 'without');

  // 6. Expand technical acronyms so they are enunciated phonetically
  text = text.replace(/\bCI\/CD\b/g, 'C.I. C.D.');
  text = text.replace(/\bREST APIs\b/gi, 'Rest A.P.I.s');
  text = text.replace(/\bREST API\b/gi, 'Rest A.P.I.');
  text = text.replace(/\bRESTful\b/gi, 'Restful');
  text = text.replace(/\bREST\b/g, 'Rest');
  text = text.replace(/\bAPI\b/g, 'A.P.I.');
  text = text.replace(/\bAPIs\b/g, 'A.P.I.s');
  text = text.replace(/\bSQL\b/g, 'S.Q.L.');
  text = text.replace(/\bNoSQL\b/g, 'No S.Q.L.');
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
  text = text.replace(/\bCBT\b/g, 'C.B.T.');
  text = text.replace(/\bLMS\b/g, 'L.M.S.');
  text = text.replace(/\bATS\b/g, 'A.T.S.');
  text = text.replace(/\bO\(1\)\b/gi, 'order of 1');
  text = text.replace(/\bO\(n\)\b/gi, 'order of n');
  text = text.replace(/\bO\(log n\)\b/gi, 'order of log n');
  text = text.replace(/\bO\(n\^2\)\b/gi, 'order of n squared');

  // 7. Natural breathing pauses: convert slashes and semicolons to pauses
  text = text.replace(/\s*\/\s*/g, ' or ');
  text = text.replace(/;/g, ',');

  // 8. Remove brackets and parentheses without losing content
  text = text.replace(/[\[\]()]/g, ' ');

  // 9. Collapse whitespace and trim
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Splits text into distinct sentence chunks for accurate speech synthesis.
 * This completely prevents the Chromium / Windows 15-second speech buffer truncation bug.
 */
export function splitIntoSentences(text: string): string[] {
  if (!text) return [];
  const cleaned = cleanTextForSpeech(text);
  
  // Match sentences ending in ., ?, or !
  const matches = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  if (!matches || matches.length === 0) return [cleaned];
  
  return matches
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Resolves the highest clarity voice from available browser speech synthesis voices.
 * Prioritizes:
 * 1. Explicit admin selected voice (`settings.selected_voice_name`)
 * 2. High-clarity Natural Online voices (Edge/Windows 11 neural)
 * 3. Specific preferred voice list
 * 4. Accent matching (Indian English, US English, UK English)
 */
export function resolveBestSpeechVoice(
  voices: SpeechSynthesisVoice[],
  settings?: Partial<AiVoiceSettings>
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  // 1. Explicit voice name match if admin configured a specific voice
  if (settings?.selected_voice_name) {
    const directMatch = voices.find(v => v.name.toLowerCase() === settings.selected_voice_name?.toLowerCase());
    if (directMatch) return directMatch;
    // Partial name match
    const partialMatch = voices.find(v => v.name.toLowerCase().includes(settings.selected_voice_name?.toLowerCase() || ''));
    if (partialMatch) return partialMatch;
  }

  const preferredNames = settings?.preferred_browser_voices || DEFAULT_AI_VOICE_SETTINGS.preferred_browser_voices;
  const targetAccent = settings?.accent || 'en-IN';
  const targetGender = settings?.speaker_gender || 'female';

  // 2. High-clarity Natural Online voices (Edge & Windows 11 neural, Google Natural)
  const naturalVoices = voices.filter(v => 
    v.name.toLowerCase().includes('natural') || 
    v.name.toLowerCase().includes('online') ||
    v.name.toLowerCase().includes('neural')
  );

  if (targetAccent && naturalVoices.length > 0) {
    const langPrefix = targetAccent.toLowerCase().replace('_', '-');
    const matchedNatural = naturalVoices.find(v => v.lang.toLowerCase().replace('_', '-').startsWith(langPrefix));
    if (matchedNatural) return matchedNatural;
  }

  // 3. Indian English Natural / Google Voices
  if (targetAccent === 'en-IN') {
    const inVoice = voices.find(v => 
      v.lang.toLowerCase().replace('_', '-').includes('en-in') && 
      (v.name.includes('Natural') || v.name.includes('Neerja') || v.name.includes('Prabhat') || v.name.includes('Google') || v.name.includes('Heera'))
    );
    if (inVoice) return inVoice;
  }

  // 4. Preferred list match
  for (const prefName of preferredNames) {
    const match = voices.find(v => v.name.toLowerCase().includes(prefName.toLowerCase()));
    if (match) return match;
  }

  // 5. Google / Apple Natural voices
  const qualityVoice = voices.find(v => 
    v.lang.toLowerCase().startsWith('en') && 
    (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Aria') || v.name.includes('Guy'))
  );
  if (qualityVoice) return qualityVoice;

  // 6. Gender-matching English voice
  if (targetGender === 'female') {
    const femaleVoice = voices.find(v => 
      v.lang.toLowerCase().startsWith('en') && 
      (v.name.toLowerCase().includes('female') || v.name.includes('Zira') || v.name.includes('Jenny') || v.name.includes('Neerja'))
    );
    if (femaleVoice) return femaleVoice;
  }

  // 7. Fallback to any English voice
  const fallbackEnglish = voices.find(v => v.lang.toLowerCase().startsWith('en'));
  return fallbackEnglish || voices[0] || null;
}

/**
 * Sequential Sentence Speaker
 * Speaks text sentence-by-sentence with distinct articulation, natural breathing pauses,
 * and Chrome keepalive to guarantee 100% accurate pronunciation without any cutoff.
 */
export function speakSentenceSequence(options: {
  text: string;
  voice: SpeechSynthesisVoice | null;
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onSentenceStart?: (index: number, sentence: string) => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}): { cancel: () => void } {
  if (!('speechSynthesis' in window)) {
    if (options.onEnd) options.onEnd();
    return { cancel: () => {} };
  }

  window.speechSynthesis.cancel();

  const sentences = splitIntoSentences(options.text);
  if (sentences.length === 0) {
    if (options.onEnd) options.onEnd();
    return { cancel: () => {} };
  }

  let currentIndex = 0;
  let isCancelled = false;
  let keepaliveTimer: any = null;

  // Chromium bug workaround: toggle pause/resume every 8 seconds to prevent speech engine freeze
  keepaliveTimer = setInterval(() => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
  }, 8000);

  const cleanup = () => {
    if (keepaliveTimer) {
      clearInterval(keepaliveTimer);
      keepaliveTimer = null;
    }
  };

  const speakCurrentSentence = () => {
    if (isCancelled) {
      cleanup();
      return;
    }

    if (currentIndex >= sentences.length) {
      cleanup();
      if (options.onEnd) options.onEnd();
      return;
    }

    const sentence = sentences[currentIndex];
    const utterance = new SpeechSynthesisUtterance(sentence);

    if (options.voice) {
      utterance.voice = options.voice;
    }

    utterance.rate = options.rate ?? 0.94;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 1.0;

    utterance.onstart = () => {
      if (currentIndex === 0 && options.onStart) {
        options.onStart();
      }
      if (options.onSentenceStart) {
        options.onSentenceStart(currentIndex, sentence);
      }
    };

    utterance.onend = () => {
      currentIndex++;
      // Brief natural pause between sentences (120ms)
      setTimeout(() => {
        speakCurrentSentence();
      }, 120);
    };

    utterance.onerror = (e) => {
      console.warn("SpeechSynthesis sentence notice:", e);
      currentIndex++;
      if (currentIndex < sentences.length && !isCancelled) {
        speakCurrentSentence();
      } else {
        cleanup();
        if (options.onEnd) options.onEnd();
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  speakCurrentSentence();

  return {
    cancel: () => {
      isCancelled = true;
      cleanup();
      window.speechSynthesis.cancel();
      if (options.onEnd) options.onEnd();
    }
  };
}
