import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "shipbook_v1";
const LEGACY_KEY = "massic_deploy_tracker_v1";
const PREFS_KEY = "shipbook_prefs_v1";

const TAGS = {
  normal: { label: "Normal", className: "tag-normal" },
  breaking: { label: "Breaking", className: "tag-breaking" },
  action: { label: "Action required", className: "tag-action" },
};

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const newShip = () => ({
  id: uid(),
  title: "Next ship",
  createdAt: new Date().toISOString(),
  shippedAt: null,
  entries: [],
});
const initialState = () => ({ version: 1, current: newShip(), history: [] });

function migrateLegacy(data) {
  if (!data?.current?.changes) return null;
  const migrateShip = (batch) => ({
    id: String(batch.id ?? uid()),
    title: "Ship",
    createdAt: batch.createdAt ?? new Date().toISOString(),
    shippedAt: batch.deployedAt ?? null,
    entries: (batch.changes ?? []).map((change) => ({
      id: String(change.id ?? uid()),
      text: change.desc,
      tag: change.tag ?? "normal",
      runItems: (change.actions ?? []).map((action) => ({
        id: String(action.id ?? uid()),
        text: action.text,
        timing: action.timing,
        order: action.order,
      })),
    })),
  });

  return {
    version: 1,
    current: migrateShip(data.current),
    history: (data.history ?? []).map(migrateShip),
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) return migrateLegacy(JSON.parse(legacy)) ?? initialState();
  } catch {
    // A malformed or unavailable local store should not prevent the app loading.
  }
  return initialState();
}

const defaultPrefs = { entriesNewestFirst: false, historyNewestFirst: true };

function loadPrefs() {
  try {
    const saved = localStorage.getItem(PREFS_KEY);
    if (saved) return { ...defaultPrefs, ...JSON.parse(saved) };
  } catch {
    // Preferences are cosmetic; fall back to defaults.
  }
  return defaultPrefs;
}

function Icon({ name, size = 18, className = "" }) {
  const paths = {
    book: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      </>
    ),
    list: (
      <>
        <path d="M8 6h13M8 12h13M8 18h13" />
        <path d="M3 6h.01M3 12h.01M3 18h.01" />
      </>
    ),
    archive: (
      <>
        <path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.09A1.7 1.7 0 0 0 9 19.37a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.63 15 1.7 1.7 0 0 0 3.09 14H3v-4h.09A1.7 1.7 0 0 0 4.63 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.63h.01A1.7 1.7 0 0 0 10 3.09V3h4v.09a1.7 1.7 0 0 0 1 1.54 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.37 9v.01A1.7 1.7 0 0 0 20.91 10H21v4h-.09A1.7 1.7 0 0 0 19.4 15Z" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: <path d="m9 18 6-6-6-6" />,
    trash: (
      <>
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" />
      </>
    ),
    upload: (
      <>
        <path d="M12 15V3m0 0 4 4m-4-4L8 7M5 21h14" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    back: <path d="m15 18-6-6 6-6" />,
    sort: (
      <>
        <path d="M6 4v16m0 0 3.2-3.4M6 20l-3.2-3.4" />
        <path d="M13 6h8M13 12h6M13 18h4" />
      </>
    ),
    chevron: <path d="m6 9 6 6 6-6" />,
  };
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

/** Textarea that grows with its content instead of scrolling inside a fixed box. */
function AutoTextarea({ value, minRows = 3, ...rest }) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${node.scrollHeight}px`;
  }, [value]);

  return <textarea ref={ref} rows={minRows} value={value} {...rest} />;
}

function Tag({ tag }) {
  const details = TAGS[tag] ?? TAGS.normal;
  return <span className={`tag ${details.className}`}>{details.label}</span>;
}

const TAG_MENU_HEIGHT = 132;

function TagSelect({ tag, onChange }) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const trigger = useRef(null);
  const details = TAGS[tag] ?? TAGS.normal;

  function toggle() {
    const box = trigger.current?.getBoundingClientRect();
    if (box) {
      const spaceBelow = window.innerHeight - box.bottom;
      setDropUp(spaceBelow < TAG_MENU_HEIGHT && box.top > spaceBelow);
    }
    setOpen((value) => !value);
  }

  return (
    <div
      className="tag-select"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <button
        ref={trigger}
        className={`tag tag-button ${details.className}`}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Change type"
        onClick={toggle}
      >
        {details.label}
        <Icon name="chevron" size={11} />
      </button>
      {open && (
        <div className={`tag-menu ${dropUp ? "drop-up" : ""}`} role="listbox">
          {Object.entries(TAGS).map(([value, option]) => (
            <button
              key={value}
              role="option"
              aria-selected={value === tag}
              className={`tag-menu-item ${option.className} ${value === tag ? "active" : ""}`}
              type="button"
              onClick={() => {
                onChange(value);
                setOpen(false);
              }}
            >
              <span className="dot" />
              {option.label}
              {value === tag && <Icon name="check" size={13} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, title, copy }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon name={icon} size={23} />
      </div>
      <h2>{title}</h2>
      <p>{copy}</p>
    </div>
  );
}

function EntryComposer({ onAdd }) {
  const [text, setText] = useState("");
  const [tag, setTag] = useState("normal");

  function submit(event) {
    event.preventDefault();
    if (!text.trim()) return;
    onAdd({ id: uid(), text: text.trim(), tag, runItems: [] });
    setText("");
    setTag("normal");
  }

  return (
    <form className="composer" onSubmit={submit}>
      <div className="composer-head">
        <span className="composer-plus">
          <Icon name="plus" size={15} />
        </span>
        <span className="composer-label">New entry</span>
        <span className="composer-hint">⌘/Ctrl + Enter to add</span>
      </div>
      <AutoTextarea
        className="composer-input"
        minRows={4}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) submit(event);
        }}
        placeholder={
          "What’s going out in the next ship?\n\nWrite as much as you need — line breaks are kept."
        }
        aria-label="New entry"
      />
      <div className="composer-foot">
        <div className="tag-picker" aria-label="Entry type">
          {Object.entries(TAGS).map(([value, details]) => (
            <button
              className={`tag-choice ${tag === value ? "active" : ""} ${details.className}`}
              key={value}
              type="button"
              onClick={() => setTag(value)}
            >
              <span className="dot" />
              {details.label}
            </button>
          ))}
        </div>
        <button className="button button-primary" disabled={!text.trim()} type="submit">
          Add entry
        </button>
      </div>
    </form>
  );
}

function RunItemForm({ nextOrder, onAdd, onCancel }) {
  const [text, setText] = useState("");
  const [timing, setTiming] = useState("pre");

  function submit(event) {
    event.preventDefault();
    if (!text.trim()) return;
    onAdd({
      id: uid(),
      text: text.trim(),
      timing,
      order: nextOrder(timing),
    });
  }

  return (
    <form className="run-form" onSubmit={submit}>
      <div className="segmented">
        <button
          className={timing === "pre" ? "active" : ""}
          type="button"
          onClick={() => setTiming("pre")}
        >
          Before push
        </button>
        <button
          className={timing === "post" ? "active" : ""}
          type="button"
          onClick={() => setTiming("post")}
        >
          After push
        </button>
      </div>
      <AutoTextarea
        autoFocus
        minRows={3}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) submit(event);
          if (event.key === "Escape") onCancel();
        }}
        placeholder="Paste a command or describe the step…"
      />
      <div className="run-form-actions">
        <button className="button button-quiet" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="button button-primary" type="submit" disabled={!text.trim()}>
          Add run item
        </button>
      </div>
    </form>
  );
}

function EntryCard({ entry, number, onUpdate, onDelete }) {
  const [addingRunItem, setAddingRunItem] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.text);

  function startEditing() {
    setDraft(entry.text);
    setEditing(true);
  }

  function saveText() {
    const text = draft.trim();
    if (text) onUpdate({ ...entry, text });
    setEditing(false);
  }

  const nextOrder = (timing) =>
    Math.max(
      0,
      ...entry.runItems.filter((item) => item.timing === timing).map((item) => item.order),
    ) + 1;

  return (
    <article className="entry-card">
      <div className="entry-top">
        <span className="entry-number">{String(number).padStart(2, "0")}</span>
        <div className="entry-content">
          {editing ? (
            <div className="entry-editor">
              <AutoTextarea
                className="entry-edit"
                autoFocus
                minRows={3}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onBlur={saveText}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) saveText();
                  if (event.key === "Escape") {
                    setDraft(entry.text);
                    setEditing(false);
                  }
                }}
              />
              <span className="edit-hint">Click away to save · Esc to discard</span>
            </div>
          ) : (
            <button className="entry-text" onClick={startEditing} title="Click to edit">
              {entry.text}
            </button>
          )}
          <div className="entry-meta">
            <TagSelect tag={entry.tag} onChange={(tag) => onUpdate({ ...entry, tag })} />
            {entry.runItems.length > 0 && (
              <span className="run-count">
                {entry.runItems.length} run item{entry.runItems.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </div>
        <button
          className="icon-button danger-on-hover"
          title="Delete entry"
          onClick={() => onDelete(entry.id)}
        >
          <Icon name="trash" size={16} />
        </button>
      </div>

      {entry.runItems.length > 0 && (
        <div className="run-items">
          {["pre", "post"].map((timing) =>
            entry.runItems
              .filter((item) => item.timing === timing)
              .sort((a, b) => a.order - b.order)
              .map((item) => (
                <div className="run-item" key={item.id}>
                  <span className={`timing timing-${timing}`}>
                    {timing === "pre" ? "Before" : "After"} · {item.order}
                  </span>
                  <code>{item.text}</code>
                  <button
                    className="icon-button danger-on-hover"
                    title="Delete run item"
                    onClick={() =>
                      onUpdate({
                        ...entry,
                        runItems: entry.runItems.filter((candidate) => candidate.id !== item.id),
                      })
                    }
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              )),
          )}
        </div>
      )}

      {addingRunItem ? (
        <RunItemForm
          nextOrder={nextOrder}
          onCancel={() => setAddingRunItem(false)}
          onAdd={(item) => {
            onUpdate({ ...entry, tag: "action", runItems: [...entry.runItems, item] });
            setAddingRunItem(false);
          }}
        />
      ) : (
        <button className="add-run" onClick={() => setAddingRunItem(true)}>
          <Icon name="plus" size={14} />
          Add a run item
        </button>
      )}
    </article>
  );
}

function CurrentShip({
  ship,
  historyCount,
  newestFirst,
  onToggleOrder,
  onChange,
  onNavigate,
  onShip,
}) {
  const entryCount = ship.entries.length;
  const breakingCount = ship.entries.filter((entry) => entry.tag === "breaking").length;
  const runCount = ship.entries.reduce((total, entry) => total + entry.runItems.length, 0);

  const ordered = useMemo(() => {
    const numbered = ship.entries.map((entry, index) => ({ entry, number: index + 1 }));
    return newestFirst ? numbered.reverse() : numbered;
  }, [ship.entries, newestFirst]);

  function addEntry(entry) {
    onChange({ ...ship, entries: [...ship.entries, entry] });
  }

  function updateEntry(updated) {
    onChange({
      ...ship,
      entries: ship.entries.map((entry) => (entry.id === updated.id ? updated : entry)),
    });
  }

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">IN PROGRESS</p>
          <input
            className="ship-title"
            value={ship.title}
            aria-label="Ship title"
            onChange={(event) => onChange({ ...ship, title: event.target.value })}
          />
          <p className="page-subtitle">
            Keep everything that needs to go out together, together.
          </p>
        </div>
        <button className="button button-ship" disabled={!entryCount} onClick={onShip}>
          Start shipping
          <Icon name="arrow" size={16} />
        </button>
      </header>

      <div className="stats">
        <div>
          <strong>{entryCount}</strong>
          <span>Entries</span>
        </div>
        <div>
          <strong>{runCount}</strong>
          <span>Run items</span>
        </div>
        <div>
          <strong className={breakingCount ? "red" : ""}>{breakingCount}</strong>
          <span>Breaking</span>
        </div>
        <div>
          <strong>{historyCount}</strong>
          <span>Shipped</span>
        </div>
      </div>

      <EntryComposer onAdd={addEntry} />

      <section className="entries-section">
        <div className="section-heading">
          <h2>Entries</h2>
          <div className="section-tools">
            {entryCount > 0 && <span className="section-count">{entryCount} total</span>}
            {entryCount > 1 && (
              <button
                className="sort-toggle"
                onClick={onToggleOrder}
                title="Flip the order of the list"
              >
                <Icon name="sort" size={14} className={newestFirst ? "flipped" : ""} />
                {newestFirst ? "Newest first" : "Oldest first"}
              </button>
            )}
          </div>
        </div>
        {entryCount === 0 ? (
          <EmptyState
            icon="list"
            title="This ship is empty"
            copy="Add product changes, fixes, migrations, and anything else that needs to reach production."
          />
        ) : (
          <div className="entry-list" key={newestFirst ? "newest" : "oldest"}>
            {ordered.map(({ entry, number }) => (
              <EntryCard
                entry={entry}
                number={number}
                key={entry.id}
                onUpdate={updateEntry}
                onDelete={(id) => {
                  if (confirm("Remove this entry from the ship?")) {
                    onChange({ ...ship, entries: ship.entries.filter((item) => item.id !== id) });
                  }
                }}
              />
            ))}
          </div>
        )}
      </section>

      {entryCount > 0 && (
        <div className="mobile-ship">
          <button className="button button-ship" onClick={onShip}>
            Start shipping <Icon name="arrow" size={16} />
          </button>
        </div>
      )}

      <button className="history-shortcut" onClick={() => onNavigate("history")}>
        View previous ships <Icon name="arrow" size={14} />
      </button>
    </>
  );
}

function CheckRow({ item, checked, disabled, onToggle, isPush = false }) {
  return (
    <button
      className={`check-row ${checked ? "checked" : ""} ${isPush ? "push-row" : ""}`}
      disabled={disabled}
      onClick={onToggle}
    >
      <span className="checkbox">{checked && <Icon name="check" size={14} />}</span>
      <span className="check-copy">
        <strong>{item.text}</strong>
        {item.entry && <small>From: {item.entry}</small>}
      </span>
      {!isPush && <span className="order">#{item.order}</span>}
    </button>
  );
}

function ShippingView({ ship, onBack, onComplete }) {
  const [checked, setChecked] = useState({});
  const [pushDone, setPushDone] = useState(false);
  const items = useMemo(
    () =>
      ship.entries.flatMap((entry) =>
        entry.runItems.map((item) => ({ ...item, entry: entry.text })),
      ),
    [ship],
  );
  const pre = items.filter((item) => item.timing === "pre").sort((a, b) => a.order - b.order);
  const post = items.filter((item) => item.timing === "post").sort((a, b) => a.order - b.order);
  const preDone = pre.every((item) => checked[item.id]);
  const postDone = post.every((item) => checked[item.id]);
  const canComplete = preDone && pushDone && postDone;

  const toggle = (id) => setChecked((value) => ({ ...value, [id]: !value[id] }));

  return (
    <div className="narrow-page">
      <button className="back-button" onClick={onBack}>
        <Icon name="back" size={16} /> Back to ship
      </button>
      <header className="shipping-header">
        <p className="eyebrow">SHIP CHECKLIST</p>
        <h1>{ship.title || "Untitled ship"}</h1>
        <p>Complete each step in order. The ship is only logged when everything is done.</p>
      </header>

      <section className="check-section">
        <div className="check-heading">
          <span>01</span>
          <div>
            <h2>Before the push</h2>
            <p>Prepare production before code goes out.</p>
          </div>
        </div>
        {pre.length ? (
          pre.map((item) => (
            <CheckRow
              item={item}
              key={item.id}
              checked={Boolean(checked[item.id])}
              onToggle={() => toggle(item.id)}
            />
          ))
        ) : (
          <p className="nothing-to-do">No pre-push run items. You’re clear to continue.</p>
        )}
      </section>

      <section className={`check-section ${!preDone ? "locked" : ""}`}>
        <div className="check-heading">
          <span>02</span>
          <div>
            <h2>Push to production</h2>
            <p>Deploy the code through your usual release path.</p>
          </div>
        </div>
        <CheckRow
          item={{ text: "Code is live in production" }}
          checked={pushDone}
          disabled={!preDone}
          onToggle={() => setPushDone((done) => !done)}
          isPush
        />
      </section>

      <section className={`check-section ${!pushDone ? "locked" : ""}`}>
        <div className="check-heading">
          <span>03</span>
          <div>
            <h2>After the push</h2>
            <p>Finish the work that makes this ship complete.</p>
          </div>
        </div>
        {post.length ? (
          post.map((item) => (
            <CheckRow
              item={item}
              key={item.id}
              checked={Boolean(checked[item.id])}
              disabled={!pushDone}
              onToggle={() => toggle(item.id)}
            />
          ))
        ) : (
          <p className="nothing-to-do">No post-push run items.</p>
        )}
      </section>

      <div className="complete-bar">
        <div>
          <strong>
            {canComplete ? "Everything is done." : "Complete the checklist to finish."}
          </strong>
          <span>{ship.entries.length} entries will be added to history.</span>
        </div>
        <button className="button button-ship" disabled={!canComplete} onClick={onComplete}>
          Mark as shipped <Icon name="check" size={16} />
        </button>
      </div>
    </div>
  );
}

function HistoryView({ history, newestFirst, onToggleOrder }) {
  const [open, setOpen] = useState(null);
  const ships = newestFirst ? [...history].reverse() : history;

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">THE LOG</p>
          <h1>Ship history</h1>
          <p className="page-subtitle">A durable record of what reached production and when.</p>
        </div>
        {history.length > 1 && (
          <button className="sort-toggle" onClick={onToggleOrder} title="Flip the order of the list">
            <Icon name="sort" size={14} className={newestFirst ? "flipped" : ""} />
            {newestFirst ? "Newest first" : "Oldest first"}
          </button>
        )}
      </header>
      {history.length === 0 ? (
        <EmptyState
          icon="archive"
          title="Nothing has shipped yet"
          copy="Completed ships will live here with their entries and run items intact."
        />
      ) : (
        <div className="history-list" key={newestFirst ? "newest" : "oldest"}>
          {ships.map((ship) => {
            const expanded = open === ship.id;
            const runCount = ship.entries.reduce(
              (total, entry) => total + entry.runItems.length,
              0,
            );
            return (
              <article className="history-card" key={ship.id}>
                <button
                  className="history-summary"
                  onClick={() => setOpen(expanded ? null : ship.id)}
                >
                  <span className="history-date">
                    <strong>
                      {new Date(ship.shippedAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </strong>
                    <small>{new Date(ship.shippedAt).getFullYear()}</small>
                  </span>
                  <span className="history-name">
                    <strong>{ship.title || "Untitled ship"}</strong>
                    <small>
                      {ship.entries.length} entries · {runCount} run items
                    </small>
                  </span>
                  <span className={`history-arrow ${expanded ? "expanded" : ""}`}>
                    <Icon name="arrow" size={17} />
                  </span>
                </button>
                {expanded && (
                  <div className="history-details">
                    {ship.entries.map((entry, index) => (
                      <div className="history-entry" key={entry.id}>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <div>
                          <strong>{entry.text}</strong>
                          <Tag tag={entry.tag} />
                          {entry.runItems.map((item) => (
                            <code key={item.id}>
                              {item.timing === "pre" ? "Before" : "After"} · {item.text}
                            </code>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

function DataView({ state, onImport, onReset }) {
  const fileInput = useRef(null);

  function download() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `shipbook-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function readFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed?.current?.entries || !Array.isArray(parsed.history)) throw new Error();
        onImport(parsed);
      } catch {
        window.alert("That file doesn’t look like a Shipbook export.");
      }
      event.target.value = "";
    };
    reader.readAsText(file);
  }

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">LOCAL DATA</p>
          <h1>Keep your book safe</h1>
          <p className="page-subtitle">
            Shipbook lives in this browser. Export a backup before clearing browser data or
            moving computers.
          </p>
        </div>
      </header>
      <div className="data-grid">
        <section className="data-card">
          <span className="data-icon">
            <Icon name="download" size={20} />
          </span>
          <h2>Export your Shipbook</h2>
          <p>Download the current ship and full history as a portable JSON file.</p>
          <button className="button button-primary" onClick={download}>
            Download backup
          </button>
        </section>
        <section className="data-card">
          <span className="data-icon">
            <Icon name="upload" size={20} />
          </span>
          <h2>Restore a backup</h2>
          <p>Import a Shipbook JSON file. This replaces the data in this browser.</p>
          <input
            ref={fileInput}
            hidden
            type="file"
            accept=".json,application/json"
            onChange={readFile}
          />
          <button className="button button-outline" onClick={() => fileInput.current?.click()}>
            Choose backup
          </button>
        </section>
      </div>
      <section className="danger-zone">
        <div>
          <h2>Start over</h2>
          <p>Delete the current ship and all history from this browser.</p>
        </div>
        <button
          className="button button-danger"
          onClick={() => {
            if (confirm("Permanently delete all Shipbook data from this browser?")) onReset();
          }}
        >
          Delete all data
        </button>
      </section>
    </>
  );
}

function Sidebar({ view, onNavigate }) {
  const links = [
    ["current", "list", "Current ship"],
    ["history", "archive", "History"],
    ["data", "settings", "Data & backup"],
  ];
  return (
    <aside className="sidebar">
      <button className="brand" onClick={() => onNavigate("current")}>
        <span className="brand-mark">
          <Icon name="book" size={19} />
        </span>
        <span>
          <strong>Shipbook</strong>
          <small>dev → prod</small>
        </span>
      </button>
      <nav>
        {links.map(([value, icon, label]) => (
          <button
            key={value}
            className={view === value ? "active" : ""}
            onClick={() => onNavigate(value)}
          >
            <Icon name={icon} size={17} />
            {label}
          </button>
        ))}
      </nav>
      <div className="sidebar-note">
        <span />
        Saved in this browser
      </div>
    </aside>
  );
}

export default function App() {
  const [state, setState] = useState(loadState);
  const [prefs, setPrefs] = useState(loadPrefs);
  const [view, setView] = useState("current");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const toggleOrder = (key) => setPrefs((value) => ({ ...value, [key]: !value[key] }));

  function completeShip() {
    setState((current) => ({
      ...current,
      current: newShip(),
      history: [
        ...current.history,
        {
          ...current.current,
          title: current.current.title.trim() || "Untitled ship",
          shippedAt: new Date().toISOString(),
        },
      ],
    }));
    setView("history");
  }

  if (view === "shipping") {
    return (
      <main className="shipping-page">
        <ShippingView
          ship={state.current}
          onBack={() => setView("current")}
          onComplete={completeShip}
        />
      </main>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar view={view} onNavigate={setView} />
      <main className="main-content">
        {view === "current" && (
          <CurrentShip
            ship={state.current}
            historyCount={state.history.length}
            newestFirst={prefs.entriesNewestFirst}
            onToggleOrder={() => toggleOrder("entriesNewestFirst")}
            onChange={(current) => setState((value) => ({ ...value, current }))}
            onNavigate={setView}
            onShip={() => setView("shipping")}
          />
        )}
        {view === "history" && (
          <HistoryView
            history={state.history}
            newestFirst={prefs.historyNewestFirst}
            onToggleOrder={() => toggleOrder("historyNewestFirst")}
          />
        )}
        {view === "data" && (
          <DataView
            state={state}
            onImport={(next) => {
              if (confirm("Replace this browser’s Shipbook data with the backup?")) {
                setState(next);
                setView("current");
              }
            }}
            onReset={() => {
              setState(initialState());
              setView("current");
            }}
          />
        )}
      </main>
    </div>
  );
}
