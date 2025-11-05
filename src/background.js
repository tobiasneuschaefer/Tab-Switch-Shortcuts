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
  let targetTab = tabs[activeTab.index + direction];

  // If the target tab exists and is not in a group
  if (targetTab && targetTab.groupId === -1) {
    await browser.tabs.update(targetTab.id, { active: true });
    return;
  }
  // If the target tab exists, it must be in a group
  else if (targetTab) {
    // Get all collapsed tab groups
    const collapsedGroups = await browser.tabGroups.query({ collapsed: true });
    const collapsedGroupIds = new Set(collapsedGroups.map((group) => group.id));

    // If the target tab's group is not collapsed, activate it
    if (!collapsedGroupIds.has(targetTab.groupId)) {
      await browser.tabs.update(targetTab.id, { active: true });
      return;
    }

    // Search for the next tab that is not in a collapsed group
    const end = direction > 0 ? tabs.length : -1;
    for (
      let i = activeTab.index + direction + direction;
      i !== end;
      i += direction
    ) {
      targetTab = tabs[i];
      // If new target tab is not in a group or its group is not collapsed, activate it
      if (
        targetTab.groupId === -1 ||
        !collapsedGroupIds.has(targetTab.groupId)
      ) {
        await browser.tabs.update(targetTab.id, { active: true });
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
