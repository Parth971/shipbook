import { useMemo } from "react";
import { looksLikeHtml, sanitizeHtml } from "./sanitize";

/**
 * Renders saved entry content. The `ql-editor` class reuses Quill's own
 * typography so lists and code blocks read the same as they did while editing.
 */
export default function RichContent({ html, className = "" }) {
  const value = String(html ?? "");
  const clean = useMemo(() => (looksLikeHtml(value) ? sanitizeHtml(value) : null), [value]);

  if (clean === null) {
    return <div className={`rich plain ${className}`.trim()}>{value}</div>;
  }

  return (
    <div
      className={`rich ql-editor ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
