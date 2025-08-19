const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMS = '0123456789';
const SYMS = '!@#$%^&*()-_=+[]{};:,.<>/?|~';

// Elements
const pwBox = document.getElementById('pw');
const genBtn = document.getElementById('genBtn');
const lengthRange = document.getElementById('length');
const lenValue = document.getElementById('lenValue');
const cbLower = document.getElementById('lower');
const cbUpper = document.getElementById('upper');
const cbNums = document.getElementById('numbers');
const cbSyms = document.getElementById('symbols');
const strengthBar = document.getElementById('strengthBar');
const strengthText = document.getElementById('strengthText');
const toast = document.getElementById('toast');
const copyBtn = document.getElementById('copyBtn');
const copyAll = document.getElementById('copyAll');
const regen = document.getElementById('regen');

// Update length display
lenValue.textContent = lengthRange.value;
lengthRange.addEventListener('input', () => {
  lenValue.textContent = lengthRange.value;
  updateStrength(pwBox.textContent);
});

// Utility: secure random integer in [0, max)
function secureRandomInt(max) {
  if (window.crypto && window.crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    return arr[0] % max;
  } else {
    return Math.floor(Math.random() * max);
  }
}

// Generate password
function generatePassword() {
  const length = parseInt(lengthRange.value, 10);
  let pool = '';
  const chosenSets = [];

  if (cbLower.checked) { pool += LOWER; chosenSets.push(LOWER); }
  if (cbUpper.checked) { pool += UPPER; chosenSets.push(UPPER); }
  if (cbNums.checked)  { pool += NUMS;  chosenSets.push(NUMS); }
  if (cbSyms.checked)  { pool += SYMS;  chosenSets.push(SYMS); }

  if (!pool) {
    pwBox.textContent = 'Choose at least one character type';
    strengthBar.style.width = '0%';
    strengthBar.style.background = getComputedStyle(document.documentElement).getPropertyValue('--danger') || '#ef4444';
    strengthText.textContent = 'N/A';
    return;
  }

  // Ensure at least one char from each chosen set for better coverage
  const passwordChars = [];
  for (const set of chosenSets) {
    passwordChars.push(set[secureRandomInt(set.length)]);
  }

  for (let i = passwordChars.length; i < length; i++) {
    passwordChars.push(pool[secureRandomInt(pool.length)]);
  }

  // Shuffle using Fisher-Yates with secure random
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  const password = passwordChars.join('');
  pwBox.textContent = password;
  updateStrength(password);
  return password;
}

// Strength estimation (simple heuristic)
function updateStrength(password) {
  if (!password || password.startsWith('Choose') || password.length === 0) {
    strengthBar.style.width = '0%';
    strengthBar.style.background = '#ef4444';
    strengthText.textContent = '—';
    return;
  }

  let score = 0;
  const length = password.length;
  if (length >= 8) score += 1;
  if (length >= 12) score += 1;
  if (length >= 16) score += 1;

  // character variety
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNum = /[0-9]/.test(password);
  const hasSym = /[!@#$%^&*()_\-+=\[\]{};:,.<>\/?\\|~]/.test(password);

  const variety = [hasLower, hasUpper, hasNum, hasSym].filter(Boolean).length;
  score += Math.min(3, variety); // up to 3 points

  // score range 0..6 -> convert to percentage
  const pct = Math.round((score / 6) * 100);
  strengthBar.style.width = pct + '%';

  let color = '#ef4444'; // red
  let text = 'Weak';
  if (pct >= 80) { color = '#16a34a'; text = 'Excellent'; }
  else if (pct >= 60) { color = '#22c55e'; text = 'Strong'; }
  else if (pct >= 40) { color = '#f59e0b'; text = 'Medium'; }

  strengthBar.style.background = color;
  strengthText.textContent = text;
}

// Copy to clipboard and show toast
async function copyText(text) {
  try {
    if (!text || text === 'Click Generate to create password' || text.startsWith('Choose')) {
      showToast('No password to copy');
      return;
    }
    await navigator.clipboard.writeText(text);
    showToast('Password copied to clipboard');
  } catch (err) {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast('Password copied to clipboard');
    } catch (e) {
      showToast('Copy failed');
    }
    ta.remove();
  }
}

let toastTimer = null;
function showToast(msg) {
  toast.textContent = msg;
  toast.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.style.display = 'none';
  }, 1800);
}

// Event listeners
genBtn.addEventListener('click', () => generatePassword());
regen.addEventListener('click', () => generatePassword());
copyBtn.addEventListener('click', () => copyText(pwBox.textContent));
copyAll.addEventListener('click', () => copyText(pwBox.textContent));

// Generate initial password
window.addEventListener('load', () => {
  generatePassword();
  // select all text on click for convenience
  pwBox.addEventListener('click', () => {
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(pwBox);
    sel.removeAllRanges();
    sel.addRange(range);
  });
});

// Re-generate when checkboxes change
[cbLower, cbUpper, cbNums, cbSyms].forEach(cb => {
  cb.addEventListener('change', () => {
    if (cbLower.checked || cbUpper.checked || cbNums.checked || cbSyms.checked) {
      generatePassword();
    } else {
      pwBox.textContent = 'Choose at least one character type';
      updateStrength('');
    }
  });
});
