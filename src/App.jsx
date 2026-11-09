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

const today = () => new Date().toISOString().split("T")[0];
const fmt = (d) => { const x = new Date(d + "T00:00:00"); return `${x.getMonth()+1}/${x.getDate()}`; };

const TABS = [
  { id: "log",     label: "記錄",  icon: "✏️" },
  { id: "history", label: "趨勢",  icon: "📈" },
  { id: "ai",      label: "AI分析", icon: "✨" },
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

  useEffect(() => {
    if (todayEntry) { setScore(todayEntry.score); setTags(todayEntry.tags); setNote(todayEntry.note||""); }
  }, []);

  useEffect(() => { localStorage.setItem("mood_v3", JSON.stringify(entries)); }, [entries]);

  const toggleTag = (id) => setTags(p => p.includes(id) ? p.filter(t=>t!==id) : [...p,id]);

  const handleSave = () => {
    const entry = { date: today(), score, tags, note };
    setEntries(p => [...p.filter(e=>e.date!==today()), entry].sort((a,b)=>a.date.localeCompare(b.date)));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAI = async () => {
    if (!entries.length) return;
    setAiLoading(true); setAiText(""); setAiErr("");
    const tagMap = Object.fromEntries(EMOTION_TAGS.map(t=>[t.id, t.label.split(" ")[0]]));
    const data = entries.slice(-14).map(e =>
      `【${fmt(e.date)}】${e.score}/10　${e.tags.map(t=>tagMap[t]||t).join("、")||"未標記"}　${e.note||""}`
    ).join("\n");
    const prompt = `你是一位溫暖的情緒健康顧問。以下是使用者近期情緒記錄：\n\n${data}\n\n請用繁體中文，語氣像朋友一樣親切，分析：\n1. **整體情緒趨勢**（2句）\n2. **情緒模式觀察**（2句）\n3. **一個具體小建議**（2句）\n總字數控制在200字內，不要使用專業術語。`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
      });
      const d = await res.json();
      setAiText(d.content?.map(c=>c.text||"").join("")||"");
    } catch { setAiErr("連線出問題，請稍後再試。"); }
    finally { setAiLoading(false); }
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
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                <div>
                  <div style={{ fontSize:12, color:"#C4A99A", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px" }}>今日心情分數</div>
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
              {saved ? "✓ 已儲存！" : todayEntry ? "更新今日記錄" : "儲存今日心情"}
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
                    return (
                      <div key={entry.date} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px", borderRadius:14, background:"#FFF8F4" }}>
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
                          {entry.note && <div style={{ fontSize:12, color:"#C4A99A", marginTop:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{entry.note}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI */}
        {view==="ai" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ background:"linear-gradient(135deg,#FFF0F0,#FFF8F0)", borderRadius:24, padding:"24px", border:"1px solid #FFD4C8" }}>
              <div style={{ fontSize:28, marginBottom:8 }}>✨</div>
              <div style={{ fontSize:16, fontWeight:800, color:"#FF6B6B", marginBottom:6 }}>AI 情緒分析</div>
              <div style={{ fontSize:13, color:"#8A7070", lineHeight:1.7 }}>
                根據你的情緒記錄，AI 會幫你找出情緒趨勢和規律，給你一個貼心的個人化建議。
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
              {aiLoading ? "✨ AI 分析中..." : "開始 AI 分析"}
            </button>

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
                <div style={{ fontSize:14, color:"#C4A99A" }}>點擊上方按鈕，讓 AI 幫你解讀情緒模式</div>
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
