const htmlInput = document.getElementById('html-code');
const cssInput = document.getElementById('css-code');
const jsInput = document.getElementById('js-code');
const previewFrame = document.getElementById('preview');
const saveBtn = document.getElementById('save-btn');

// Canlı önizleme
function updatePreview() {
  const html = htmlInput.value;
  const css = `<style>${cssInput.value}</style>`;
  const js = `<script>${jsInput.value}<\/script>`;
  const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  doc.open();
  doc.write(html + css + js);
  doc.close();
}

// localStorage
window.addEventListener('load', () => {
  if (localStorage.getItem('htmlCode')) htmlInput.value = localStorage.getItem('htmlCode');
  if (localStorage.getItem('cssCode')) cssInput.value = localStorage.getItem('cssCode');
  if (localStorage.getItem('jsCode')) jsInput.value = localStorage.getItem('jsCode');
  updatePreview();
});

// girişleri kaydet
function saveAndUpdate() {
  localStorage.setItem('htmlCode', htmlInput.value);
  localStorage.setItem('cssCode', cssInput.value);
  localStorage.setItem('jsCode', jsInput.value);
  updatePreview();
}

htmlInput.addEventListener('input', saveAndUpdate);
cssInput.addEventListener('input', saveAndUpdate);
jsInput.addEventListener('input', saveAndUpdate);

function beautifyCode(code) {
  if (!code) return '';
  const lines = code.replace(/\r\n/g, '\n').split('\n');
  let indentLevel = 0;
  const indentSize = 2;
  const result = [];

  lines.forEach(line => {
    let trimmed = line.trim();

    if (/^(\}|\<\/)/.test(trimmed)) indentLevel = Math.max(indentLevel - 1, 0);

    const indent = ' '.repeat(indentLevel * indentSize);
    result.push(indent + trimmed);

    if (/\{$/.test(trimmed) || /^<(?!\/)(?!br|img|input|link|meta|hr)([^>]+)>/.test(trimmed)) indentLevel++;
  });

  return result.join('\n');
}

// Dosyayı kaydet
saveBtn.addEventListener('click', () => {
  const htmlContent = beautifyCode(htmlInput.value);
  const cssContent = beautifyCode(cssInput.value);
  const jsContent = beautifyCode(jsInput.value);

  const fullHtml = `
<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Kaydedilen Sayfa</title>
<style>
${cssContent}
</style>
</head>
<body>
${htmlContent}

<script>
${jsContent}
</script>
</body>
</html>`.trim();

  const blob = new Blob([fullHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'index.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});


// ENTER & TAB tuşlarına basınca olacak event
function handleKeyDown(event) {
  const textarea = event.target;

  if (event.key === 'Tab') {
    event.preventDefault();
    handleTabShortcut(event);
  } else if (event.key === 'Enter') {
    event.preventDefault();
    handleEnterKey(textarea);
  }
}

htmlInput.addEventListener('keydown', handleKeyDown);
cssInput.addEventListener('keydown', handleKeyDown);
jsInput.addEventListener('keydown', handleKeyDown);

// Enter tuşuna basınca oluşacak event
function handleEnterKey(textarea) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;

  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const currentLine = value.substring(lineStart, start);

  const indentationMatch = currentLine.match(/^\s*/);
  const indentation = indentationMatch ? indentationMatch[0] : '';
  let newIndentation = indentation;

  const isInlineClosed = currentLine.trim().match(/^<([a-zA-Z][\w-]*)[^>]*>.*<\/\1>$/);
  if (isInlineClosed) {
    const tagName = isInlineClosed[1];
    const before = value.substring(0, start);
    const after = value.substring(end);

    const insideIndent = indentation + '  ';
    const insertText = '\n' + insideIndent + '\n' + indentation + `</${tagName}>`;

    textarea.value = before + insertText + after;
    textarea.selectionStart = textarea.selectionEnd = before.length + 1 + insideIndent.length;
    updatePreview();
    return;
  }

  if (textarea.id === 'html-code') {
    const openTagMatch = currentLine.trim().match(/^<([a-zA-Z][\w-]*)[^>]*>$/);
    if (openTagMatch) {
      const tagName = openTagMatch[1];
      const before = value.substring(0, start);
      const after = value.substring(end);

      const indentInside = indentation + '  ';
      const closingTagLine = indentation + `</${tagName}>`;

      const insertText = '\n' + indentInside + '\n';

      textarea.value = before + insertText + after;
      textarea.selectionStart = textarea.selectionEnd = before.length + 1 + indentInside.length;

      updatePreview();
      return;
    }
  }

  if (textarea.id === 'css-code' && currentLine.trim().endsWith('{')) {
    newIndentation += '  ';
    const before = value.substring(0, start);
    const after = value.substring(end);

    const closingLine = indentation + '}';
    const insertText = '\n' + newIndentation + '\n' + closingLine;

    textarea.value = before + insertText + after;
    textarea.selectionStart = textarea.selectionEnd = before.length + 1 + newIndentation.length;

    updatePreview();
    return;
  }

  insertPlainNewline(textarea, indentation);
}


//Yeni satır yardımcısı
function insertPlainNewline(textarea, indentation) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  const before = value.substring(0, start);
  const after = value.substring(end);
  const insertText = '\n' + indentation;
  textarea.value = before + insertText + after;
  const cursorPos = before.length + insertText.length;
  textarea.selectionStart = textarea.selectionEnd = cursorPos;
  updatePreview();
}

// Tab tuşuna basınca oto düzenlenen özellikler
function handleTabShortcut(event) {
  const textarea = event.target;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;

  const before = value.substring(0, start);
  const after = value.substring(end);

  const lineStart = before.lastIndexOf('\n') + 1;
  const currentLine = before.substring(lineStart);

  const indentationMatch = currentLine.match(/^\s*/);
  const indentation = indentationMatch ? indentationMatch[0] : "";

  const wordMatch = currentLine.match(/(\S+)$/);

  if (wordMatch) {
    const token = wordMatch[1];

    const specialAttributes = {
      'a': ' href="" target="_blank"',
      'img': ' src="" alt=""',
      'input': ' type=""',
      'form': ' action="" method=""',
      'link': ' rel="" href=""',
      'script': ' src=""',
      'meta': ' charset=""',
      'button': ' type=""',
      'textarea': '',
      'select': '',
    };

    let tag = 'div';
    let className = '';
    let idName = '';

    const tagMatch = token.match(/^([a-zA-Z][\w-]*)/);
    if (tagMatch) tag = tagMatch[1];

    const classMatch = token.match(/\.([\w-]+)/);
    if (classMatch) className = classMatch[1];

    const idMatch = token.match(/#([\w-]+)/);
    if (idMatch) idName = idMatch[1];

    let attributes = '';
    if (className) attributes += ` class="${className}"`;
    if (idName) attributes += ` id="${idName}"`;
    if (specialAttributes[tag]) attributes += specialAttributes[tag];

    const selfClosingTags = ['img', 'input', 'link', 'meta'];
    let replacement = '';

    if (selfClosingTags.includes(tag.toLowerCase())) {
      replacement = `<${tag}${attributes} />`;
    } else {
      replacement = `<${tag}${attributes}></${tag}>`;
    }

    const newBefore = before.substring(0, before.length - token.length) + replacement;
    let newCursor = newBefore.length;

    if (!selfClosingTags.includes(tag.toLowerCase())) {
      newCursor -= (`</${tag}>`.length);
    }

    textarea.value = newBefore + after;
    textarea.selectionStart = textarea.selectionEnd = newCursor;

  } else {
    const tabSize = 2;
    const spaces = ' '.repeat(tabSize);
    textarea.value = before + spaces + after;
    textarea.selectionStart = textarea.selectionEnd = start + tabSize;
  }

  updatePreview();
}

// Modal ve dosya elemanları
const loadBtn = document.getElementById('load-btn');
const loadModal = document.getElementById('load-modal');
const closeModal = document.getElementById('close-modal');

const fullHtmlFile = document.getElementById('full-html-file');
const htmlFile = document.getElementById('html-file');
const cssFile = document.getElementById('css-file');
const jsFile = document.getElementById('js-file');

// Modal aç/kapat
loadBtn.addEventListener('click', () => loadModal.classList.remove('hidden'));
closeModal.addEventListener('click', () => loadModal.classList.add('hidden'));

// Yardımcı: Dosya okuma
function readFileInput(input, callback) {
  if (input.files.length > 0) {
    const reader = new FileReader();
    reader.onload = (e) => callback(e.target.result);
    reader.readAsText(input.files[0]);
  }
}

// Tam HTML dosyasını ayrıştır ve yükle
function parseAndLoadFullHtml(content) {
  // Style
  let css = '';
  content = content.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (match, p1) => {
    css = p1.trim();
    return '';
  });

  // Script
  let js = '';
  content = content.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, (match, p1) => {
    js = p1.trim();
    return '';
  });

  // Kalan HTML
  const html = content
    .replace(/<!DOCTYPE[^>]*>/i, '')
    .replace(/<html[^>]*>/i, '')
    .replace(/<\/html>/i, '')
    .replace(/<head[^>]*>[\s\S]*?<\/head>/i, '')
    .replace(/<body[^>]*>/i, '')
    .replace(/<\/body>/i, '')
    .trim();

  htmlInput.value = html;
  cssInput.value = css;
  jsInput.value = js;
  updatePreview();
}

// Full HTML dosyasını yükle
fullHtmlFile.addEventListener('change', () => {
  readFileInput(fullHtmlFile, (content) => {
    parseAndLoadFullHtml(content);
    loadModal.classList.add('hidden');
  });
});

// Ayrı ayrı dosyalar
htmlFile.addEventListener('change', () => {
  readFileInput(htmlFile, (content) => {
    htmlInput.value = content.trim();
    updatePreview();
    loadModal.classList.add('hidden');
  });
});
cssFile.addEventListener('change', () => {
  readFileInput(cssFile, (content) => {
    cssInput.value = content.trim();
    updatePreview();
    loadModal.classList.add('hidden');
  });
});
jsFile.addEventListener('change', () => {
  readFileInput(jsFile, (content) => {
    jsInput.value = content.trim();
    updatePreview();
    loadModal.classList.add('hidden');
  });
});
