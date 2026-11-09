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

const TABS = [
  { id: "log",     label: "記錄",  icon: "✏️" },
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
  const copyForClaude = async () => {
    if (!entries.length) return;
    const lines = entries.slice(-14).map(e =>
      `${fmt(e.date)}｜${e.score}/10｜${e.tags.map(t=>(EMOTION_TAGS.find(x=>x.id===t)?.label.split(" ")[0])||t).join("、")||"未標記"}｜${e.note||""}`
    ).join("\n");
    const prompt = `你是一位溫暖的情緒健康顧問。以下是我最近的情緒記錄（日期｜分數｜情緒標籤｜備註）：\n\n${lines}\n\n請用繁體中文、像朋友一樣的語氣，幫我分析整體趨勢、情緒模式，並給我一個具體可行的小建議，200字內。`;
    try { await navigator.clipboard.writeText(prompt); setCopyMsg("✓ 已複製！貼到 Claude 就能深入分析"); }
    catch { setCopyMsg("複製失敗，請改用長按選取"); }
    setTimeout(()=>setCopyMsg(""), 4000);
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

  const chartData = entries.slice(-14).map(e => ({ date: fmt(e.date), 分數: e.score }));
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
            ? <strong key={j} style={{ color: "#FF6B6B", fontWeight: 700 }}>{p.slice(2,-2)}</strong>
            : p
        )}
      </p>
    );
  });

  return (
    <div style={{ minHeight:"100vh", background:"#FFF8F4", fontFamily:"'Inter',-apple-system,sans-serif", color:"#2D2D2D", paddingBottom:100 }}>

      {/* Header */}
      <div style={{ background:"white", borderBottom:"1px solid #FFE8DC", padding:"22px 24px 14px", position:"sticky", top:0, zIndex:10, boxShadow:"0 2px 12px rgba(255,107,107,0.06)" }}>
        <div style={{ maxWidth:540, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <h1 style={{ fontSize:20, fontWeight:800, margin:0, color:"#FF6B6B", letterSpacing:"-0.3px" }}>心情日記 🌸</h1>
            <p style={{ margin:"2px 0 0", color:"#C4A99A", fontSize:12 }}>
              {new Date().toLocaleDateString("zh-TW",{year:"numeric",month:"long",day:"numeric",weekday:"long"})}
            </p>
          </div>
          {todayEntry && (
            <div style={{ background:`${SCORE_COLOR(todayEntry.score)}15`, border:`1.5px solid ${SCORE_COLOR(todayEntry.score)}40`, borderRadius:12, padding:"6px 14px", fontSize:13, fontWeight:700, color:SCORE_COLOR(todayEntry.score) }}>
              今日 {todayEntry.score}/10
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:540, margin:"0 auto", padding:"20px 20px 0" }}>

        {/* LOG */}
        {view==="log" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Score card */}
            <div style={{ background:"white", borderRadius:24, padding:"24px", border:"1px solid #FFE8DC", boxShadow:"0 4px 20px rgba(255,107,107,0.06)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:18, flexWrap:"wrap" }}>
                <input type="date" value={selDate} max={today()} min="2020-01-01"
                  onChange={e => { if (e.target.value) setSelDate(e.target.value); }}
                  style={{ border:"1.5px solid #FFD4C8", borderRadius:10, padding:"8px 10px", fontSize:14, color:"#2D2D2D", background:"#FFFCFB", fontFamily:"inherit", outline:"none" }} />
                {selDate !== today() && (
                  <button onClick={()=>setSelDate(today())} style={{ padding:"8px 12px", borderRadius:10, border:"none", background:"#FFF0F0", color:"#FF6B6B", fontWeight:700, fontSize:13, cursor:"pointer" }}>回到今天</button>
                )}
                {selEntry && <span style={{ fontSize:12, color:"#C4A99A" }}>這天已有記錄，儲存會更新</span>}
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                <div>
                  <div style={{ fontSize:12, color:"#C4A99A", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px" }}>{selDate===today() ? "今日" : fmt(selDate)} 心情分數</div>
                  <div style={{ fontSize:13, color:col, fontWeight:600, marginTop:4 }}>{getMoodLabel(score)}</div>
                </div>
                <div style={{ fontSize:56, fontWeight:900, lineHeight:1, color:col, textShadow:`0 4px 20px ${col}40` }}>{score}</div>
              </div>

              <input type="range" min={1} max={10} value={score}
                onChange={e=>setScore(Number(e.target.value))}
                style={{ width:"100%", appearance:"none", height:8, borderRadius:99, outline:"none", cursor:"pointer",
                  background:`linear-gradient(90deg, ${col} ${(score-1)/9*100}%, #FFE8DC ${(score-1)/9*100}%)` }}
              />
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <div key={n} onClick={()=>setScore(n)} style={{ width:28, height:28, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:12, fontWeight:score===n?800:400, cursor:"pointer",
                    background:score===n?col+"20":"transparent", color:score===n?col:"#C4A99A",
                    transition:"all 0.15s" }}>
                    {n}
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div style={{ background:"white", borderRadius:24, padding:"20px", border:"1px solid #FFE8DC", boxShadow:"0 4px 20px rgba(255,107,107,0.06)" }}>
              <div style={{ fontSize:12, color:"#C4A99A", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:14 }}>情緒標籤</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {EMOTION_TAGS.map(tag => {
                  const on = tags.includes(tag.id);
                  return (
                    <button key={tag.id} onClick={()=>toggleTag(tag.id)} style={{
                      padding:"8px 14px", borderRadius:99, border:`1.5px solid ${on?tag.color:"#FFE8DC"}`,
                      background:on?tag.bg:"white", color:on?tag.color:"#C4A99A",
                      fontSize:13, fontWeight:on?700:400, cursor:"pointer", transition:"all 0.15s",
                    }}>{tag.label}</button>
                  );
                })}
              </div>
            </div>

            {/* Note */}
            <div style={{ background:"white", borderRadius:24, padding:"20px", border:"1px solid #FFE8DC", boxShadow:"0 4px 20px rgba(255,107,107,0.06)" }}>
              <div style={{ fontSize:12, color:"#C4A99A", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:12 }}>今日備注（選填）</div>
              <textarea value={note} onChange={e=>setNote(e.target.value)}
                placeholder="今天有什麼想記下來的嗎..." rows={3}
                style={{ width:"100%", border:"1.5px solid #FFE8DC", borderRadius:12, padding:"12px 14px", color:"#2D2D2D",
                  fontSize:14, resize:"none", outline:"none", fontFamily:"inherit", lineHeight:1.7,
                  background:"#FFFCFB", boxSizing:"border-box" }}
              />
            </div>

            {/* Save */}
            <button onClick={handleSave} style={{
              width:"100%", padding:"16px", borderRadius:16, border:"none",
              background:saved?"linear-gradient(135deg,#6BCB77,#4ECDC4)":"linear-gradient(135deg,#FF6B6B,#FF8E72)",
              color:"white", fontSize:16, fontWeight:800, cursor:"pointer", transition:"all 0.3s",
              boxShadow:saved?"0 6px 20px rgba(107,203,119,0.35)":"0 6px 20px rgba(255,107,107,0.35)",
            }}>
              {saved ? "✓ 已儲存！" : selEntry ? (selDate===today() ? "更新今日記錄" : `更新 ${fmt(selDate)} 的記錄`) : (selDate===today() ? "儲存今日心情" : `儲存 ${fmt(selDate)} 的心情`)}
            </button>
          </div>
        )}

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
                    textAlign:"center", border:"1px solid #FFE8DC", boxShadow:"0 4px 16px rgba(255,107,107,0.05)" }}>
                    <div style={{ fontSize:20, marginBottom:4 }}>{s.icon}</div>
                    <div style={{ fontSize:18, fontWeight:800, color:"#FF6B6B" }}>{s.val}</div>
                    <div style={{ fontSize:11, color:"#C4A99A", marginTop:2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {chartData.length>1 ? (
              <div style={{ background:"white", borderRadius:24, padding:"20px 12px 16px", border:"1px solid #FFE8DC", boxShadow:"0 4px 16px rgba(255,107,107,0.05)" }}>
                <div style={{ fontSize:12, color:"#C4A99A", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:16, paddingLeft:8 }}>近14天趨勢</div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#FFF0EB" />
                    <XAxis dataKey="date" tick={{ fill:"#C4A99A", fontSize:11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[1,10]} tick={{ fill:"#C4A99A", fontSize:11 }} axisLine={false} tickLine={false} width={22} />
                    <Tooltip contentStyle={{ background:"white", border:"1px solid #FFE8DC", borderRadius:12, color:"#2D2D2D", fontSize:13 }} />
                    <Area type="monotone" dataKey="分數" stroke="#FF6B6B" strokeWidth={2.5} fill="url(#g)" dot={{ fill:"#FF6B6B", r:4, strokeWidth:0 }} activeDot={{ r:6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ background:"white", borderRadius:24, padding:"40px 20px", border:"1px solid #FFE8DC", textAlign:"center", color:"#DDD0CC" }}>
                記錄至少 2 天後趨勢圖會出現 📈
              </div>
            )}

            <div style={{ background:"white", borderRadius:24, padding:"20px", border:"1px solid #FFE8DC", boxShadow:"0 4px 16px rgba(255,107,107,0.05)" }}>
              <div style={{ fontSize:12, color:"#C4A99A", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:14 }}>所有記錄</div>
              {entries.length===0 ? (
                <div style={{ color:"#DDD0CC", fontSize:14, textAlign:"center", padding:"20px 0" }}>還沒有記錄，先去記錄今天的心情吧！</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {[...entries].reverse().map(entry => {
                    const ec = SCORE_COLOR(entry.score);
                    const open = openDate === entry.date;
                    return (
                      <div key={entry.date} style={{ borderRadius:14, background:"#FFF8F4", overflow:"hidden" }}>
                        <div onClick={()=>{ setOpenDate(open?null:entry.date); setConfirmDel(null); }} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px", cursor:"pointer" }}>
                        <div style={{ width:42, height:42, borderRadius:12, background:ec+"15", border:`1.5px solid ${ec}40`,
                          display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, fontWeight:900, color:ec, flexShrink:0 }}>
                          {entry.score}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12, color:"#C4A99A", marginBottom:4 }}>{fmt(entry.date)}</div>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                            {entry.tags.map(tid => {
                              const tag = EMOTION_TAGS.find(t=>t.id===tid);
                              return tag ? <span key={tid} style={{ fontSize:11, padding:"2px 8px", borderRadius:99, background:tag.bg, color:tag.color, fontWeight:600 }}>{tag.label}</span> : null;
                            })}
                          </div>
                          {entry.note && <div style={{ fontSize:12, color:"#C4A99A", marginTop:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:open?"pre-wrap":"nowrap", wordBreak:"break-word" }}>{entry.note}</div>}
                        </div>
                        <div style={{ color:"#DDD0CC", fontSize:12 }}>{open ? "▲" : "▼"}</div>
                        </div>
                        {open && (
                          <div style={{ display:"flex", gap:8, padding:"0 12px 12px" }}>
                            <button onClick={()=>editEntry(entry.date)} style={{ flex:1, padding:"10px", borderRadius:10, border:"1.5px solid #FFD4C8", background:"white", color:"#FF6B6B", fontWeight:700, fontSize:13, cursor:"pointer" }}>✏️ 編輯</button>
                            {confirmDel===entry.date ? (
                              <>
                                <button onClick={()=>deleteEntry(entry.date)} style={{ flex:1, padding:"10px", borderRadius:10, border:"none", background:"#FF6B6B", color:"white", fontWeight:700, fontSize:13, cursor:"pointer" }}>確定刪除</button>
                                <button onClick={()=>setConfirmDel(null)} style={{ flex:1, padding:"10px", borderRadius:10, border:"1.5px solid #FFE8DC", background:"white", color:"#C4A99A", fontWeight:700, fontSize:13, cursor:"pointer" }}>取消</button>
                              </>
                            ) : (
                              <button onClick={()=>setConfirmDel(entry.date)} style={{ flex:1, padding:"10px", borderRadius:10, border:"1.5px solid #FFE8DC", background:"white", color:"#C4A99A", fontWeight:700, fontSize:13, cursor:"pointer" }}>🗑 刪除</button>
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
          <div style={{ background:"white", borderRadius:24, padding:"20px", border:"1px solid #FFE8DC", boxShadow:"0 4px 16px rgba(255,107,107,0.05)", marginTop:16 }}>
            <div style={{ fontSize:12, color:"#C4A99A", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>資料備份</div>
            <div style={{ fontSize:12, color:"#C4A99A", marginBottom:14, lineHeight:1.6 }}>資料只存在這支手機的瀏覽器裡，建議定期匯出備份。</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {[{l:"匯出 CSV", f:exportCSV},{l:"備份 JSON", f:exportJSON}].map(b => (
                <button key={b.l} onClick={b.f} style={{ flex:1, minWidth:100, padding:"12px", borderRadius:12, border:"1.5px solid #FFD4C8", background:"#FFF8F4", color:"#FF6B6B", fontWeight:700, fontSize:13, cursor:"pointer" }}>{b.l}</button>
              ))}
              <label style={{ flex:1, minWidth:100, padding:"12px", borderRadius:12, border:"1.5px solid #FFD4C8", background:"#FFF8F4", color:"#FF6B6B", fontWeight:700, fontSize:13, cursor:"pointer", textAlign:"center" }}>
                匯入備份
                <input type="file" accept=".json,application/json" onChange={importJSON} style={{ display:"none" }} />
              </label>
            </div>
            {backupMsg && <div style={{ marginTop:12, fontSize:13, color:"#FF6B6B", fontWeight:600 }}>{backupMsg}</div>}
          </div>
        )}

        {/* AI */}
        {view==="ai" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ background:"linear-gradient(135deg,#FFF0F0,#FFF8F0)", borderRadius:24, padding:"24px", border:"1px solid #FFD4C8" }}>
              <div style={{ fontSize:28, marginBottom:8 }}>✨</div>
              <div style={{ fontSize:16, fontWeight:800, color:"#FF6B6B", marginBottom:6 }}>情緒分析</div>
              <div style={{ fontSize:13, color:"#8A7070", lineHeight:1.7 }}>
                根據你的情緒記錄，找出情緒趨勢和規律，給你一個貼心的小建議。分析在你的手機上完成，資料不會傳出去。
              </div>
              {entries.length<1 && (
                <div style={{ marginTop:12, fontSize:12, color:"#FF6B6B", background:"#FFF0F0", borderRadius:10, padding:"8px 12px" }}>
                  ⚠️ 請先記錄至少一天的心情
                </div>
              )}
            </div>

            <button onClick={handleAI} disabled={aiLoading||!entries.length} style={{
              width:"100%", padding:"15px", borderRadius:16, border:"none",
              background:!entries.length?"#FFE8DC":aiLoading?"#FFB3A7":"linear-gradient(135deg,#FF6B6B,#FF8E72)",
              color:!entries.length?"#C4A99A":"white", fontSize:15, fontWeight:800,
              cursor:!entries.length?"not-allowed":"pointer", transition:"all 0.3s",
              boxShadow:entries.length&&!aiLoading?"0 6px 20px rgba(255,107,107,0.35)":"none",
            }}>
              {aiLoading ? "✨ 分析中..." : "開始分析"}
            </button>

            <button onClick={copyForClaude} disabled={!entries.length} style={{
              width:"100%", padding:"13px", borderRadius:16, border:"1.5px solid #FFD4C8", background:"white",
              color:entries.length?"#FF6B6B":"#C4A99A", fontSize:14, fontWeight:700, cursor:entries.length?"pointer":"not-allowed",
            }}>
              📋 複製記錄，貼到 Claude 深入分析
            </button>
            {copyMsg && <div style={{ fontSize:13, color:"#FF6B6B", fontWeight:600, textAlign:"center" }}>{copyMsg}</div>}

            {aiLoading && (
              <div style={{ background:"white", borderRadius:24, padding:"32px 20px", border:"1px solid #FFE8DC", textAlign:"center" }}>
                <div style={{ fontSize:32, marginBottom:12 }}>🤔</div>
                <div style={{ fontSize:14, color:"#8A7070" }}>正在分析你的情緒資料...</div>
                <div style={{ fontSize:12, color:"#C4A99A", marginTop:6 }}>通常只需要幾秒鐘</div>
              </div>
            )}

            {aiErr && (
              <div style={{ background:"#FFF0F0", borderRadius:16, padding:"16px 20px", border:"1px solid #FFCCC4", color:"#FF6B6B", fontSize:14 }}>{aiErr}</div>
            )}

            {aiText && !aiLoading && (
              <div style={{ background:"white", borderRadius:24, padding:"24px", border:"1px solid #FFE8DC", boxShadow:"0 4px 16px rgba(255,107,107,0.05)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:18 }}>
                  <span style={{ fontSize:20 }}>🧠</span>
                  <span style={{ fontSize:14, fontWeight:800, color:"#FF6B6B" }}>分析結果</span>
                  <span style={{ marginLeft:"auto", fontSize:11, color:"#C4A99A" }}>基於最近 {Math.min(entries.length,14)} 天記錄</span>
                </div>
                <div style={{ fontSize:14, color:"#4A3A3A", lineHeight:1.8 }}>{renderAI(aiText)}</div>
              </div>
            )}

            {!aiText && !aiLoading && entries.length>0 && (
              <div style={{ background:"white", borderRadius:24, padding:"40px 20px", border:"1px solid #FFE8DC", textAlign:"center" }}>
                <div style={{ fontSize:36, marginBottom:12 }}>💭</div>
                <div style={{ fontSize:14, color:"#C4A99A" }}>點擊上方按鈕，幫你解讀情緒模式</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"white", borderTop:"1px solid #FFE8DC",
        padding:"10px 20px 20px", boxShadow:"0 -4px 20px rgba(255,107,107,0.08)", zIndex:10 }}>
        <div style={{ maxWidth:540, margin:"0 auto", display:"flex", gap:8 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={()=>setView(tab.id)} style={{
              flex:1, padding:"10px 8px", borderRadius:14, border:"none", cursor:"pointer", transition:"all 0.2s",
              background:view===tab.id?"linear-gradient(135deg,#FF6B6B,#FF8E72)":"transparent",
              color:view===tab.id?"white":"#C4A99A", fontWeight:view===tab.id?800:500, fontSize:13,
              boxShadow:view===tab.id?"0 4px 12px rgba(255,107,107,0.3)":"none",
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
          background:white; box-shadow:0 2px 8px rgba(255,107,107,0.3); cursor:pointer;
          border:2px solid #FF6B6B;
        }
        textarea::placeholder { color:#DDD0CC; }
        * { box-sizing:border-box; }
        button { font-family:inherit; }
      `}</style>
    </div>
  );
}
