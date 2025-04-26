// Show scheduled meet on load
window.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['meetLink', 'meetTime'], (data) => {
    if (data.meetLink && data.meetTime) {
      showScheduledMeet(data.meetLink, data.meetTime);
    }
  });
});

document.getElementById('save').addEventListener('click', () => {
  const link = document.getElementById('link').value;
  const time = new Date(document.getElementById('time').value).getTime();

  if (!link || !time) {
    showToast("Please enter both the link and time.", true);
    return;
  }

  chrome.storage.local.set({ meetLink: link, meetTime: time }, () => {
    chrome.runtime.sendMessage({ action: "setAlarm", time });
    showToast("Meeting scheduled!");
    showScheduledMeet(link, time);
  });
});

function showScheduledMeet(link, time) {
  const scheduledMeet = document.getElementById('scheduledMeet');
  const meetLinkText = document.getElementById('meetLinkText');
  const meetTimeText = document.getElementById('meetTimeText');
  const countdown = document.getElementById('countdown');

  scheduledMeet.style.display = 'block';
  document.getElementById('formContainer').style.display = 'none';

  meetLinkText.innerHTML = `<strong>Meet Link:</strong> <a href="${link}" target="_blank" style="color: #4ade80;">Join Now</a>`;
  meetTimeText.innerHTML = `<strong>Scheduled For:</strong> ${new Date(time).toLocaleString()}`;

  updateCountdown(time);

  const intervalId = setInterval(() => {
    updateCountdown(time, intervalId);
  }, 1000);

  // Delete button
  document.getElementById('deleteButton').addEventListener('click', () => {
    chrome.storage.local.remove(['meetLink', 'meetTime'], () => {
      scheduledMeet.style.display = 'none';
      document.getElementById('formContainer').style.display = 'block';
      showToast("Scheduled meeting deleted.");
      clearInterval(intervalId);
    });
  });
}

function updateCountdown(targetTime, intervalId) {
  const now = Date.now();
  const distance = targetTime - now;

  const countdown = document.getElementById('countdown');

  if (distance <= 0) {
    countdown.textContent = "Meeting time reached!";
    clearInterval(intervalId);

    chrome.notifications.create('meet_notification', {
      type: 'basic',
      iconUrl: 'icon.png',
      title: 'Meeting Time!',
      message: 'Your scheduled meeting is starting now. Click to join!',
      priority: 2
    });

    // Save the meet link for later use
    chrome.storage.local.get(['meetLink'], (data) => {
      if (data.meetLink) {
        chrome.storage.local.set({ currentMeetingLink: data.meetLink });
      }
    });

  } else {
    const hours = Math.floor((distance / (1000 * 60 * 60)));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    countdown.textContent = `⏳ Starts in: ${hours}h ${minutes}m ${seconds}s`;
  }
}

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.style.background = isError ? "#f87171" : "#4ade80"; // red for error, green for success
  toast.style.display = 'block';

  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

// Listen for notification click
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId === 'meet_notification') {
    chrome.storage.local.get(['currentMeetingLink'], (data) => {
      if (data.currentMeetingLink) {
        chrome.tabs.create({ url: data.currentMeetingLink });
      }
    });
  }
});
