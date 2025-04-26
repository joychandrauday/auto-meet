chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "setAlarm") {
    chrome.alarms.create("joinMeet", { when: message.time });
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "joinMeet") {
    chrome.storage.local.get(["meetLink"], ({ meetLink }) => {
      if (meetLink) {
        chrome.tabs.create({ url: meetLink });
      }
    });
  }
});
