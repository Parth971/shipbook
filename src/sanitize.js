import DOMPurify from "dompurify";

const CONFIG = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "span",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "a",
    "ul",
    "ol",
    "li",
    "blockquote",
    "pre",
    "code",
  ],
  ALLOWED_ATTR: ["href", "target", "rel", "class"],
};

DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noreferrer noopener");
  }
});

/** Entries written before the rich editor existed are stored as plain text. */
export const looksLikeHtml = (value) => /<\/?[a-z][\s\S]*>/i.test(String(value ?? ""));

export const sanitizeHtml = (value) => DOMPurify.sanitize(String(value ?? ""), CONFIG);

/** Flattens entry content for the places that show a one-line preview. */
export function toPlainText(value) {
  const text = String(value ?? "");
  if (!looksLikeHtml(text)) return text;
  const holder = document.createElement("div");
  holder.innerHTML = sanitizeHtml(text);
  return holder.textContent.replace(/\s+/g, " ").trim();
}
