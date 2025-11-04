/*
 * Service worker for Firefox that reacts to custom commands to switch to the left or right tab, skipping collapsed tab groups.
 */

async function focusRelativeTab(direction) {
  // Get the currently active tab in the current window.
  const [activeTab] = await browser.tabs.query({
    currentWindow: true,
    active: true,
  });

  if (!activeTab) {
    return;
  }

  // Get all tabs in the current window ordered by index.
  const tabs = await browser.tabs.query({ currentWindow: true });

  // The next tab to the left or right of the active tab.
  const targetTab = tabs[activeTab.index + direction];

  // If the target tab is not in a group
  if (targetTab && targetTab.groupId === -1) {
    await browser.tabs.update(targetTab.id, { active: true });
    return;
  }
  // If the target tab is in a group
  else if (targetTab && targetTab.groupId !== -1) {
    // Get all collapsed tab groups
    const collapsedGroups = await browser.tabGroups.query({ collapsed: true });
    const collapsedGroupIds = new Set(collapsedGroups.map((group) => group.id));

    // Search for the next tab that is not in a collapsed group
    const end = direction > 0 ? tabs.length : -1;
    for (let i = activeTab.index + direction; i !== end; i += direction) {
      if (!collapsedGroupIds.has(tabs[i].groupId)) {
        await browser.tabs.update(tabs[i].id, { active: true });
        return;
      }
    }
  }
}

browser.commands.onCommand.addListener((command) => {
  switch (command) {
    case "focus-right-tab":
      void focusRelativeTab(1);
      break;
    case "focus-left-tab":
      void focusRelativeTab(-1);
      break;
    default:
      break;
  }
});
