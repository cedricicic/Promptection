
let state = {
  enabled: false,
  counter: 0,
  replacements: {},
  settings: {
    maskStyle: "replace",
    patterns: {
      Email: true,
      Password: true,
      CreditCard: true,
      Pin: true,
      Phone: true,
      Ssn: true,
      Address: true,
      MonetaryValue: true,
      Date: true,
      Timeframe: true,
      PassportNumber: true,
      DriversLicense: true,
      EmployeeId: true,
      StudentId: true,
      IpAddress: true,
      SocialMediaHandle: true,
      InvoiceNumber: true,
      MedicalRecordNumber: true,
      HealthInsuranceInfo: true,
      CaseNumber: true,
      ApiKey: true,
      Hostname: true,
      Gpa: true,
      Transcript: true,
      BankAccountNumber: true,
    },
  },
};

let isProcessing = false;


chrome.storage.sync.get("state", (data) => {
  if (data.state) {
    state = data.state;
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateState") {
    state = message.state;
    updateUI();
  }
});


const patterns = {

  Email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  Password: /(?<=password\s*[:=]\s*)\S+/gi,
  CreditCard: /\b(?:\d{4}[- ]?){3}\d{4}\b/g,
  Phone: /\b(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
  Ssn: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,

  Address: /\b\d+\s+([a-zA-Z]+\s*)+,\s*[a-zA-Z]+,\s*[A-Z]{2}\s*\d{5}\b/g,
  MonetaryValue: /\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g,
  Date: /\b(?:\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|[A-Za-z]+\s\d{1,2},\s\d{4})\b/g,
  Timeframe: /\bQ[1-4]\s+\d{4}\b/g,
  PassportNumber: /\b[A-Z]{1,2}\d{6,9}\b/g,
  DriversLicense: /\b[A-Z]{1,2}\d{6,8}\b/g,
  EmployeeId: /\bEMP\d{4,6}\b/gi,
  StudentId: /\bSTU\d{4,6}\b/gi,


  IpAddress: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
  SocialMediaHandle: /\B@[a-zA-Z0-9_]{1,15}\b/g,
  InvoiceNumber: /\bINV-\d{4,6}\b/gi,
  MedicalRecordNumber: /\bMRN\d{6,9}\b/gi,
  HealthInsuranceInfo: /\bPolicy\s*No:\s*[A-Z0-9]+\b/gi,
  CaseNumber: /\bCase\s*No:\s*\d{4,6}\b/gi,
  ApiKey: /\b[A-Za-z0-9]{20,40}\b/g,
  Gpa: /\bGPA:\s*[0-4]\.\d{1,2}\b/gi,
  Hostname: /\b[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+\b/g,
  Transcript: /\bTranscript\s*ID:\s*\d{6,9}\b/gi,
  BankAccountNumber: /\b\d{8,17}\b/g,
  Pin: /\b\d{4,6}\b/g,
};

function findPatterns(text) {
  const results = {};

  for (const [key, regex] of Object.entries(patterns)) {
    if (state.settings.patterns[key]) {
      const matches = text.match(regex);
      if (matches) {
        results[key] = matches;
       
        text = text.replace(regex, "");
      }
    }
  }

  return results;
}

function createUI() {
  const container = document.createElement("div");
  container.id = "input-protector-ui";
  container.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #D9D9D9;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 15px;
    z-index: 10000;
    font-family: Arial, sans-serif;
    max-width: 300px;
  `;

  const header = document.createElement("div");
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  `;

  const title = document.createElement("h4");
  title.textContent = "Promptection";
  title.style.cssText = `
    margin: 0;
    color: black;
  `;

  const toggleContainer = document.createElement("div");
  toggleContainer.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: 10px; 
  `;

  const clearButton = document.createElement("button");
  clearButton.textContent = "Clear Data";
  clearButton.style.cssText = `
    padding: 5px 8px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-size: 10px;
    background-color: black;
    color: white;
    transition: background-color 0.2s;
  `;

  clearButton.addEventListener("click", () => {
    revertMaskedText(); 
    state.replacements = {};
    state.counter = 0;
    chrome.storage.sync.set({ state });
    updateUI();
    chrome.runtime.sendMessage({ action: "stateUpdated", state });
  });

  const toggleButton = document.createElement("button");
  toggleButton.id = "input-protector-toggle";
  toggleButton.style.cssText = `
    padding: 5px 8px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-size: 10px;
    transition: background-color 0.2s;
    margin-left: 2px;
  `;

  const updateToggleButton = () => {
    toggleButton.textContent = state.enabled ? "Enabled" : "Disabled";
    toggleButton.style.backgroundColor = state.enabled
      ? "rgb(251, 101, 101)"
      : "rgb(158, 0, 33)";
    toggleButton.style.color = "#ffffff";
  };

  toggleButton.addEventListener("click", () => {
    state.enabled = !state.enabled;
    updateToggleButton();
    chrome.storage.sync.set({ state });
    chrome.runtime.sendMessage({ action: "stateUpdated", state });
  });

  const content = document.createElement("div");
  content.id = "input-protector-content";

  toggleContainer.appendChild(toggleButton);
  toggleContainer.appendChild(clearButton);
  header.appendChild(title);
  header.appendChild(toggleContainer);
  container.appendChild(header);
  container.appendChild(content);
  document.body.appendChild(container);

  updateToggleButton();

  return container;
}

function maskSensitiveInfo(match, type) {
  if (!state.enabled) return match;

  if (state.settings.maskStyle === "asterisk") {
    return "*".repeat(match.length);
  } else {
    if (!state.replacements[match]) {
      state.counter++;
      const replacement = `${type}-${String(state.counter).padStart(3, "0")}`;
      state.replacements[match] = replacement;
      chrome.storage.sync.set({ state });
    }
    return state.replacements[match];
  }
}

function revertMaskedText() {
  const inputs = document.querySelectorAll(
    'input:not([type="password"]), textarea, [contenteditable="true"]'
  );

  inputs.forEach((input) => {
    const isContentEditable = input.isContentEditable;
    let text = isContentEditable ? input.innerText : input.value;

    Object.entries(state.replacements).forEach(([original, replacement]) => {
      text = text.replace(replacement, original);
    });

    if (isContentEditable) {
      input.innerText = text;

      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(input);
      range.collapse(false); 
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      input.value = text;
    }
  });
}

function updateUI() {
  const content = document.getElementById("input-protector-content");
  if (!content) return;

  const toggleButton = document.getElementById("input-protector-toggle");
  if (toggleButton) {
    toggleButton.textContent = state.enabled ? "Enabled" : "Disabled";
    toggleButton.style.backgroundColor = state.enabled
      ? "rgb(251, 101, 101)"
      : "rgb(158, 0, 33)";
  }

  const groupedReplacements = {};
  Object.entries(state.replacements).forEach(([orig, rep]) => {
    const type = rep.split("-")[0];
    if (!groupedReplacements[type]) {
      groupedReplacements[type] = [];
    }
    groupedReplacements[type].push({ original: orig, replacement: rep });
  });

  Object.values(groupedReplacements).forEach((group) => {
    group.sort((a, b) => {
      const numA = parseInt(a.replacement.split("-")[1]);
      const numB = parseInt(b.replacement.split("-")[1]);
      return numA - numB;
    });
  });

  const html = `
    <div style="max-height: 300px; overflow-y: auto;">
      <h4 style="margin: 0 0 10px 0; color: black;">Detected Information:</h4>
      ${Object.entries(groupedReplacements)
        .map(
          ([type, items]) => `
        <div style="margin-bottom: 15px;">
          <div style="font-weight: bold; color: rgb(229, 81, 81); margin-bottom: 5px; text-transform: capitalize;">
            ${type} (${items.length})
          </div>
          <ul style="list-style: none; padding: 0; margin: 0;">
            ${items
              .map(
                ({ original, replacement }) => `
              <li style="margin-bottom: 5px; padding: 5px; background: #f5f5f5; border-radius: 4px;">
                <span style="color: black;">${replacement}</span> 
                <span style="color: black;">→</span> 
                <span style="color: rgb(251, 101, 101);">${
                  state.settings.maskStyle === "asterisk"
                    ? "*".repeat(original.length)
                    : original
                }</span>
              </li>
            `
              )
              .join("")}
          </ul>
        </div>
      `
        )
        .join("")}
    </div>
  `;

  content.innerHTML = html;
}

function detectAndReplace(input) {
  if (!state.enabled || isProcessing) return;

  try {
    isProcessing = true;

    const isContentEditable = input.isContentEditable;
    let originalText = isContentEditable ? input.innerText : input.value;
    let modifiedText = originalText;

    const matches = findPatterns(originalText);

    Object.entries(matches).forEach(([key, matchList]) => {
      matchList.forEach((match) => {
        modifiedText = modifiedText.replace(match, () => maskSensitiveInfo(match, key));
      });
    });

    if (modifiedText !== originalText) {
      requestAnimationFrame(() => {
        if (isContentEditable) {
          input.innerText = modifiedText;

          const range = document.createRange();
          const selection = window.getSelection();
          range.selectNodeContents(input);
          range.collapse(false); 
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          input.value = modifiedText;
        }

        updateUI();
      });
    }
  } finally {
    isProcessing = false;
  }
}
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const debouncedDetectAndReplace = debounce(
  (input) => detectAndReplace(input),
  100
);

function addInputListeners() {
  const inputs = document.querySelectorAll(
    'input:not([type="password"]), textarea, [contenteditable="true"]'
  );
  inputs.forEach((input) => {
    if (!input.dataset.protectorInitialized) {
      input.dataset.protectorInitialized = "true";

      input.addEventListener("input", (e) => {
        debouncedDetectAndReplace(e.target);
      });

      input.addEventListener("paste", (e) => {
        setTimeout(() => debouncedDetectAndReplace(e.target), 0);
      });
    }
  });
}

function initProtector() {
  createUI();
  addInputListeners();

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        requestAnimationFrame(() => addInputListeners());
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProtector);
} else {
  initProtector();
}

window.addEventListener("load", addInputListeners);