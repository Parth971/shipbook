import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { looksLikeHtml } from "./sanitize";

const TOOLBAR = [
  ["bold", "italic", "underline", "strike"],
  ["link"],
  [{ list: "bullet" }, { list: "ordered" }],
  ["blockquote", "code", "code-block"],
  ["clean"],
];

const TITLES = {
  "ql-bold": "Bold (⌘/Ctrl + B)",
  "ql-italic": "Italic (⌘/Ctrl + I)",
  "ql-underline": "Underline (⌘/Ctrl + U)",
  "ql-strike": "Strikethrough",
  "ql-link": "Link (⌘/Ctrl + K)",
  "ql-blockquote": "Quote",
  "ql-code": "Inline code",
  "ql-code-block": "Code block",
  "ql-clean": "Clear formatting",
  bullet: "Bulleted list",
  ordered: "Numbered list",
};

function labelToolbar(container) {
  container.querySelectorAll(".ql-toolbar button").forEach((button) => {
    const format = [...button.classList].find((name) => name.startsWith("ql-"));
    const title = TITLES[button.value] ?? TITLES[format];
    if (title) {
      button.setAttribute("title", title);
      button.setAttribute("aria-label", title);
    }
  });
}

export default function Editor({
  value = "",
  onChange,
  onSubmit,
  onCancel,
  placeholder = "",
  autoFocus = false,
  className = "",
}) {
  const wrapper = useRef(null);
  // Quill is created once; callbacks are read through a ref so it never restarts.
  const latest = useRef({ onChange, onSubmit, onCancel });
  latest.current = { onChange, onSubmit, onCancel };

  useEffect(() => {
    const container = wrapper.current;
    const host = container.appendChild(document.createElement("div"));

    const quill = new Quill(host, {
      theme: "snow",
      placeholder,
      modules: {
        toolbar: TOOLBAR,
        keyboard: {
          bindings: {
            submit: {
              key: "Enter",
              shortKey: true,
              handler: () => {
                latest.current.onSubmit?.();
                return false;
              },
            },
            cancel: {
              key: "Escape",
              handler: () => {
                if (!latest.current.onCancel) return true;
                latest.current.onCancel();
                return false;
              },
            },
          },
        },
      },
    });

    labelToolbar(container);

    if (value) {
      if (looksLikeHtml(value)) quill.clipboard.dangerouslyPasteHTML(value, "silent");
      else quill.setText(value, "silent");
    }

    quill.on(Quill.events.TEXT_CHANGE, () => {
      const empty = quill.getText().trim() === "";
      latest.current.onChange(empty ? "" : quill.root.innerHTML);
    });

    if (autoFocus) quill.setSelection(quill.getLength(), 0);

    return () => {
      container.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className={`editor ${className}`.trim()} ref={wrapper} />;
}
