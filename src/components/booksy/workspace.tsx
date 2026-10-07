import { useEffect, useRef, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, BarChart3, Check, ChevronRight, FilePlus2, FileUp, Headphones, Mic, MoreHorizontal, Search, Settings2, Sparkles, Users, Volume2, X, Receipt, Plus, Download, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import bloom from "@/assets/bloom.jpg";
import mascot from "@/assets/book-mascot.png";

type Action = "Search" | "Voice input" | "Reports" | "More options" | "Quick invoice" | "Customer ledger" | "New entry" | "Upload bill";
type Entry = { id: number; name: string; amount: number; kind: "Income" | "Expense"; date: string };
type SpeechResult = { isFinal: boolean; 0: { transcript: string } };
type Recognition = { lang: string; continuous: boolean; interimResults: boolean; onresult: ((event: { results: ArrayLike<SpeechResult> }) => void) | null; onerror: ((event: { error: string }) => void) | null; onend: (() => void) | null; start: () => void; stop: () => void; abort: () => void };
type SpeechWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };

const actions = [
  { name: "Search", Icon: Search, tone: "blue" },
  { name: "Voice input", Icon: Mic, tone: "pink" },
  { name: "Reports", Icon: BarChart3, tone: "green" },
  { name: "More options", Icon: Settings2, tone: "silver" },
  { name: "Quick invoice", Icon: Receipt, tone: "coral" },
  { name: "Customer ledger", Icon: Users, tone: "violet" },
  { name: "New entry", Icon: FilePlus2, tone: "gold" },
  { name: "Upload bill", Icon: FileUp, tone: "cyan" },
] as const;
const currency = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export function Workspace() {
  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState<Action | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [query, setQuery] = useState("");
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [language, setLanguage] = useState("en-IN");
  const [files, setFiles] = useState<File[]>([]);
  const [notice, setNotice] = useState("");
  const [clock, setClock] = useState("");
  const [gentle, setGentle] = useState(false);
  const [sound, setSound] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  const income = entries.filter(e => e.kind === "Income").reduce((sum, e) => sum + e.amount, 0);
  const expenses = entries.filter(e => e.kind === "Expense").reduce((sum, e) => sum + e.amount, 0);

  useEffect(() => {
    const update = () => setClock(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }));
    update(); const timer = setInterval(update, 60000);
    return () => { clearInterval(timer); recognition.current?.abort(); };
  }, []);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(""), 4000); return () => clearTimeout(timer); }, [notice]);

  function stopVoice() { recognition.current?.stop(); setListening(false); }
  function openAction(action: Action) { setActive(action); setVoiceError(""); }
  function closeAction() { stopVoice(); setActive(null); }
  function startVoice() {
    const speechWindow = window as SpeechWindow;
    const Constructor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Constructor) { setVoiceError("Voice input isn't available in this browser. Try Chrome or Edge, or type your note below."); return; }
    recognition.current?.abort();
    const instance = new Constructor(); recognition.current = instance;
    instance.lang = language; instance.continuous = true; instance.interimResults = true;
    instance.onresult = event => setTranscript(Array.from(event.results).map(result => result[0].transcript).join(" "));
    instance.onerror = event => { setListening(false); setVoiceError(event.error === "not-allowed" ? "Microphone access was denied. Allow microphone access in your browser to record." : event.error === "no-speech" ? "No speech detected. Start again when you're ready." : `Voice input stopped: ${event.error}.`); };
    instance.onend = () => setListening(false);
    setVoiceError(""); setTranscript("");
    try { instance.start(); setListening(true); } catch { setVoiceError("The microphone couldn't start. Please try again."); }
  }
  function addEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim(); const amount = Number(data.get("amount"));
    if (!name || !Number.isFinite(amount) || amount <= 0) return;
    setEntries(previous => [...previous, { id: Date.now(), name, amount, kind: data.get("kind") === "Expense" ? "Expense" : "Income", date: new Date().toLocaleDateString("en-IN") }]);
    setNotice("Entry added to this session"); closeAction();
  }
  function download(filename: string, text: string, type = "text/plain") {
    const url = URL.createObjectURL(new Blob([text], { type })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function invoice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    download("booksy-invoice.txt", `INVOICE\nDate: ${new Date().toLocaleDateString("en-IN")}\nCustomer: ${data.get("customer")}\nItem: ${data.get("item")}\nAmount: ${currency(Number(data.get("amount")))}\n`);
    setNotice("Invoice downloaded"); closeAction();
  }

  return <main className={`workspace ${gentle ? "gentle-motion" : ""}`}>
    <img className="wallpaper" src={bloom} width={1920} height={1088} alt="" />
    <div className="wallpaper-shade" />
    <header className="workspace-header">
      <a href="/" className="brand"><span className="brand-symbol"><Receipt size={19} /></span>booksy<span className="brand-dot">.</span></a>
      <div className="workspace-name"><span className="status-dot" />My workspace</div>
      <div className="header-tools"><span className="session-label">Personal space</span><Button variant="glass" size="icon" aria-label="Open settings" onClick={() => openAction("More options")}><Settings2 /></Button><span className="avatar">J</span></div>
    </header>
    <section className="greeting"><span className="eyebrow">A LITTLE SPACE FOR YOUR EVERYDAY</span><h1>Everything feels<br />a little lighter.</h1><div className="greeting-date"><span className="small-line" />Your books. Your pace.</div></section>
    <div className={`orbit-stage ${expanded ? "is-open" : ""}`}>
      <div className="orbit-track track-outer" /><div className="orbit-track track-inner" />
      <div className="orbit-center">
        <div className="mascot-float"><Button variant="mascot" aria-label={expanded ? "Close book menu" : "Open book menu"} aria-expanded={expanded} onClick={() => { setExpanded(!expanded); if (sound && !expanded && "speechSynthesis" in window) { const greeting = new SpeechSynthesisUtterance("Hello! What shall we do today?"); window.speechSynthesis.speak(greeting); } }}><img src={mascot} width={1024} height={1024} alt="Booksy, your smiling bookkeeper" /></Button></div>
        <span className="mascot-spark spark-one"><Sparkles /></span><span className="mascot-spark spark-two">✦</span>
        <div className="mascot-caption"><span className="mascot-name">Hey, I’m Booksy<span> ✦</span></span><span className="mascot-status">{expanded ? "What’s on your mind?" : "Ready when you are"}</span></div>
      </div>
      <nav aria-label="Book actions" aria-hidden={!expanded} className="orbit-items">{actions.map(({ name, Icon, tone }, index) => <div key={name} className={`orbit-item orbit-${index} tone-${tone}`}><Button tabIndex={expanded ? 0 : -1} variant="orbit" aria-label={name} onClick={() => openAction(name)}><Icon /></Button><span className="orbit-label">{name}</span></div>)}</nav>
    </div>
    <div className="workspace-bottom"><div className="today-block"><span className="status-dot" />ALL GOOD TODAY<span className="today-time">{clock}</span></div><div className="bottom-actions"><Button variant="glass" aria-label="View current session entries" onClick={() => openAction("Customer ledger")}><span className="activity-dot" />{entries.length ? `${entries.length} entries this session` : "A fresh start"}<ChevronRight /></Button><Button variant="glass" size="icon" aria-label="Voice input" onClick={() => openAction("Voice input")}><Headphones /></Button></div></div>
    <footer className="workspace-footer"><span>A little order. A lot of peace.</span><span>MADE FOR YOUR EVERYDAY <Sparkles size={11} /></span></footer>
    {notice && <div className="notice" role="status"><Check size={16} />{notice}</div>}
    <Dialog open={active !== null} onOpenChange={open => { if (!open) closeAction(); }}><DialogContent className="action-dialog"><div className="panel-eyebrow"><span className="brand-symbol"><Receipt size={16} /></span>BOOKSY WORKSPACE</div><DialogTitle>{active}</DialogTitle><DialogDescription>{active === "Voice input" ? "Microphone access is needed to turn your speech into a note." : "Current session · nothing is saved after a refresh"}</DialogDescription>
      {active === "Search" && <><div className="search-input"><Search size={20} /><input autoFocus placeholder="Search entries, customers, bills…" value={query} onChange={event => setQuery(event.target.value)} /></div><div className="result-list">{entries.filter(e => e.name.toLowerCase().includes(query.toLowerCase())).map(e => <div className="entry-row" key={e.id}><span><strong>{e.name}</strong><small>{e.kind} · {e.date}</small></span><strong>{currency(e.amount)}</strong></div>)}{!entries.some(e => e.name.toLowerCase().includes(query.toLowerCase())) && <div className="empty-state"><Search size={28} /><p>{query ? `No results for “${query}”` : "No entries yet"}</p><Button variant="secondary" onClick={() => openAction("New entry")}><Plus />New entry</Button></div>}</div></>}
      {active === "Voice input" && <><div className={`voice-visual ${listening ? "listening" : ""}`}><Mic size={32} /><div className="voice-bars">{Array.from({ length: 13 }, (_, i) => <span key={i} />)}</div><span>{listening ? "Listening…" : "Your voice, in words"}</span></div><label className="field">Language<select value={language} disabled={listening} onChange={e => setLanguage(e.target.value)}><option value="en-IN">English (India)</option><option value="hi-IN">Hindi</option><option value="gu-IN">Gujarati</option><option value="en-US">English (US)</option></select></label><textarea className="note-input" aria-label="Voice transcript" placeholder="Your words will appear here…" value={transcript} onChange={e => setTranscript(e.target.value)} />{voiceError && <p className="error-text" role="alert">{voiceError}</p>}<div className="panel-actions"><Button onClick={listening ? stopVoice : startVoice}>{listening ? <Square /> : <Mic />}{listening ? "Stop listening" : "Start listening"}</Button><Button variant="outline" disabled={!transcript.trim()} onClick={() => { stopVoice(); download("booksy-voice-note.txt", transcript); setNotice("Voice note downloaded"); }}><Download />Save note</Button></div></>}
      {active === "New entry" && <form className="action-form" onSubmit={addEntry}><label className="field">Description<input name="name" autoFocus required placeholder="e.g. Payment from Aarav" /></label><div className="field-grid"><label className="field">Amount (₹)<input name="amount" type="number" min="0.01" step="0.01" required placeholder="0.00" /></label><label className="field">Type<select name="kind"><option>Income</option><option>Expense</option></select></label></div><Button type="submit"><Plus />Add entry</Button></form>}
      {active === "Upload bill" && <><label className="upload-area"><FileUp size={35} /><strong>Choose your bills</strong><span>PDF, JPG, or PNG · up to 10 MB each</span><input type="file" accept="application/pdf,image/jpeg,image/png" multiple onChange={event => { const selected = Array.from(event.target.files ?? []); const valid = selected.filter(file => file.size <= 10 * 1024 * 1024 && ["application/pdf", "image/jpeg", "image/png"].includes(file.type)); setFiles(previous => [...previous, ...valid]); if (valid.length !== selected.length) setNotice("Some files were skipped: check type and 10 MB limit"); }} /></label>{files.map((file, i) => <div className="entry-row" key={`${file.name}-${i}`}><span><strong>{file.name}</strong><small>{(file.size / 1024).toFixed(0)} KB · selected for this session</small></span><Button variant="ghost" size="icon" aria-label={`Remove ${file.name}`} onClick={() => setFiles(previous => previous.filter((_, index) => index !== i))}><X /></Button></div>)}</>}
      {active === "Quick invoice" && <form className="action-form" onSubmit={invoice}><label className="field">Customer<input autoFocus name="customer" required placeholder="Customer name" /></label><label className="field">Item or service<input name="item" required placeholder="What is this invoice for?" /></label><label className="field">Amount (₹)<input name="amount" type="number" min="0.01" step="0.01" required placeholder="0.00" /></label><Button type="submit"><Download />Download invoice</Button></form>}
      {active === "Customer ledger" && <><div className="ledger-summary"><span>Session balance</span><strong>{currency(income - expenses)}</strong></div>{entries.length ? <div className="result-list">{entries.map(e => <div className="entry-row" key={e.id}><span><strong>{e.name}</strong><small>{e.kind} · {e.date}</small></span><strong className={e.kind === "Income" ? "positive" : "negative"}>{e.kind === "Income" ? "+" : "−"}{currency(e.amount)}</strong></div>)}</div> : <div className="empty-state"><Users size={32} /><p>Your ledger is clear</p></div>}<Button onClick={() => openAction("New entry")}><Plus />New entry</Button></>}
      {active === "Reports" && <><div className="report-grid"><div><ArrowDownLeft /><span>Income</span><strong>{currency(income)}</strong></div><div><ArrowUpRight /><span>Expenses</span><strong>{currency(expenses)}</strong></div></div><div className="ledger-summary"><span>Net balance</span><strong>{currency(income - expenses)}</strong></div><div className="report-bars"><div><span>Income</span><progress value={income} max={Math.max(income, expenses, 1)} /></div><div><span>Expenses</span><progress value={expenses} max={Math.max(income, expenses, 1)} /></div></div><Button variant="outline" disabled={!entries.length} onClick={() => download("booksy-report.csv", "Description,Type,Amount,Date\n" + entries.map(e => [e.name, e.kind, e.amount, e.date].map(v => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\n"), "text/csv")}><Download />Export report</Button></>}
      {active === "More options" && <div className="options-list"><label><span><Sparkles size={19} /><span>Gentle motion<small>Reduce floating and decorative animation</small></span></span><input type="checkbox" checked={gentle} onChange={e => setGentle(e.target.checked)} /></label><label><span><Volume2 size={19} /><span>Spoken greeting<small>Booksy says hello when the menu opens</small></span></span><input type="checkbox" checked={sound} onChange={e => setSound(e.target.checked)} /></label><Button variant="outline" onClick={() => { setExpanded(false); closeAction(); }}>Close the circle<MoreHorizontal /></Button></div>}
    </DialogContent></Dialog>
  </main>;
}