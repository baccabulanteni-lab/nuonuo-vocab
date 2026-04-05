/** 去掉行首序号：1. word / 1) word / 1、word（与 parseVocabLocal 一致） */
export function stripVocabLineIndex(s: string): string {
  return s.replace(/^\d+[\.\)、:：]\s*/, '');
}

/** 从释义串头部剥离音标，返回 { rest, phonetic } */
export function peelLeadingPhonetic(meaning: string): { rest: string; phonetic: string } {
  let rest = meaning.trim();
  let phonetic = '';
  const m1 = rest.match(/^\/[^/]+\//);
  if (m1) {
    phonetic = m1[0].slice(1, -1);
    rest = rest.slice(m1[0].length).trim();
    return { rest, phonetic };
  }
  const m2 = rest.match(/^\[[^\]]+\]/);
  if (m2) {
    phonetic = m2[0].slice(1, -1);
    rest = rest.slice(m2[0].length).trim();
    return { rest, phonetic };
  }
  return { rest, phonetic };
}

/** 词头词尾常见杂质（保留词内连字符与撇号） */
export function sanitizeWordToken(raw: string): string {
  return raw
    .replace(/^[\s"'「『【\[(]+/, '')
    .replace(/[\s"'」』】\])]+$/, '')
    .replace(/\*+$/, '')
    .trim();
}

const MAX_WORD_CHARS = 72;

export function parseCustomTxtContent(text: string, idPrefix: string = 'custom') {
  const rawLines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  const list = [];
  const skippedLines: string[] = [];

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    const content = stripVocabLineIndex(trimmed);

    // Skip specific headers or noise
    if (/^Word List\s+\d+/i.test(content)) {
      skippedLines.push(trimmed);
      continue;
    }

    // Skip overly long Chinese-only lines (likely sentences or noise, not word entries)
    if (content.length > 60 && /^[\u4e00-\u9fff\s，。；：]+$/u.test(content)) {
      skippedLines.push(trimmed);
      continue;
    }

    let wordRaw = '';
    let meaning = '';

    // 1. Tab separated (High precision)
    const tabPos = content.indexOf('\t');
    if (tabPos !== -1) {
      wordRaw = content.slice(0, tabPos).trim();
      meaning = content.slice(tabPos + 1).trim();
    } else {
      const pipePos = content.indexOf('|');
      if (pipePos !== -1) {
        wordRaw = content.slice(0, pipePos).trim();
        meaning = content.slice(pipePos + 1).trim();
      } else {
        // 2. Comma / Semicolon / CSV Style (Supports quotes and full-width punctuation)
        const csvRegex = /^"?([a-zA-Z][a-zA-Z0-9\-' ]{0,70})"?\s*[,，;；]\s*(.+)$/;
        const csvMatch = content.match(csvRegex);
        if (csvMatch) {
          wordRaw = csvMatch[1].trim();
          let m = csvMatch[2].trim();
          if (m.startsWith('"') && m.endsWith('"')) {
            m = m.slice(1, -1).trim();
          }
          meaning = m;
        } else {
          // 3. Multi-space/Full-width space separator
          const multiSpace = content.match(/\s{2,}|\u3000/);
          if (multiSpace) {
            wordRaw = content.slice(0, multiSpace.index).trim();
            meaning = content.slice(multiSpace.index! + multiSpace[0].length).trim();
          } else {
            // 4. Boundary search (Parts of speech, phonetic brackets, CJK characters)
            const boundary = content.match(
              /\s+([\[\(\/<\u4e00-\u9fa5]|v\.|n\.|adj\.|adv\.|prep\.|conj\.|pron\.|art\.|num\.|int\.|vi\.|vt\.)/i
            );
            if (boundary && boundary.index !== undefined) {
              wordRaw = content.slice(0, boundary.index).trim();
              meaning = content.slice(boundary.index + boundary[0].length - boundary[1].length).trim();
            } else {
              // 5. Directly attached phonetics or meanings (e.g., word[phonetic]meaning or word/phonetic/meaning without space)
              const directAttachment = content.match(/^([a-zA-Z][a-zA-Z0-9\-' ]{0,70})([\[\/<\u4e00-\u9fa5].*)$/);
              if (directAttachment) {
                wordRaw = directAttachment[1].trim();
                meaning = directAttachment[2].trim();
              } else {
                // 6. Basic single space fallback
                const firstSpace = content.indexOf(' ');
                if (firstSpace !== -1) {
                  wordRaw = content.slice(0, firstSpace).trim();
                  meaning = content.slice(firstSpace + 1).trim();
                } else {
                  wordRaw = content;
                  meaning = '';
                }
              }
            }
          }
        }
      }
    }

    wordRaw = sanitizeWordToken(wordRaw);
    if (!wordRaw || !/[a-zA-Z]/.test(wordRaw)) {
      skippedLines.push(trimmed);
      continue;
    }
    if (wordRaw.length > MAX_WORD_CHARS) {
      skippedLines.push(trimmed);
      continue;
    }

    let phonetic = '';
    const inlinePh = wordRaw.match(/^(.+?)\s+(\/[^/]+\/|\[[^\]]+\])\s*$/);
    if (inlinePh) {
      wordRaw = sanitizeWordToken(inlinePh[1]);
      const seg = inlinePh[2];
      phonetic = seg.startsWith('/') ? seg.slice(1, -1) : seg.slice(1, -1);
    }
    if (!wordRaw || !/[a-zA-Z]/.test(wordRaw) || wordRaw.length > MAX_WORD_CHARS) {
      skippedLines.push(trimmed);
      continue;
    }

    const peeled = peelLeadingPhonetic(meaning);
    if (peeled.phonetic && !phonetic) phonetic = peeled.phonetic;
    const meaningClean = peeled.rest;

    list.push({
      id: `${idPrefix}-${list.length + 1}`,
      word: wordRaw,
      meaning: meaningClean || '未提供释义',
      phonetic,
    });
  }

  return {
    list,
    totalLines: rawLines.length,
    skippedCount: skippedLines.length,
    skippedSamples: skippedLines.slice(0, 5)
  };
}

