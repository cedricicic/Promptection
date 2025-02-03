document.addEventListener('DOMContentLoaded', () => {

  const mainToggle = document.getElementById('main-toggle');
  const patternList = document.getElementById('pattern-list');
  const maskingOptions = document.querySelectorAll('input[name="masking-style"]');
  const clearDataBtn = document.getElementById('clear-data');
  const statsElement = document.getElementById('stats');

  
  chrome.storage.sync.get('state', (data) => {
    if (data.state) {
      updateUI(data.state);
    }
  });

  
  function updateUI(state) {

    mainToggle.checked = state.enabled;

    patternList.innerHTML = ''; 
    Object.entries(state.settings.patterns).forEach(([pattern, isEnabled]) => {
      const patternItem = createPatternItem(pattern, isEnabled);
      patternList.appendChild(patternItem);
    });

   
    const maskingStyle = document.querySelector(`input[value="${state.settings.maskStyle}"]`);
    if (maskingStyle) {
      maskingStyle.checked = true;
    }

    
    const replacedCount = Object.keys(state.replacements).length;
    statsElement.textContent = `Protected ${replacedCount} items`;
  }

  
  function createPatternItem(pattern, isEnabled) {
    const patternItem = document.createElement('div');
    patternItem.className = 'pattern-item';

    const patternName = document.createElement('span');
    patternName.className = 'pattern-name';
    patternName.textContent = pattern.replace(/([A-Z])/g, ' $1').trim(); 

    const toggleSwitch = createToggleSwitch(isEnabled, (checked) => {
      updatePatternState(pattern, checked);
    });

    patternItem.appendChild(patternName);
    patternItem.appendChild(toggleSwitch);

    return patternItem;
  }

 
  function createToggleSwitch(checked, onChange) {
    const toggleSwitch = document.createElement('label');
    toggleSwitch.className = 'toggle-switch';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    input.addEventListener('change', (e) => onChange(e.target.checked));

    const slider = document.createElement('span');
    slider.className = 'slider';

    toggleSwitch.appendChild(input);
    toggleSwitch.appendChild(slider);

    return toggleSwitch;
  }

  
  function updatePatternState(pattern, isEnabled) {
    chrome.storage.sync.get('state', (data) => {
      const newState = {
        ...data.state,
        settings: {
          ...data.state.settings,
          patterns: {
            ...data.state.settings.patterns,
            [pattern]: isEnabled,
          },
        },
      };
      saveAndBroadcastState(newState);
    });
  }

  
  mainToggle.addEventListener('change', () => {
    chrome.storage.sync.get('state', (data) => {
      const newState = {
        ...data.state,
        enabled: mainToggle.checked,
      };
      saveAndBroadcastState(newState);
    });
  });

 
  maskingOptions.forEach(option => {
    option.addEventListener('change', () => {
      chrome.storage.sync.get('state', (data) => {
        const newState = {
          ...data.state,
          settings: {
            ...data.state.settings,
            maskStyle: option.value,
          },
        };
        saveAndBroadcastState(newState);
      });
    });
  });

  
  clearDataBtn.addEventListener('click', () => {
    chrome.storage.sync.get('state', (data) => {
      const newState = {
        ...data.state,
        counter: 0,
        replacements: {},
      };
      saveAndBroadcastState(newState);
      statsElement.textContent = 'Protected 0 items';
    });
  });

  
  function saveAndBroadcastState(newState) {
    chrome.storage.sync.set({ state: newState }, () => {
      updateUI(newState); 
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'updateState',
          state: newState,
        });
      });
    });
  }
});