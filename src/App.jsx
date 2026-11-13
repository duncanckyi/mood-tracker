import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const EMOTION_TAGS = [
  { id: "happy",     label: "開心 😊",    color: "#FF6B6B", bg: "#FFF0F0" },
  { id: "calm",      label: "平靜 😌",    color: "#4ECDC4", bg: "#F0FAFA" },
  { id: "anxious",   label: "焦慮 😟",    color: "#FFB347", bg: "#FFF8EE" },
  { id: "tired",     label: "疲憊 😴",    color: "#9B8EA8", bg: "#F5F2F8" },
  { id: "angry",     label: "煩躁 😤",    color: "#FF6B9D", bg: "#FFF0F6" },
  { id: "sad",       label: "低落 😔",    color: "#74B9FF", bg: "#F0F7FF" },
  { id: "motivated", label: "充滿動力 💪", color: "#6BCB77", bg: "#F0FBF2" },
  { id: "stressed",  label: "壓力大 😰",  color: "#A29BFE", bg: "#F3F2FF" },
];

const SCORE_COLOR = (s) => {
  const palette = ["","#FF6B6B","#FF8E72","#FFAA64","#FFC34D","#FFD93D","#C8E96B","#8FDE7A","#56CF86","#2EBE8E","#00B090"];
  return palette[s] || "#00B090";
};

const getMoodLabel = (s) => {
  if (s <= 2) return "很差 😞";
  if (s <= 4) return "不太好 😕";
  if (s <= 6) return "還不錯 😐";
  if (s <= 8) return "不錯喔 😊";
  return "超棒的 🌟";
};

const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const fmt = (d) => { const x = new Date(d + "T00:00:00"); return `${x.getMonth()+1}/${x.getDate()}`; };

const pad = (n) => String(n).padStart(2, "0");

const THEMES = [
  { id:"coral",    name:"珊瑚粉", emoji:"🌸", accent:"#FF6B6B", accent2:"#FF8E72", bg:"#FFF8F4", border:"#FFE8DC", muted:"#C4A99A", border2:"#FFD4C8", soft:"#FFF0F0", input:"#FFFCFB", grid:"#FFF0EB", loading:"#FFB3A7", errb:"#FFCCC4", faint:"#DDD0CC", rgb:"255,107,107" },
  { id:"ocean",    name:"海洋藍", emoji:"🌊", accent:"#4A90D9", accent2:"#6BB6E8", bg:"#F3F8FD", border:"#DCEAF7", muted:"#8FA5BA", border2:"#C8DDF2", soft:"#EAF3FC", input:"#F9FCFF", grid:"#E8F1FA", loading:"#A9C9EC", errb:"#C0D8F0", faint:"#CBD8E4", rgb:"74,144,217" },
  { id:"mint",     name:"薄荷綠", emoji:"🌿", accent:"#2FB58A", accent2:"#5CCFA8", bg:"#F2FBF7", border:"#D8F0E5", muted:"#86A99A", border2:"#BFE6D5", soft:"#E7F7EF", input:"#F8FEFB", grid:"#E5F5EC", loading:"#9ADBC3", errb:"#B8E3D2", faint:"#C5D9D0", rgb:"47,181,138" },
  { id:"lavender", name:"薰衣草", emoji:"💜", accent:"#8B7CF6", accent2:"#A99BFA", bg:"#F7F5FE", border:"#E6E1FA", muted:"#A39BBF", border2:"#D6CFF7", soft:"#F0EDFD", input:"#FCFBFF", grid:"#EEEAFB", loading:"#C3BBF8", errb:"#D3CCF5", faint:"#D5D0E6", rgb:"139,124,246" },
  { id:"sunny",    name:"暖陽橘", emoji:"☀️", accent:"#F59E0B", accent2:"#FBBF24", bg:"#FFFAF0", border:"#FCEBC8", muted:"#BBA67A", border2:"#F9DFA8", soft:"#FEF3DC", input:"#FFFDF8", grid:"#FCF0D8", loading:"#FAD58A", errb:"#F5DDA5", faint:"#DDD2BB", rgb:"245,158,11" },
];

const CHAT_STYLES = [
  { id:"heal", emoji:"🫶", name:"療癒陪伴", desc:"先聽你說，再慢慢整理心情",
    role:"你是一位溫柔、真誠、很會傾聽的朋友，同時懂一些心理知識。",
    goal:"先接住我的感受，讓我覺得被理解，再輕輕地幫我看見這段時間情緒的變化，以及我自己已經做到的事。",
    avoid:"不要急著給建議，不要說教，也不要用「你應該」。" },
  { id:"cbt", emoji:"🔍", name:"換個角度", desc:"找出情緒的觸發點，練習調整想法",
    role:"你是一位溫暖又有條理的情緒教練，熟悉認知行為的思路，但說話像一般人聊天，不用術語。",
    goal:"從記錄中找出反覆出現的情緒、可能的觸發情境，以及我腦中可能閃過的想法，用提問的方式邀請我換個角度看，而不是直接給我答案。",
    avoid:"不要貼標籤或下診斷，不要把推測說成事實，不確定的地方請用問的。" },
  { id:"action", emoji:"🌱", name:"小步行動", desc:"依你的高低起伏，給可以馬上做的小事",
    role:"你是一位務實但有溫度的生活夥伴。",
    goal:"根據我心情較好和較低的日子，幫我找出對我有效的事，並提出一到三個小到幾乎不費力的行動，讓我挑一個今天或這週就能試的。",
    avoid:"不要列一大串清單，不要給我壓力，做不到也沒關係。" },
];

const TONE_HINTS = [
  "這次的口吻像在咖啡店跟熟朋友聊天，輕鬆自然。",
  "這次的口吻沉穩安靜，像夜裡陪我坐著的人。",
  "這次可以帶一點點幽默，但不要讓我覺得被敷衍。",
  "這次的口吻溫暖直接，像一個很懂我的老朋友。",
  "這次說話慢一點、簡單一點，像在傳訊息給我。",
];
const OPEN_HINTS = [
  "可以從記錄裡讓你最有感觸的一個小細節開口。",
  "可以先簡單回應我最近過得怎麼樣，再慢慢展開。",
  "可以先從我做得不錯、值得被看見的地方說起。",
  "不必有固定開場，自然地開始就好。",
  "可以先輕輕問我一個問題，再分享你的觀察。",
];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// 試用回饋問卷連結（Google 表單、Tally 等）。留空的話，就不會顯示「意見回饋」按鈕。
const FEEDBACK_URL = "";

const ONBOARD = [
  { emoji:"🌸", title:"歡迎來到心情日記", body:"每天花 30 秒記下分數和情緒標籤，之後就能看見自己的情緒變化。想補記前幾天、看月曆或趨勢圖，都可以。" },
  { emoji:"🔒", title:"你的資料只在你的手機", body:"記錄存在這支手機的瀏覽器裡，沒有上傳，開發者也看不到。換手機或清除瀏覽器資料就會消失，建議定期到「趨勢」頁最下方備份。" },
  { emoji:"📲", title:"加到主畫面更方便", body:"iPhone：用 Safari 開啟，點下方分享按鈕，選「加入主畫面」。\nAndroid：用 Chrome 開啟，點右上角選單，選「安裝應用程式」或「加到主畫面」。" },
  { emoji:"💛", title:"小提醒", body:"這是記錄與整理心情的小工具，不是醫療或診斷工具。如果你覺得難以負荷，請找信任的人或專業人士聊聊。台灣可撥安心專線 1925（24 小時）。" },
];

const TABS = [
  { id: "log",     label: "記錄",  icon: "✏️" },
  { id: "calendar", label: "月曆", icon: "🗓️" },
  { id: "history", label: "趨勢",  icon: "📈" },
  { id: "ai",      label: "分析", icon: "✨" },
];

export default function MoodTracker() {
  const [entries, setEntries] = useState(() => {
    try { return JSON.parse(localStorage.getItem("mood_v3") || "[]"); } catch { return []; }
  });
  const [view, setView] = useState("log");
  const [score, setScore] = useState(7);
  const [tags, setTags] = useState([]);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiErr, setAiErr] = useState("");

  const todayEntry = entries.find(e => e.date === today());

  const [themeId, setThemeId] = useState(() => { try { return localStorage.getItem("mood_theme") || "coral"; } catch { return "coral"; } });
  const [showTheme, setShowTheme] = useState(false);
  const [onboardStep, setOnboardStep] = useState(() => { try { return localStorage.getItem("mood_onboarded") ? -1 : 0; } catch { return -1; } });
  const [showAbout, setShowAbout] = useState(false);
  const [aboutMsg, setAboutMsg] = useState("");
  const finishOnboard = () => { try { localStorage.setItem("mood_onboarded", "1"); } catch {} setOnboardStep(-1); };
  const shareApp = async () => {
    const url = window.location.origin;
    const text = "我在用這個免費的心情日記 app：每天記錄心情分數和情緒，資料只存在自己的手機。一起來試試看 👉";
    try { if (navigator.share) { await navigator.share({ title:"心情日記", text, url }); return; } }
    catch (e) { if (e && e.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(`${text} ${url}`); setAboutMsg("✓ 已複製分享連結"); }
    catch { setAboutMsg("複製失敗，請手動複製網址"); }
    setTimeout(() => setAboutMsg(""), 3000);
  };
  const T = THEMES.find(t => t.id === themeId) || THEMES[0];
  const themeVars = { "--accent":T.accent, "--accent2":T.accent2, "--bg":T.bg, "--border":T.border, "--muted":T.muted, "--border2":T.border2, "--soft":T.soft, "--input":T.input, "--grid":T.grid, "--loading":T.loading, "--errb":T.errb, "--faint":T.faint, "--rgb":T.rgb };
  useEffect(() => {
    try { localStorage.setItem("mood_theme", themeId); } catch {}
    document.body.style.background = T.bg;
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute("content", T.accent);
  }, [themeId]);

  const [range, setRange] = useState(14);
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return { y:d.getFullYear(), m:d.getMonth() }; });
  const [calSel, setCalSel] = useState(null);
  const shiftMonth = (delta) => {
    setCalMonth(({y,m}) => { const d = new Date(y, m+delta, 1); return { y:d.getFullYear(), m:d.getMonth() }; });
    setCalSel(null);
  };
  const monthCells = () => {
    const startDow = new Date(calMonth.y, calMonth.m, 1).getDay();
    const dim = new Date(calMonth.y, calMonth.m+1, 0).getDate();
    const cells = [];
    for (let i=0;i<startDow;i++) cells.push(null);
    for (let d=1; d<=dim; d++) cells.push(`${calMonth.y}-${pad(calMonth.m+1)}-${pad(d)}`);
    return cells;
  };

  const [selDate, setSelDate] = useState(today());
  const [openDate, setOpenDate] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const selEntry = entries.find(e => e.date === selDate);

  const loadForm = (e) => {
    if (e) { setScore(e.score); setTags(e.tags); setNote(e.note||""); }
    else { setScore(7); setTags([]); setNote(""); }
  };
  useEffect(() => { loadForm(entries.find(x => x.date === selDate)); }, [selDate]);

  const editEntry = (d) => {
    setSelDate(d); loadForm(entries.find(x => x.date === d));
    setView("log"); window.scrollTo(0, 0);
  };
  const deleteEntry = (d) => {
    setEntries(p => p.filter(e => e.date !== d));
    setOpenDate(null); setConfirmDel(null);
    if (d === selDate) loadForm(null);
  };

  useEffect(() => { localStorage.setItem("mood_v3", JSON.stringify(entries)); }, [entries]);

  const toggleTag = (id) => setTags(p => p.includes(id) ? p.filter(t=>t!==id) : [...p,id]);

  const handleSave = () => {
    const entry = { date: selDate, score, tags, note };
    setEntries(p => [...p.filter(e=>e.date!==selDate), entry].sort((a,b)=>a.date.localeCompare(b.date)));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const analyzeLocal = () => {
    const list = entries.slice(-14);
    const n = list.length;
    const avgOf = (arr) => arr.reduce((t,e)=>t+e.score,0)/arr.length;
    const tagName = (id) => (EMOTION_TAGS.find(t=>t.id===id)?.label.split(" ")[0]) || id;
    const avg = avgOf(list);
    const out = [];

    // 1. 趨勢
    let trend;
    if (n < 4) {
      trend = `目前只有 ${n} 天記錄，平均 ${avg.toFixed(1)} 分。再多記錄幾天，我就能看出你的情緒走向了。`;
    } else {
      const h = Math.floor(n/2);
      const diff = avgOf(list.slice(h)) - avgOf(list.slice(0,h));
      const dir = diff >= 1 ? "明顯回升 📈" : diff <= -1 ? "有些下滑 📉" : "大致穩定 ➡️";
      trend = `最近 ${n} 天平均 ${avg.toFixed(1)} 分，近期相較前期${dir}。`;
      const hi = list.reduce((m,e)=>e.score>m.score?e:m), lo = list.reduce((m,e)=>e.score<m.score?e:m);
      if (hi.score !== lo.score) trend += `最高是 ${fmt(hi.date)}（${hi.score} 分），最低是 ${fmt(lo.date)}（${lo.score} 分）。`;
    }
    out.push("**整體情緒趨勢**\n" + trend);

    // 2. 模式
    const stat = {};
    list.forEach(e => e.tags.forEach(t => { (stat[t] = stat[t] || []).push(e.score); }));
    const rows = Object.entries(stat).map(([id,v]) => ({ id, c:v.length, avg: v.reduce((a,b)=>a+b,0)/v.length }));
    let pattern = "";
    const usable = rows.filter(r=>r.c>=2);
    if (usable.length >= 2) {
      const best = usable.reduce((m,r)=>r.avg>m.avg?r:m), worst = usable.reduce((m,r)=>r.avg<m.avg?r:m);
      pattern += `標記「${tagName(best.id)}」的日子平均 ${best.avg.toFixed(1)} 分，最有精神；標記「${tagName(worst.id)}」時平均 ${worst.avg.toFixed(1)} 分，最需要照顧自己。`;
    } else if (rows.length) {
      const top = rows.reduce((m,r)=>r.c>m.c?r:m);
      pattern += `你最常出現的情緒是「${tagName(top.id)}」（${top.c} 次）。`;
    } else {
      pattern += "你還沒有使用情緒標籤，加上標籤後我能幫你找出哪些情緒會拉高或拉低心情。";
    }
    if (n >= 7) {
      const wd = ["日","一","二","三","四","五","六"];
      const g = {};
      list.forEach(e => { const d = new Date(e.date+"T00:00:00").getDay(); (g[d] = g[d] || []).push(e.score); });
      const w = Object.entries(g).map(([d,v])=>({ d, avg: v.reduce((a,b)=>a+b,0)/v.length }));
      if (w.length >= 3) {
        const bw = w.reduce((m,r)=>r.avg>m.avg?r:m), ww = w.reduce((m,r)=>r.avg<m.avg?r:m);
        if (bw.avg - ww.avg >= 1) pattern += `星期${wd[bw.d]}通常心情最好，星期${wd[ww.d]}最低。`;
      }
    }
    out.push("**情緒模式觀察**\n" + pattern);

    // 3. 建議
    let tip;
    const low = rows.filter(r=>r.c>=2).sort((a,b)=>a.avg-b.avg)[0];
    if (avg <= 4) tip = "最近心情偏低，先別對自己太嚴格。找信任的人聊聊，或安排一件讓你放鬆的小事；如果低落持續超過兩週，建議諮詢專業人士。";
    else if (low && low.avg <= 5 && ["tired","stressed","anxious"].includes(low.id)) tip = `「${tagName(low.id)}」是讓你分數偏低的主因，試著在這類日子留 15 分鐘給自己，例如散步、深呼吸或早點休息。`;
    else if (avg >= 7) tip = "整體狀態不錯！記下最近讓你開心的事，低潮時回頭看會很有力量。";
    else tip = "狀態算穩定。試著每天固定時間記錄，並在備註寫下一件讓你心情變好或變差的小事，之後更容易找到規律。";
    out.push("**一個小建議**\n" + tip);
    return out.join("\n");
  };

  const handleAI = () => {
    if (!entries.length) return;
    setAiLoading(true); setAiText(""); setAiErr("");
    setTimeout(() => { setAiText(analyzeLocal()); setAiLoading(false); }, 400);
  };

  const [copyMsg, setCopyMsg] = useState("");
  const [chatTopic, setChatTopic] = useState("");

  const buildPrompt = (styleId) => {
    const st = CHAT_STYLES.find(x => x.id === styleId) || CHAT_STYLES[0];
    const list = entries.slice(-14);
    const tagLabel = (t) => (EMOTION_TAGS.find(x => x.id === t)?.label.split(" ")[0]) || t;
    const lines = list.map(e => `${e.date}｜${e.score}/10｜${e.tags.map(tagLabel).join("、") || "未標記"}｜${e.note || "（沒寫備註）"}`).join("\n");
    const avgS = (list.reduce((t,e)=>t+e.score,0) / list.length).toFixed(1);
    const hi = Math.max(...list.map(e=>e.score)), lo = Math.min(...list.map(e=>e.score));
    const topic = chatTopic.trim();
    return [
      st.role,
      `以下是我最近 ${list.length} 天的情緒記錄（格式：日期｜分數 1-10｜情緒標籤｜備註）。平均 ${avgS} 分，最高 ${hi}、最低 ${lo}。`,
      lines,
      topic ? `我現在特別想聊的是：${topic}` : "",
      `你的目標：${st.goal}`,
      `回應方式：
- 用繁體中文，像真人說話，不要像報告或問卷。
- 不要套固定格式：不要編號、不要固定的小標題，也不要每次都用同一種開頭和結尾。
- 長短依我的記錄多寡和內容自然調整；記錄少就簡短一點，記錄豐富再多聊一些。
- 一定要引用我記錄裡的具體細節（日期、備註、標籤），讓我感覺你真的有看。
- ${st.avoid}
- ${pick(TONE_HINTS)}${pick(OPEN_HINTS)}
- 結尾留一個輕輕的問題或邀請，讓我可以接著聊，但不要每次都用同一種問法。
- 你只是陪伴和整理思緒的夥伴，不是醫療人員。只有在我的記錄顯示持續低落、或我提到想傷害自己時，才溫和地提醒我可以找信任的人或專業人士聊聊（台灣可撥安心專線 1925），平常不必特別強調。`,
    ].filter(Boolean).join("\n\n");
  };

  const copyForClaude = async (styleId) => {
    if (!entries.length) return;
    const st = CHAT_STYLES.find(x => x.id === styleId);
    const text = buildPrompt(styleId);
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch {}
    if (!ok) {
      try {
        const ta = document.createElement("textarea");
        ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select(); ok = document.execCommand("copy"); ta.remove();
      } catch {}
    }
    setCopyMsg(ok ? `✓ 已複製「${st.name}」，到 Claude 貼上就能開始聊` : "複製失敗，請稍後再試");
    setTimeout(() => setCopyMsg(""), 5000);
  };

  const [backupMsg, setBackupMsg] = useState("");
  const flash = (m) => { setBackupMsg(m); setTimeout(()=>setBackupMsg(""), 3500); };

  const saveFile = async (filename, mime, content) => {
    const file = new File([content], filename, { type: mime });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
        return true;
      }
    } catch (e) { if (e.name === "AbortError") return false; }
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
    return true;
  };

  const exportCSV = async () => {
    if (!entries.length) return flash("還沒有資料可以匯出");
    const tagMap = Object.fromEntries(EMOTION_TAGS.map(t=>[t.id, t.label.split(" ")[0]]));
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [["日期","分數","情緒標籤","備註"].map(esc).join(",")]
      .concat(entries.map(e => [e.date, e.score, e.tags.map(t=>tagMap[t]||t).join("、"), e.note||""].map(esc).join(",")));
    const ok = await saveFile(`mood-${today()}.csv`, "text/csv;charset=utf-8", "\uFEFF" + rows.join("\r\n"));
    if (ok) flash("✓ CSV 已匯出");
  };

  const exportJSON = async () => {
    if (!entries.length) return flash("還沒有資料可以備份");
    const ok = await saveFile(`mood-backup-${today()}.json`, "application/json", JSON.stringify(entries, null, 2));
    if (ok) flash("✓ 備份檔已匯出");
  };

  const importJSON = (ev) => {
    const f = ev.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        if (!Array.isArray(data)) throw new Error();
        const valid = data.filter(x => x && typeof x.date === "string" && Number.isFinite(x.score) && x.score>=1 && x.score<=10)
          .map(x => ({ date: x.date, score: x.score, tags: Array.isArray(x.tags)?x.tags:[], note: x.note||"" }));
        if (!valid.length) throw new Error();
        setEntries(prev => {
          const map = new Map(prev.map(e=>[e.date,e]));
          valid.forEach(e=>map.set(e.date,e));
          return [...map.values()].sort((a,b)=>a.date.localeCompare(b.date));
        });
        flash(`✓ 已匯入 ${valid.length} 筆記錄`);
      } catch { flash("檔案格式不正確"); }
    };
    r.readAsText(f);
    ev.target.value = "";
  };

  const cutoff = (() => {
    if (!range) return "";
    const d = new Date(); d.setDate(d.getDate() - (range-1));
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  })();
  const chartData = entries.filter(e => e.date >= cutoff).map(e => ({ date: fmt(e.date), 分數: e.score }));
  const avg = entries.length ? (entries.reduce((s,e)=>s+e.score,0)/entries.length).toFixed(1) : null;
  const trendVal = entries.length>=2
    ? entries[entries.length-1].score > entries[entries.length-2].score ? "↑ 上升"
    : entries[entries.length-1].score < entries[entries.length-2].score ? "↓ 下降" : "→ 持平"
    : "—";

  const col = SCORE_COLOR(score);

  const renderAI = (text) => text.split("\n").filter(Boolean).map((line, i) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <p key={i} style={{ margin: "0 0 12px", lineHeight: 1.8 }}>
        {parts.map((p, j) =>
          p.startsWith("**") && p.endsWith("**")
            ? <strong key={j} style={{ color: "var(--accent)", fontWeight: 700 }}>{p.slice(2,-2)}</strong>
            : p
        )}
      </p>
    );
  });

  return (
    <div style={{ ...themeVars, minHeight:"100vh", background:"var(--bg)", fontFamily:"'Inter',-apple-system,sans-serif", color:"#2D2D2D", paddingBottom:100 }}>

      {/* Header */}
      <div style={{ background:"white", borderBottom:"1px solid var(--border)", padding:"22px 24px 14px", position:"sticky", top:0, zIndex:10, boxShadow:"0 2px 12px rgba(var(--rgb),0.06)" }}>
        <div style={{ maxWidth:540, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <h1 style={{ fontSize:20, fontWeight:800, margin:0, color:"var(--accent)", letterSpacing:"-0.3px" }}>心情日記 {T.emoji}</h1>
            <p style={{ margin:"2px 0 0", color:"var(--muted)", fontSize:12 }}>
              {new Date().toLocaleDateString("zh-TW",{year:"numeric",month:"long",day:"numeric",weekday:"long"})}
            </p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {todayEntry && (
            <div style={{ background:`${SCORE_COLOR(todayEntry.score)}15`, border:`1.5px solid ${SCORE_COLOR(todayEntry.score)}40`, borderRadius:12, padding:"6px 14px", fontSize:13, fontWeight:700, color:SCORE_COLOR(todayEntry.score) }}>
              今日 {todayEntry.score}/10
            </div>
          )}
          <button onClick={()=>setShowAbout(true)} aria-label="關於與說明" style={{ width:38, height:38, borderRadius:12, border:"1.5px solid var(--border2)", background:"var(--soft)", fontSize:16, fontWeight:800, color:"var(--accent)", cursor:"pointer", fontFamily:"inherit" }}>ⓘ</button>
          <button onClick={()=>setShowTheme(v=>!v)} aria-label="介面顏色" style={{ width:38, height:38, borderRadius:12, border:"1.5px solid var(--border2)", background:"var(--soft)", fontSize:18, cursor:"pointer" }}>🎨</button>
          </div>
        </div>
        {showTheme && (
          <div style={{ position:"absolute", right:16, top:"100%", marginTop:8, background:"white", border:"1px solid var(--border)", borderRadius:18, padding:16, boxShadow:"0 8px 30px rgba(0,0,0,0.12)", width:250 }}>
            <div style={{ fontSize:12, color:"var(--muted)", fontWeight:600, marginBottom:12 }}>介面顏色</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
              {THEMES.map(t => (
                <button key={t.id} onClick={()=>{ setThemeId(t.id); setShowTheme(false); }} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", width:64, padding:0, fontFamily:"inherit" }}>
                  <span style={{ width:40, height:40, borderRadius:99, background:`linear-gradient(135deg,${t.accent},${t.accent2})`, border: themeId===t.id ? "3px solid #2D2D2D" : "3px solid white", boxShadow:"0 2px 8px rgba(0,0,0,0.15)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:16, fontWeight:800 }}>{themeId===t.id ? "✓" : ""}</span>
                  <span style={{ fontSize:11, color:"#6B5B5B" }}>{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ maxWidth:540, margin:"0 auto", padding:"20px 20px 0" }}>

        {/* LOG */}
        {view==="log" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Score card */}
            <div style={{ background:"white", borderRadius:24, padding:"24px", border:"1px solid var(--border)", boxShadow:"0 4px 20px rgba(var(--rgb),0.06)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:18, flexWrap:"wrap" }}>
                <input type="date" value={selDate} max={today()} min="2020-01-01"
                  onChange={e => { if (e.target.value) setSelDate(e.target.value); }}
                  style={{ border:"1.5px solid var(--border2)", borderRadius:10, padding:"8px 10px", fontSize:14, color:"#2D2D2D", background:"var(--input)", fontFamily:"inherit", outline:"none" }} />
                {selDate !== today() && (
                  <button onClick={()=>setSelDate(today())} style={{ padding:"8px 12px", borderRadius:10, border:"none", background:"var(--soft)", color:"var(--accent)", fontWeight:700, fontSize:13, cursor:"pointer" }}>回到今天</button>
                )}
                {selEntry && <span style={{ fontSize:12, color:"var(--muted)" }}>這天已有記錄，儲存會更新</span>}
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                <div>
                  <div style={{ fontSize:12, color:"var(--muted)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px" }}>{selDate===today() ? "今日" : fmt(selDate)} 心情分數</div>
                  <div style={{ fontSize:13, color:col, fontWeight:600, marginTop:4 }}>{getMoodLabel(score)}</div>
                </div>
                <div style={{ fontSize:56, fontWeight:900, lineHeight:1, color:col, textShadow:`0 4px 20px ${col}40` }}>{score}</div>
              </div>

              <input type="range" min={1} max={10} value={score}
                onChange={e=>setScore(Number(e.target.value))}
                style={{ width:"100%", appearance:"none", height:8, borderRadius:99, outline:"none", cursor:"pointer",
                  background:`linear-gradient(90deg, ${col} ${(score-1)/9*100}%, var(--border) ${(score-1)/9*100}%)` }}
              />
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <div key={n} onClick={()=>setScore(n)} style={{ width:28, height:28, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:12, fontWeight:score===n?800:400, cursor:"pointer",
                    background:score===n?col+"20":"transparent", color:score===n?col:"var(--muted)",
                    transition:"all 0.15s" }}>
                    {n}
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div style={{ background:"white", borderRadius:24, padding:"20px", border:"1px solid var(--border)", boxShadow:"0 4px 20px rgba(var(--rgb),0.06)" }}>
              <div style={{ fontSize:12, color:"var(--muted)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:14 }}>情緒標籤</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {EMOTION_TAGS.map(tag => {
                  const on = tags.includes(tag.id);
                  return (
                    <button key={tag.id} onClick={()=>toggleTag(tag.id)} style={{
                      padding:"8px 14px", borderRadius:99, border:`1.5px solid ${on?tag.color:"var(--border)"}`,
                      background:on?tag.bg:"white", color:on?tag.color:"var(--muted)",
                      fontSize:13, fontWeight:on?700:400, cursor:"pointer", transition:"all 0.15s",
                    }}>{tag.label}</button>
                  );
                })}
              </div>
            </div>

            {/* Note */}
            <div style={{ background:"white", borderRadius:24, padding:"20px", border:"1px solid var(--border)", boxShadow:"0 4px 20px rgba(var(--rgb),0.06)" }}>
              <div style={{ fontSize:12, color:"var(--muted)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:12 }}>今日備注（選填）</div>
              <textarea value={note} onChange={e=>setNote(e.target.value)}
                placeholder="今天有什麼想記下來的嗎..." rows={3}
                style={{ width:"100%", border:"1.5px solid var(--border)", borderRadius:12, padding:"12px 14px", color:"#2D2D2D",
                  fontSize:14, resize:"none", outline:"none", fontFamily:"inherit", lineHeight:1.7,
                  background:"var(--input)", boxSizing:"border-box" }}
              />
            </div>

            {/* Save */}
            <button onClick={handleSave} style={{
              width:"100%", padding:"16px", borderRadius:16, border:"none",
              background:saved?"linear-gradient(135deg,#6BCB77,#4ECDC4)":"linear-gradient(135deg,var(--accent),var(--accent2))",
              color:"white", fontSize:16, fontWeight:800, cursor:"pointer", transition:"all 0.3s",
              boxShadow:saved?"0 6px 20px rgba(107,203,119,0.35)":"0 6px 20px rgba(var(--rgb),0.35)",
            }}>
              {saved ? "✓ 已儲存！" : selEntry ? (selDate===today() ? "更新今日記錄" : `更新 ${fmt(selDate)} 的記錄`) : (selDate===today() ? "儲存今日心情" : `儲存 ${fmt(selDate)} 的心情`)}
            </button>
            <div style={{ display:"flex", justifyContent:"center", gap:18, fontSize:13, flexWrap:"wrap" }}>
              {FEEDBACK_URL && <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer" style={{ color:"var(--accent)", fontWeight:700, textDecoration:"none" }}>💬 意見回饋</a>}
              <button onClick={shareApp} style={{ background:"none", border:"none", color:"var(--accent)", fontWeight:700, fontSize:13, cursor:"pointer", padding:0, fontFamily:"inherit" }}>📤 分享給朋友</button>
              <button onClick={()=>setShowAbout(true)} style={{ background:"none", border:"none", color:"var(--muted)", fontWeight:600, fontSize:13, cursor:"pointer", padding:0, fontFamily:"inherit" }}>🔒 隱私說明</button>
            </div>
            {aboutMsg && !showAbout && <div style={{ textAlign:"center", fontSize:13, color:"var(--accent)", fontWeight:600 }}>{aboutMsg}</div>}
          </div>
        )}

        {/* CALENDAR */}
        {view==="calendar" && (() => {
          const cells = monthCells();
          const prefix = `${calMonth.y}-${pad(calMonth.m+1)}`;
          const monthEntries = entries.filter(e => e.date.startsWith(prefix));
          const mAvg = monthEntries.length ? (monthEntries.reduce((t,e)=>t+e.score,0)/monthEntries.length).toFixed(1) : "—";
          const isCurrent = prefix === today().slice(0,7);
          const selE = calSel ? entries.find(e => e.date === calSel) : null;
          const navBtn = { width:36, height:36, borderRadius:10, border:"1.5px solid var(--border2)", background:"var(--bg)", color:"var(--accent)", fontSize:16, fontWeight:800, cursor:"pointer", fontFamily:"inherit" };
          return (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ background:"white", borderRadius:24, padding:"20px 16px", border:"1px solid var(--border)", boxShadow:"0 4px 16px rgba(var(--rgb),0.05)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                  <button onClick={()=>shiftMonth(-1)} style={navBtn}>‹</button>
                  <div style={{ fontSize:17, fontWeight:800, color:"#2D2D2D" }}>{calMonth.y} 年 {calMonth.m+1} 月</div>
                  <button onClick={()=>shiftMonth(1)} disabled={isCurrent} style={{ ...navBtn, opacity:isCurrent?0.35:1, cursor:isCurrent?"default":"pointer" }}>›</button>
                </div>
                <div style={{ textAlign:"center", fontSize:12, color:"var(--muted)", marginBottom:14 }}>本月記錄 {monthEntries.length} 天　平均 {mAvg} 分</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:6, marginBottom:6 }}>
                  {["日","一","二","三","四","五","六"].map(w => (
                    <div key={w} style={{ textAlign:"center", fontSize:11, color:"var(--muted)", fontWeight:600 }}>{w}</div>
                  ))}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:6 }}>
                  {cells.map((d,i) => {
                    if (!d) return <div key={"b"+i} />;
                    const e = entries.find(x => x.date === d);
                    const future = d > today();
                    const isToday = d === today();
                    const sc = e ? SCORE_COLOR(e.score) : null;
                    const picked = calSel === d;
                    return (
                      <button key={d} disabled={future} onClick={()=>setCalSel(picked ? null : d)} style={{
                        aspectRatio:"1", borderRadius:12, padding:0, fontFamily:"inherit",
                        border: picked ? "2px solid var(--accent)" : isToday ? "2px dashed var(--accent)" : `1.5px solid ${e ? sc+"55" : "var(--border)"}`,
                        background: e ? sc+"25" : "var(--input)", opacity: future ? 0.35 : 1, cursor: future ? "default" : "pointer",
                        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2,
                      }}>
                        <span style={{ fontSize:10, color:"var(--muted)", lineHeight:1 }}>{Number(d.slice(8))}</span>
                        <span style={{ fontSize:16, fontWeight:900, color:e?sc:"transparent", lineHeight:1 }}>{e ? e.score : "0"}</span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:16, fontSize:11, color:"var(--muted)" }}>
                  <span>低</span>
                  <div style={{ flex:1, height:6, borderRadius:99, background:`linear-gradient(90deg, ${SCORE_COLOR(1)}, ${SCORE_COLOR(5)}, ${SCORE_COLOR(10)})` }} />
                  <span>高</span>
                </div>
              </div>

              {calSel && (
                <div style={{ background:"white", borderRadius:24, padding:"20px", border:"1px solid var(--border)", boxShadow:"0 4px 16px rgba(var(--rgb),0.05)" }}>
                  <div style={{ fontSize:12, color:"var(--muted)", fontWeight:600, marginBottom:10 }}>{calSel.slice(0,4)} 年 {Number(calSel.slice(5,7))} 月 {Number(calSel.slice(8))} 日</div>
                  {selE ? (
                    <div>
                      <div style={{ display:"flex", alignItems:"baseline", gap:10, marginBottom:10 }}>
                        <span style={{ fontSize:40, fontWeight:900, color:SCORE_COLOR(selE.score), lineHeight:1 }}>{selE.score}</span>
                        <span style={{ fontSize:13, color:SCORE_COLOR(selE.score), fontWeight:600 }}>{getMoodLabel(selE.score)}</span>
                      </div>
                      {selE.tags.length>0 && (
                        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
                          {selE.tags.map(tid => {
                            const tag = EMOTION_TAGS.find(t=>t.id===tid);
                            return tag ? <span key={tid} style={{ fontSize:12, padding:"3px 10px", borderRadius:99, background:tag.bg, color:tag.color, fontWeight:600 }}>{tag.label}</span> : null;
                          })}
                        </div>
                      )}
                      {selE.note && <div style={{ fontSize:14, color:"#4A3A3A", lineHeight:1.7, whiteSpace:"pre-wrap", wordBreak:"break-word", marginBottom:12 }}>{selE.note}</div>}
                      <button onClick={()=>editEntry(calSel)} style={{ width:"100%", padding:"11px", borderRadius:12, border:"1.5px solid var(--border2)", background:"var(--bg)", color:"var(--accent)", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>✏️ 編輯這天</button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize:14, color:"var(--muted)", marginBottom:12 }}>這天還沒有記錄</div>
                      <button onClick={()=>editEntry(calSel)} style={{ width:"100%", padding:"11px", borderRadius:12, border:"none", background:"linear-gradient(135deg,var(--accent),var(--accent2))", color:"white", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>＋ 記錄這天</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* HISTORY */}
        {view==="history" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {entries.length>0 && (
              <div style={{ display:"flex", gap:10 }}>
                {[
                  { icon:"📅", val:entries.length+" 天", label:"記錄天數" },
                  { icon:"⭐", val:avg||"—", label:"平均分數" },
                  { icon:"📊", val:trendVal, label:"最近趨勢" },
                ].map(s => (
                  <div key={s.label} style={{ flex:1, background:"white", borderRadius:18, padding:"14px 8px",
                    textAlign:"center", border:"1px solid var(--border)", boxShadow:"0 4px 16px rgba(var(--rgb),0.05)" }}>
                    <div style={{ fontSize:20, marginBottom:4 }}>{s.icon}</div>
                    <div style={{ fontSize:18, fontWeight:800, color:"var(--accent)" }}>{s.val}</div>
                    <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background:"white", borderRadius:24, padding:"20px 12px 16px", border:"1px solid var(--border)", boxShadow:"0 4px 16px rgba(var(--rgb),0.05)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, padding:"0 8px", gap:8, flexWrap:"wrap" }}>
                <div style={{ fontSize:12, color:"var(--muted)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px" }}>{range ? `近 ${range} 天趨勢` : "全部趨勢"}</div>
                <div style={{ display:"flex", gap:4, background:"var(--bg)", borderRadius:10, padding:3 }}>
                  {[[7,"7天"],[14,"14天"],[30,"30天"],[0,"全部"]].map(([v,l]) => (
                    <button key={v} onClick={()=>setRange(v)} style={{ padding:"5px 10px", borderRadius:8, border:"none", fontSize:12, fontWeight:700, cursor:"pointer", background:range===v?"var(--accent)":"transparent", color:range===v?"white":"var(--muted)", fontFamily:"inherit" }}>{l}</button>
                  ))}
                </div>
              </div>
              {chartData.length>1 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={T.accent} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={T.accent} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.grid} />
                    <XAxis dataKey="date" interval="preserveStartEnd" minTickGap={16} tick={{ fill:T.muted, fontSize:11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[1,10]} tick={{ fill:T.muted, fontSize:11 }} axisLine={false} tickLine={false} width={22} />
                    <Tooltip contentStyle={{ background:"white", border:"1px solid var(--border)", borderRadius:12, color:"#2D2D2D", fontSize:13 }} />
                    <Area type="monotone" dataKey="分數" stroke={T.accent} strokeWidth={2.5} fill="url(#g)" dot={{ fill:T.accent, r:4, strokeWidth:0 }} activeDot={{ r:6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ padding:"30px 10px", textAlign:"center", color:"var(--muted)", fontSize:14 }}>這段期間至少要有 2 天記錄，才會顯示趨勢圖 📈</div>
              )}
            </div>

            <div style={{ background:"white", borderRadius:24, padding:"20px", border:"1px solid var(--border)", boxShadow:"0 4px 16px rgba(var(--rgb),0.05)" }}>
              <div style={{ fontSize:12, color:"var(--muted)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:14 }}>所有記錄</div>
              {entries.length===0 ? (
                <div style={{ color:"var(--faint)", fontSize:14, textAlign:"center", padding:"20px 0" }}>還沒有記錄，先去記錄今天的心情吧！</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {[...entries].reverse().map(entry => {
                    const ec = SCORE_COLOR(entry.score);
                    const open = openDate === entry.date;
                    return (
                      <div key={entry.date} style={{ borderRadius:14, background:"var(--bg)", overflow:"hidden" }}>
                        <div onClick={()=>{ setOpenDate(open?null:entry.date); setConfirmDel(null); }} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px", cursor:"pointer" }}>
                        <div style={{ width:42, height:42, borderRadius:12, background:ec+"15", border:`1.5px solid ${ec}40`,
                          display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, fontWeight:900, color:ec, flexShrink:0 }}>
                          {entry.score}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12, color:"var(--muted)", marginBottom:4 }}>{fmt(entry.date)}</div>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                            {entry.tags.map(tid => {
                              const tag = EMOTION_TAGS.find(t=>t.id===tid);
                              return tag ? <span key={tid} style={{ fontSize:11, padding:"2px 8px", borderRadius:99, background:tag.bg, color:tag.color, fontWeight:600 }}>{tag.label}</span> : null;
                            })}
                          </div>
                          {entry.note && <div style={{ fontSize:12, color:"var(--muted)", marginTop:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:open?"pre-wrap":"nowrap", wordBreak:"break-word" }}>{entry.note}</div>}
                        </div>
                        <div style={{ color:"var(--faint)", fontSize:12 }}>{open ? "▲" : "▼"}</div>
                        </div>
                        {open && (
                          <div style={{ display:"flex", gap:8, padding:"0 12px 12px" }}>
                            <button onClick={()=>editEntry(entry.date)} style={{ flex:1, padding:"10px", borderRadius:10, border:"1.5px solid var(--border2)", background:"white", color:"var(--accent)", fontWeight:700, fontSize:13, cursor:"pointer" }}>✏️ 編輯</button>
                            {confirmDel===entry.date ? (
                              <>
                                <button onClick={()=>deleteEntry(entry.date)} style={{ flex:1, padding:"10px", borderRadius:10, border:"none", background:"var(--accent)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer" }}>確定刪除</button>
                                <button onClick={()=>setConfirmDel(null)} style={{ flex:1, padding:"10px", borderRadius:10, border:"1.5px solid var(--border)", background:"white", color:"var(--muted)", fontWeight:700, fontSize:13, cursor:"pointer" }}>取消</button>
                              </>
                            ) : (
                              <button onClick={()=>setConfirmDel(entry.date)} style={{ flex:1, padding:"10px", borderRadius:10, border:"1.5px solid var(--border)", background:"white", color:"var(--muted)", fontWeight:700, fontSize:13, cursor:"pointer" }}>🗑 刪除</button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {view==="history" && (
          <div style={{ background:"white", borderRadius:24, padding:"20px", border:"1px solid var(--border)", boxShadow:"0 4px 16px rgba(var(--rgb),0.05)", marginTop:16 }}>
            <div style={{ fontSize:12, color:"var(--muted)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>資料備份</div>
            <div style={{ fontSize:12, color:"var(--muted)", marginBottom:14, lineHeight:1.6 }}>資料只存在這支手機的瀏覽器裡，建議定期匯出備份。</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {[{l:"匯出 CSV", f:exportCSV},{l:"備份 JSON", f:exportJSON}].map(b => (
                <button key={b.l} onClick={b.f} style={{ flex:1, minWidth:100, padding:"12px", borderRadius:12, border:"1.5px solid var(--border2)", background:"var(--bg)", color:"var(--accent)", fontWeight:700, fontSize:13, cursor:"pointer" }}>{b.l}</button>
              ))}
              <label style={{ flex:1, minWidth:100, padding:"12px", borderRadius:12, border:"1.5px solid var(--border2)", background:"var(--bg)", color:"var(--accent)", fontWeight:700, fontSize:13, cursor:"pointer", textAlign:"center" }}>
                匯入備份
                <input type="file" accept=".json,application/json" onChange={importJSON} style={{ display:"none" }} />
              </label>
            </div>
            {backupMsg && <div style={{ marginTop:12, fontSize:13, color:"var(--accent)", fontWeight:600 }}>{backupMsg}</div>}
          </div>
        )}

        {/* AI */}
        {view==="ai" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ background:"linear-gradient(135deg,var(--soft),#FFF8F0)", borderRadius:24, padding:"24px", border:"1px solid var(--border2)" }}>
              <div style={{ fontSize:28, marginBottom:8 }}>✨</div>
              <div style={{ fontSize:16, fontWeight:800, color:"var(--accent)", marginBottom:6 }}>情緒分析</div>
              <div style={{ fontSize:13, color:"#8A7070", lineHeight:1.7 }}>
                根據你的情緒記錄，找出情緒趨勢和規律，給你一個貼心的小建議。分析在你的手機上完成，資料不會傳出去。
              </div>
              {entries.length<1 && (
                <div style={{ marginTop:12, fontSize:12, color:"var(--accent)", background:"var(--soft)", borderRadius:10, padding:"8px 12px" }}>
                  ⚠️ 請先記錄至少一天的心情
                </div>
              )}
            </div>

            <button onClick={handleAI} disabled={aiLoading||!entries.length} style={{
              width:"100%", padding:"15px", borderRadius:16, border:"none",
              background:!entries.length?"var(--border)":aiLoading?"var(--loading)":"linear-gradient(135deg,var(--accent),var(--accent2))",
              color:!entries.length?"var(--muted)":"white", fontSize:15, fontWeight:800,
              cursor:!entries.length?"not-allowed":"pointer", transition:"all 0.3s",
              boxShadow:entries.length&&!aiLoading?"0 6px 20px rgba(var(--rgb),0.35)":"none",
            }}>
              {aiLoading ? "✨ 分析中..." : "開始分析"}
            </button>

            <div style={{ background:"white", borderRadius:24, padding:"20px", border:"1px solid var(--border)", boxShadow:"0 4px 16px rgba(var(--rgb),0.05)" }}>
              <div style={{ fontSize:14, fontWeight:800, color:"var(--accent)", marginBottom:4 }}>💬 請 Claude 陪你聊聊</div>
              <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.7, marginBottom:14 }}>選一種聊法，會複製成一段提示詞，貼到 Claude 就能開始，之後也可以一直聊下去。每次複製的語氣都會有些不同。</div>
              <textarea value={chatTopic} onChange={e=>setChatTopic(e.target.value)} rows={2}
                placeholder="今天特別想聊什麼？（選填，例如：最近工作壓力很大）"
                style={{ width:"100%", border:"1.5px solid var(--border)", borderRadius:12, padding:"10px 12px", color:"#2D2D2D", fontSize:14, resize:"none", outline:"none", fontFamily:"inherit", lineHeight:1.6, background:"var(--input)", boxSizing:"border-box" }} />
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:12 }}>
                {CHAT_STYLES.map(st => (
                  <button key={st.id} onClick={()=>copyForClaude(st.id)} disabled={!entries.length} style={{
                    display:"flex", alignItems:"center", gap:12, textAlign:"left", padding:"12px 14px", borderRadius:14,
                    border:"1.5px solid var(--border2)", background:"var(--bg)", fontFamily:"inherit",
                    cursor:entries.length?"pointer":"not-allowed", opacity:entries.length?1:0.5,
                  }}>
                    <span style={{ fontSize:24 }}>{st.emoji}</span>
                    <span style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:800, color:"var(--accent)" }}>{st.name}</div>
                      <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>{st.desc}</div>
                    </span>
                    <span style={{ fontSize:12, color:"var(--muted)" }}>📋 複製</span>
                  </button>
                ))}
              </div>
              {copyMsg && <div style={{ fontSize:13, color:"var(--accent)", fontWeight:600, textAlign:"center", marginTop:12 }}>{copyMsg}</div>}
              <a href="https://claude.ai/new" target="_blank" rel="noopener noreferrer" style={{ display:"block", marginTop:12, textAlign:"center", padding:"12px", borderRadius:12, background:"linear-gradient(135deg,var(--accent),var(--accent2))", color:"white", fontWeight:700, fontSize:14, textDecoration:"none" }}>開啟 Claude ↗</a>
              <div style={{ fontSize:11, color:"var(--muted)", marginTop:10, lineHeight:1.6 }}>提醒：貼上後，記錄內容會傳到 Claude。備註裡有想保密的內容，請先刪掉再貼。</div>
            </div>

            {aiLoading && (
              <div style={{ background:"white", borderRadius:24, padding:"32px 20px", border:"1px solid var(--border)", textAlign:"center" }}>
                <div style={{ fontSize:32, marginBottom:12 }}>🤔</div>
                <div style={{ fontSize:14, color:"#8A7070" }}>正在分析你的情緒資料...</div>
                <div style={{ fontSize:12, color:"var(--muted)", marginTop:6 }}>通常只需要幾秒鐘</div>
              </div>
            )}

            {aiErr && (
              <div style={{ background:"var(--soft)", borderRadius:16, padding:"16px 20px", border:"1px solid var(--errb)", color:"var(--accent)", fontSize:14 }}>{aiErr}</div>
            )}

            {aiText && !aiLoading && (
              <div style={{ background:"white", borderRadius:24, padding:"24px", border:"1px solid var(--border)", boxShadow:"0 4px 16px rgba(var(--rgb),0.05)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:18 }}>
                  <span style={{ fontSize:20 }}>🧠</span>
                  <span style={{ fontSize:14, fontWeight:800, color:"var(--accent)" }}>分析結果</span>
                  <span style={{ marginLeft:"auto", fontSize:11, color:"var(--muted)" }}>基於最近 {Math.min(entries.length,14)} 天記錄</span>
                </div>
                <div style={{ fontSize:14, color:"#4A3A3A", lineHeight:1.8 }}>{renderAI(aiText)}</div>
              </div>
            )}

            {!aiText && !aiLoading && entries.length>0 && (
              <div style={{ background:"white", borderRadius:24, padding:"40px 20px", border:"1px solid var(--border)", textAlign:"center" }}>
                <div style={{ fontSize:36, marginBottom:12 }}>💭</div>
                <div style={{ fontSize:14, color:"var(--muted)" }}>點擊上方按鈕，幫你解讀情緒模式</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Onboarding */}
      {onboardStep >= 0 && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:"white", borderRadius:28, padding:"28px 24px 22px", width:"100%", maxWidth:380, boxShadow:"0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize:48, textAlign:"center", marginBottom:10 }}>{ONBOARD[onboardStep].emoji}</div>
            <div style={{ fontSize:19, fontWeight:800, textAlign:"center", color:"var(--accent)", marginBottom:12 }}>{ONBOARD[onboardStep].title}</div>
            <div style={{ fontSize:14, color:"#4A3A3A", lineHeight:1.8, whiteSpace:"pre-line", minHeight:110 }}>{ONBOARD[onboardStep].body}</div>
            <div style={{ display:"flex", justifyContent:"center", gap:6, margin:"16px 0" }}>
              {ONBOARD.map((_, i) => <span key={i} style={{ width:i===onboardStep?18:6, height:6, borderRadius:99, background:i===onboardStep?"var(--accent)":"var(--border2)", transition:"all 0.2s" }} />)}
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={finishOnboard} style={{ flex:1, padding:"13px", borderRadius:14, border:"1.5px solid var(--border)", background:"white", color:"var(--muted)", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>略過</button>
              <button onClick={()=> onboardStep < ONBOARD.length-1 ? setOnboardStep(onboardStep+1) : finishOnboard()} style={{ flex:2, padding:"13px", borderRadius:14, border:"none", background:"linear-gradient(135deg,var(--accent),var(--accent2))", color:"white", fontWeight:800, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>
                {onboardStep < ONBOARD.length-1 ? "下一步" : "開始使用"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* About / Privacy */}
      {showAbout && (
        <div onClick={()=>setShowAbout(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:40, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"white", borderRadius:"28px 28px 0 0", width:"100%", maxWidth:540, maxHeight:"88vh", overflowY:"auto", padding:"22px 22px 36px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontSize:18, fontWeight:800, color:"var(--accent)" }}>關於心情日記 {T.emoji}</div>
              <button onClick={()=>setShowAbout(false)} aria-label="關閉" style={{ width:34, height:34, borderRadius:10, border:"none", background:"var(--soft)", color:"var(--accent)", fontSize:16, fontWeight:800, cursor:"pointer" }}>✕</button>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:6 }}>
              <button onClick={shareApp} style={{ padding:"13px", borderRadius:14, border:"none", background:"linear-gradient(135deg,var(--accent),var(--accent2))", color:"white", fontWeight:800, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>📤 分享給朋友</button>
              {FEEDBACK_URL && <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer" style={{ display:"block", textAlign:"center", padding:"13px", borderRadius:14, border:"1.5px solid var(--border2)", background:"var(--bg)", color:"var(--accent)", fontWeight:800, fontSize:14, textDecoration:"none" }}>💬 意見回饋</a>}
              <button onClick={()=>{ setShowAbout(false); setOnboardStep(0); }} style={{ padding:"13px", borderRadius:14, border:"1.5px solid var(--border)", background:"white", color:"var(--muted)", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>📖 重看使用導覽</button>
            </div>
            {aboutMsg && <div style={{ textAlign:"center", fontSize:13, color:"var(--accent)", fontWeight:600, marginTop:8 }}>{aboutMsg}</div>}

            <div style={{ fontSize:15, fontWeight:800, color:"#2D2D2D", margin:"22px 0 10px" }}>🔒 隱私說明</div>
            <div style={{ fontSize:13, color:"#4A3A3A", lineHeight:1.85 }}>
              <p style={{ margin:"0 0 8px" }}>• 不需要註冊或登入，沒有帳號。</p>
              <p style={{ margin:"0 0 8px" }}>• 你的心情記錄只存在這支手機的瀏覽器裡，沒有上傳到任何伺服器，開發者也看不到。</p>
              <p style={{ margin:"0 0 8px" }}>• 清除瀏覽器資料、換手機，或刪除主畫面圖示後重新加入，記錄可能會消失。請定期到「趨勢」頁最下方備份。</p>
              <p style={{ margin:"0 0 8px" }}>• 匯出的備份檔是明文，請存放在你信任的地方。</p>
              <p style={{ margin:"0 0 8px" }}>• 「分析」頁的趨勢與模式分析，都是在你的手機上計算的。</p>
              <p style={{ margin:"0 0 8px" }}>• 如果你使用「請 Claude 陪你聊聊」，按下複製後，由你自己貼到 Claude 的內容（含記錄與備註）會傳送給 Anthropic，並適用其隱私政策。貼上之前，可以先刪掉不想分享的內容。</p>
              <p style={{ margin:"0 0 8px" }}>• 這個網站由 Vercel 代管，一般網站伺服器可能記錄基本連線資訊，但不包含你的心情記錄。</p>
            </div>

            <div style={{ fontSize:15, fontWeight:800, color:"#2D2D2D", margin:"22px 0 10px" }}>💛 使用須知</div>
            <div style={{ fontSize:13, color:"#4A3A3A", lineHeight:1.85 }}>
              <p style={{ margin:"0 0 8px" }}>這是記錄與整理心情的小工具，不是醫療、診斷或治療工具，分析結果也不能取代專業意見。</p>
              <p style={{ margin:"0 0 8px" }}>如果你覺得難以負荷，請找信任的人聊聊，或聯絡專業協助（台灣）：</p>
              <p style={{ margin:"0 0 4px" }}>・安心專線 1925（24 小時）</p>
              <p style={{ margin:"0 0 4px" }}>・生命線 1995</p>
              <p style={{ margin:"0 0 8px" }}>・張老師 1980</p>
              <p style={{ margin:0 }}>若有立即的危險，請撥 119 或 110。</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"white", borderTop:"1px solid var(--border)",
        padding:"10px 20px 20px", boxShadow:"0 -4px 20px rgba(var(--rgb),0.08)", zIndex:10 }}>
        <div style={{ maxWidth:540, margin:"0 auto", display:"flex", gap:8 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={()=>setView(tab.id)} style={{
              flex:1, padding:"10px 8px", borderRadius:14, border:"none", cursor:"pointer", transition:"all 0.2s",
              background:view===tab.id?"linear-gradient(135deg,var(--accent),var(--accent2))":"transparent",
              color:view===tab.id?"white":"var(--muted)", fontWeight:view===tab.id?800:500, fontSize:13,
              boxShadow:view===tab.id?"0 4px 12px rgba(var(--rgb),0.3)":"none",
            }}>
              <div style={{ fontSize:18, marginBottom:2 }}>{tab.icon}</div>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        input[type=range]::-webkit-slider-thumb {
          appearance:none; width:24px; height:24px; border-radius:50%;
          background:white; box-shadow:0 2px 8px rgba(var(--rgb),0.3); cursor:pointer;
          border:2px solid var(--accent);
        }
        textarea::placeholder { color:var(--faint); }
        * { box-sizing:border-box; }
        button { font-family:inherit; }
      `}</style>
    </div>
  );
}
