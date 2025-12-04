
import { GoogleGenAI, Type } from '@google/genai';
import { AIGeneratedSentence } from '../types';

// Fix: Use process.env.API_KEY exclusively as per guidelines and to avoid ImportMeta error
const API_KEY = process.env.API_KEY || '';

if (!API_KEY) {
  console.warn("Gemini API key is not set. AI features will use mock data.");
}

// Initialize AI only if key exists to avoid immediate crash, handle inside function
const getAIClient = () => {
    if (API_KEY) {
        return new GoogleGenAI({ apiKey: API_KEY });
    }
    return null;
}

const sentenceSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      indonesian: { type: Type.STRING },
      english: { type: Type.STRING },
      mandarin: { type: Type.STRING },
      pinyin: { type: Type.STRING },
    },
    required: ["indonesian", "english", "mandarin", "pinyin"],
  },
};

interface SimpleVocab {
    id: number;
    indonesian: string;
    english: string;
    mandarin: string;
    pinyin: string;
}

export const generatePracticeSentences = async (
  vocab: SimpleVocab[],
  language: 'English' | 'Mandarin'
): Promise<AIGeneratedSentence[]> => {
  const ai = getAIClient();

  if (!ai) {
    console.warn("No API Key, returning mock sentences.");
    // Return mock data if API key is not available
    return [
      { indonesian: 'Kucing itu besar.', english: 'The cat is big.', mandarin: '那只猫很大。', pinyin: 'nà zhī māo hěn dà.' },
      { indonesian: 'Saya suka anjing kecil.', english: 'I like small dogs.', mandarin: '我喜欢小狗。', pinyin: 'wǒ xǐhuān xiǎo gǒu.' },
    ];
  }

  const vocabString = vocab.map(v => `${v.indonesian} (${language === 'English' ? v.english : v.mandarin})`).join(', ');

  const prompt = `
    You are a language teacher for an Indonesian speaker learning ${language}.
    Based on this vocabulary list: ${vocabString}.
    Generate 3 simple, new example sentences.
    Each sentence should use at least one word from the vocabulary list.
    Provide the sentence in Indonesian, English, Mandarin, and Pinyin.
    Return ONLY a JSON array that matches the provided schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: sentenceSchema,
      },
    });

    const jsonString = response.text ? response.text.trim() : '';
    if (!jsonString) throw new Error("Empty response");
    
    const sentences = JSON.parse(jsonString);
    return sentences as AIGeneratedSentence[];
  } catch (error) {
    console.error("Error generating sentences with Gemini:", error);
    // Fallback to mock data on API error
    return [
      { indonesian: 'Terjadi kesalahan saat membuat kalimat.', english: 'An error occurred while creating sentences.', mandarin: '创建句子时发生错误。', pinyin: 'chuàngjiàn jùzi shí fāshēng cuòwù.' },
    ];
  }
};
