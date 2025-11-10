declare global {
  interface Window {
    tinymce?: TinyMceGlobal; // ← any 금지, 실제 인터페이스 사용
  }
}
