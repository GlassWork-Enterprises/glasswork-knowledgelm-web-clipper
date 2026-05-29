function canonicalUrl() {
  const canonical = document.querySelector('link[rel="canonical"]');
  return canonical && canonical.href ? canonical.href : window.location.href;
}

function description() {
  const meta = document.querySelector('meta[name="description"], meta[property="og:description"]');
  return meta && meta.content ? meta.content.trim() : "";
}

function paragraphs() {
  return Array.from(document.querySelectorAll("article p, main p, p"))
    .map((entry) => entry.textContent || "")
    .map((entry) => entry.replace(/\s+/g, " ").trim())
    .filter((entry) => entry.length > 80)
    .slice(0, 8)
    .join("\n\n");
}

function selectedText() {
  const selection = window.getSelection();
  return selection ? selection.toString().replace(/\s+/g, " ").trim() : "";
}

function collectPageContext() {
  const selection = selectedText();
  const content = [selection, description(), paragraphs()].filter(Boolean).join("\n\n");
  return {
    title: document.title || window.location.href,
    url: canonicalUrl(),
    selection,
    content
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message && message.type === "knowledgelm:collect-page-context") {
    sendResponse(collectPageContext());
    return true;
  }
  return false;
});
