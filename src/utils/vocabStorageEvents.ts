/** localStorage 写入失败（常见为超出配额）；由扫词续学快照写入处派发 */
export const VOCAB_STORAGE_QUOTA_EVENT = 'vocab-storage-quota';

export function dispatchVocabStorageQuota() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(VOCAB_STORAGE_QUOTA_EVENT));
}
