const initialContent = document.querySelector(".initial-content");
const content = document.querySelector(".content");
const issuesList = document.querySelector(".issues");

const sumIssues = (search) => {
  const parseStringToHours = (input) => {
    if (input === undefined || input === "" || input === null) return 0;
    // unidades de tempo em horas
    const timeUnits = {
      hours: 1,
      day: 8,
      days: 8,
      week: 40,
      weeks: 40,
    };

    const parts = input.split(",").map((part) => part.trim());

    let totalHours = 0;

    parts.forEach((part) => {
      const match = part.match(/(\d+)\s*(\w+)/);
      if (match) {
        const quantity = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        if (timeUnits[unit]) {
          totalHours += quantity * timeUnits[unit];
        }
      }
    });

    return totalHours;
  };

  const parseToDays = (value) => {
    const hours = parseStringToHours(value);
    const hoursInDay = 8;
    const days = hours / hoursInDay;
    return days;
  };

  const containers = document.getElementsByClassName(
    "dashboard-item-frame gadget-container"
  );
  if (containers != null) {
    for (let i = 0; i < containers.length; i++) {
      const titleElement = containers[i].getElementsByClassName(
        "dashboard-item-title"
      )[0];
      if (titleElement != null) {
        const titleText = titleElement.innerText;
        if (titleText.includes(search)) {
          const table = containers[i].querySelector("tbody");

          let total = 0;

          Array.from(table.children).forEach((line) => {
            const chave = line.attributes["data-issuekey"].value;
            const [estimativa] = line.getElementsByClassName(
              "aggregatetimeoriginalestimate"
            );
            const parsedEstimativa = parseToDays(estimativa.innerText);
            total += parsedEstimativa;

            chrome.runtime.sendMessage({
              action: "issueData",
              payload: {
                chave: chave,
                estimativa: parsedEstimativa,
                total: total,
              },
            });
          });
        }
      }
    }
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab.url.includes("jira") && tab.url.includes("Dashboard")) {
    initialContent.classList.remove("show");
    content.classList.add("show");

    issuesList.innerHTML = null;
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: sumIssues,
      args: ["Sprint Atual"],
    });
  }
});

const buildElement = (chave, estimativa) => {
  const divCalcDisplay = document.createElement("div");
  divCalcDisplay.classList.add("issue");

  const divIssueKey = document.createElement("div");
  divIssueKey.classList.add("issue-key");
  divIssueKey.textContent = chave;

  const divIssueEstimative = document.createElement("div");
  divIssueEstimative.classList.add("issue-estimative");
  divIssueEstimative.textContent = estimativa;

  divCalcDisplay.appendChild(divIssueKey);
  divCalcDisplay.appendChild(divIssueEstimative);

  return divCalcDisplay;
};

const updateTotal = (estimativa) => {
  const total = document.getElementById("total");
  total.innerText = estimativa;
};

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "issueData") {
    const data = message.payload;
    issuesList.appendChild(buildElement(data.chave, data.estimativa));
    updateTotal(data.total);
  }
});
