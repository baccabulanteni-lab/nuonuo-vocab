/**
 * 单词读音：优先使用词典真人录音（dictionaryapi.dev），失败则回退到浏览器语音合成。
 * 真人音频需联网；TTS 可离线。口音由 `pronunciationAccent`（localStorage）控制：美音 / 英音。
 *
 * 说明：浏览器会拦截「无用户手势」的自动播放；异步拉 MP3 后再 play 常被判为自动播放。
 * 对策：tryUnlockAudioPlayback 在首次触摸学习区时解锁；倒计时循环先 TTS 再切真人；首词在拉取前先用 TTS 垫一层。
 */

import { getPronunciationAccent, type EnglishAccent } from './pronunciationAccent';

/** 递增后所有进行中的朗读（含 MP3 循环）都会停止 */
let speechLoopGeneration = 0;

let audioUnlockAttempted = false;

/** 在用户第一次触摸/点击学习区时调用，减轻 iOS/Chrome 对 HTMLAudio 自动播放的拦截 */
export function tryUnlockAudioPlayback(): void {
  if (audioUnlockAttempted || typeof window === 'undefined') return;
  audioUnlockAttempted = true;
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AC) {
      const ctx = new AC();
      void ctx.resume();
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
    }
  } catch {
    // ignore
  }
  try {
    const silent =
      'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';
    const a = new Audio(silent);
    a.volume = 0.02;
    void a.play().then(() => a.pause()).catch(() => {});
  } catch {
    // ignore
  }
}

let currentAudio: HTMLAudioElement | null = null;

const pronunciationCache = new Map<string, string | null>();
const MAX_PRONUNCIATION_CACHE = 400;

function normPronunciationKey(displayText: string): string {
  return displayText.trim().toLowerCase().replace(/\s+/g, ' ');
}

function cacheKeyFor(wordKey: string, accent: EnglishAccent): string {
  return `${wordKey}\t${accent}`;
}

function cachePronunciation(wordKey: string, accent: EnglishAccent, url: string | null): void {
  const ck = cacheKeyFor(wordKey, accent);
  if (pronunciationCache.size >= MAX_PRONUNCIATION_CACHE) {
    const first = pronunciationCache.keys().next().value;
    if (first !== undefined) pronunciationCache.delete(first);
  }
  pronunciationCache.set(ck, url);
}

/** 从 Free Dictionary API 的 phonetics 数组里按口音挑一条 MP3（文件名常含 -us / -uk / -au） */
function pickAudioUrlFromPhonetics(
  phonetics: Array<{ audio?: string }>,
  accent: EnglishAccent
): string | null {
  const urls = phonetics
    .map((p) => p?.audio)
    .filter((a): a is string => typeof a === 'string' && /^https?:\/\//i.test(a));
  if (urls.length === 0) return null;

  const isUk = (u: string) => /-uk\.mp3$/i.test(u) || /\/[^/]*-uk\.mp3/i.test(u);
  const isUs = (u: string) => /-us\.mp3$/i.test(u) || /\/[^/]*-us\.mp3/i.test(u);

  if (accent === 'uk') {
    // 1. 必须包含 -uk 标识
    const uk = urls.find(isUk);
    if (uk) return uk;
    // 2. 没有任何口音标识，或者显然不是 US 的
    return urls.find((u) => !isUs(u)) ?? null;
  }

  // 美音模式
  // 1. 优先找 -us 标识
  const us = urls.find(isUs);
  if (us) return us;
  // 2. 没有任何口音标识的（通常默认是美音）
  return urls.find((u) => !isUk(u)) ?? urls[0];
}

function stopHtmlAudio(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio = null;
  }
}

/** 从 Free Dictionary API 取与口音匹配的真人发音 MP3 地址 */
async function fetchDictionaryAudioUrl(term: string, accent: EnglishAccent): Promise<string | null> {
  const q = term.trim().toLowerCase();
  if (!q) return null;
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(q)}`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data) || !data[0] || typeof data[0] !== 'object') return null;
    const entry = data[0] as { phonetics?: Array<{ audio?: string }> };
    const phonetics = entry.phonetics;
    if (!Array.isArray(phonetics)) return null;
    return pickAudioUrlFromPhonetics(phonetics, accent);
  } catch {
    return null;
  }
}

/** 从 Google Translate 获取高质量 TTS 音频 (作为真人音频的补充) */
function fetchGoogleTtsUrl(text: string, accent: EnglishAccent): string {
  const tl = accent === 'uk' ? 'en-GB' : 'en-US';
  return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${tl}&client=tw-ob`;
}

/** 先整词/短语，再退回首词，结果带内存缓存（按当前口音分桶） */
export async function resolvePronunciationAudioUrl(displayText: string): Promise<string | null> {
  const accent = getPronunciationAccent();
  const key = normPronunciationKey(displayText);
  if (!key) return null;
  const ck = cacheKeyFor(key, accent);
  if (pronunciationCache.has(ck)) return pronunciationCache.get(ck) ?? null;

  // 【核心优化：使用有道直连真人源】实现零延迟、高响应、高音质
  // type=1: 英音, type=2: 美音
  const type = accent === 'uk' ? '1' : '2';
  const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(key)}&type=${type}`;

  // 缓存并直接返回，不需要 await 任何网络预检，由 Audio 对象的 onError 自动处理加载失败
  cachePronunciation(key, accent, url);
  return url;
}

function pickEnglishVoice(accent: EnglishAccent): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  // 优先级：Microsoft Natural (Online) > Google > 其它
  if (accent === 'uk') {
    return (
      voices.find((v) => v.lang.startsWith('en-GB') && /Natural|Online|Libby|Sonia|Mia/i.test(v.name)) ??
      voices.find((v) => v.lang.startsWith('en-GB') && /Google UK English/i.test(v.name)) ??
      voices.find(
        (v) =>
          v.lang.startsWith('en-GB') &&
          /Daniel|Kate|Serena|Martha|British|Siri/i.test(v.name)
      ) ??
      voices.find((v) => v.lang.startsWith('en-GB')) ??
      voices.find((v) => v.lang.startsWith('en-AU')) ??
      voices.find((v) => v.lang.startsWith('en-US')) ??
      voices.find((v) => v.lang.startsWith('en')) ??
      null
    );
  }

  return (
    voices.find((v) => v.lang.startsWith('en-US') && /Natural|Online|Aria|Jenny|Guy/i.test(v.name)) ??
    voices.find((v) => v.lang.startsWith('en-US') && /Google US English/i.test(v.name)) ??
    voices.find((v) => v.lang.startsWith('en-US') && /female|Samantha|Karen|Siri/i.test(v.name)) ??
    voices.find((v) => v.lang.startsWith('en-US')) ??
    voices.find((v) => v.lang.startsWith('en-GB')) ??
    voices.find((v) => v.lang.startsWith('en')) ??
    null
  );
}

/** 仅 TTS，不 cancel（由调用方保证已 stop） */
function speakTTSOnly(text: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const t = text.trim();
  if (!t) return;
  const accent = getPronunciationAccent();
  const u = new SpeechSynthesisUtterance(t);
  u.lang = accent === 'uk' ? 'en-GB' : 'en-US';
  u.rate = 0.9;
  u.pitch = 1;
  u.volume = 1;
  const voice = pickEnglishVoice(accent);
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}

export function cancelEnglishSpeech(): void {
  // 1. 立即递增全局 Generation，使所有旧的异步回调失效
  speechLoopGeneration += 2; // 跨步递增，确保彻底中断
  
  // 2. 停止 HTML5 Audio
  stopHtmlAudio();
  
  // 3. 停止 SpeechSynthesis 队列
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/** 仅停 TTS，不递增 generation（用于真人接手前掐掉垫底的合成音） */
function stopSpeechSynthesisOnly(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

function startTTSLoop(trimmed: string, shouldContinue: () => boolean, myGen: number): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  const speakOnce = () => {
    if (myGen !== speechLoopGeneration) return;
    if (!shouldContinue()) return;

    const accent = getPronunciationAccent();
    const u = new SpeechSynthesisUtterance(trimmed);
    u.lang = accent === 'uk' ? 'en-GB' : 'en-US';
    u.rate = 0.9;
    u.pitch = 1;
    u.volume = 1;
    const voice = pickEnglishVoice(accent);
    if (voice) u.voice = voice;

    const scheduleAgain = () => {
      if (myGen !== speechLoopGeneration) return;
      if (!shouldContinue()) return;
      window.setTimeout(() => speakOnce(), 320);
    };

    u.onend = scheduleAgain;
    u.onerror = () => {
      window.setTimeout(() => scheduleAgain(), 0);
    };

    try {
      window.speechSynthesis.speak(u);
    } catch {
      scheduleAgain();
    }
  };

  speakOnce();
}

function startHumanAudioLoop(
  url: string,
  trimmed: string,
  shouldContinue: () => boolean,
  myGen: number
): void {
  const playRound = () => {
    if (myGen !== speechLoopGeneration) return;
    if (!shouldContinue()) return;

    stopHtmlAudio();
    const a = new Audio(url);
    currentAudio = a;
    a.onended = () => {
      if (currentAudio === a) currentAudio = null;
      if (myGen !== speechLoopGeneration) return;
      if (!shouldContinue()) return;
      window.setTimeout(() => playRound(), 320);
    };
    a.onerror = () => {
      if (currentAudio === a) currentAudio = null;
      if (myGen !== speechLoopGeneration) return;
      startTTSLoop(trimmed, shouldContinue, myGen);
    };
    a.play().catch(() => {
      if (currentAudio === a) currentAudio = null;
      if (myGen !== speechLoopGeneration) return;
      startTTSLoop(trimmed, shouldContinue, myGen);
    });
  };

  playRound();
}

/**
 * 循环朗读：先立刻 TTS（易过自动播放策略），拉到真人 MP3 后切真人循环；由 shouldContinue 决定何时停（暂停、换词、倒计时结束等）。
 */
export function startPronunciationLoop(text: string, shouldContinue: () => boolean): void {
  const trimmed = text.trim();
  if (!trimmed) return;

  cancelEnglishSpeech();
  const myGen = speechLoopGeneration;

  void (async () => {
    const url = await resolvePronunciationAudioUrl(trimmed);
    if (speechLoopGeneration !== myGen) return;

    if (url) {
      // 找到真人 MP3，开始真人循环
      speechLoopGeneration += 1;
      const genHuman = speechLoopGeneration;
      if (!shouldContinue()) return;
      startHumanAudioLoop(url, trimmed, shouldContinue, genHuman);
    } else {
      // 彻底没真人源，回退到 TTS 循环
      if (!shouldContinue()) return;
      startTTSLoop(trimmed, shouldContinue, myGen);
    }
  })();
}

/** 仅 TTS 循环（与旧行为一致，供特殊场景） */
export function startEnglishSpeechLoop(text: string, shouldContinue: () => boolean): void {
  const trimmed = text.trim();
  if (!trimmed) return;
  cancelEnglishSpeech();
  const myGen = speechLoopGeneration;
  startTTSLoop(trimmed, shouldContinue, myGen);
}

/**
 * 单次朗读：优先真人；若尚未缓存则先 TTS 垫底（避免干等网络却被拦截无声），真人就绪后掐 TTS 再播 MP3。
 */
export async function pronounceWordPreferHuman(
  text: string,
  isCancelled?: () => boolean
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;

  cancelEnglishSpeech();
  const myGen = speechLoopGeneration;

  const url = await resolvePronunciationAudioUrl(trimmed);
  if (myGen !== speechLoopGeneration || isCancelled?.()) return;

  if (url) {
    stopSpeechSynthesisOnly();
    stopHtmlAudio();
    const a = new Audio(url);
    currentAudio = a;
    a.onended = () => {
      if (currentAudio === a) currentAudio = null;
    };
    try {
      await a.play();
    } catch {
      if (myGen !== speechLoopGeneration || isCancelled?.()) return;
      speakTTSOnly(trimmed);
    }
  } else {
    // 明确无真人源，执行 TTS
    speakTTSOnly(trimmed);
  }
}

/** 强制使用浏览器 TTS（单遍） */
export function speakEnglishText(text: string): void {
  const t = text.trim();
  if (!t) return;
  cancelEnglishSpeech();
  speakTTSOnly(t);
}

export function prefetchSpeechVoices(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.getVoices();
}
