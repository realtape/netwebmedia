
const b64 = window.__ytC.join('');
const binStr = atob(b64);
const bytes = new Uint8Array(binStr.length);
for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
const blob = new Blob([bytes], {type: 'video/mp4'});
const file = new File([blob], 'reel-08-340k-pipeline.mp4', {type: 'video/mp4', lastModified: Date.now()});

const findFileInput = (root) => {
  const inputs = root.querySelectorAll('input[type="file"]');
  if (inputs.length > 0) return inputs[0];
  for (const el of root.querySelectorAll('*')) {
    if (el.shadowRoot) { const f = findFileInput(el.shadowRoot); if (f) return f; }
  }
  return null;
};
const inp = findFileInput(document);
if (!inp) { window.__ytStatus = 'ERROR: no input found'; }
else {
  const dt = new DataTransfer();
  dt.items.add(file);
  Object.defineProperty(inp, 'files', { get: () => dt.files, configurable: true });
  inp.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  window.__ytStatus = 'DONE: ' + file.size + ' bytes injected';
}
window.__ytStatus
