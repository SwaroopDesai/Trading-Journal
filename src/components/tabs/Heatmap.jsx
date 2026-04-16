"use client"
import { useState, useMemo } from "react";
import { PAIRS, SESSIONS, SETUPS } from "@/lib/constants";
import { fmtDate, fmtRR, normalizeImageList } from "@/lib/utils";
import { Card, CardTitle, SectionLead, Btn, Chip, EmptyState, Badge, Overlay } from "@/components/ui";

function Heatmap({T, trades, viewportWidth, onViewImg}) {
  const now = new Date()
  const isMobile = viewportWidth ? viewportWidth < 760 : false
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [activeView, setActiveView] = useState("calendar") // calendar | weekday | session | streak | drawdown
  const [selectedDay, setSelectedDay] = useState(null)
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  const DAYS_FULL = ["Monday","Tuesday","Wednesday","Thursday","Friday"]
  const DAYS_SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]

  // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ Calendar data ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬
  const dailyMap = useMemo(() => {
    const map = {}
    trades.forEach(t => {
      if(!t.date) return
      const d = new Date(t.date)
      if(d.getFullYear()!==year || d.getMonth()!==month) return
      if(!map[t.date]) map[t.date]={r:0,count:0,wins:0,pairs:[]}
      map[t.date].r += (t.rr||0)
      map[t.date].count++
      if(t.result==="WIN") map[t.date].wins++
      if(!map[t.date].pairs.includes(t.pair)) map[t.date].pairs.push(t.pair)
    })
    return map
  },[trades,year,month])

  // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ Month stats ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬
  const monthTrades = trades.filter(t=>{ if(!t.date) return false; const d=new Date(t.date); return d.getFullYear()===year&&d.getMonth()===month })
  const monthR = monthTrades.reduce((s,t)=>s+(t.rr||0),0)
  const monthWins = monthTrades.filter(t=>t.result==="WIN").length
  const monthWR = monthTrades.length?(monthWins/monthTrades.length*100).toFixed(0):0
  const activeDays = Object.keys(dailyMap).length
  const bestDay = Object.entries(dailyMap).sort((a,b)=>(b[1]?.r||0)-(a[1]?.r||0))[0]

  // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ Day of week performance ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬
  const dowData = useMemo(()=>{
    return [1,2,3,4,5].map(dow=>{
      const t = trades.filter(x=>{ if(!x.date)return false; return new Date(x.date).getDay()===dow })
      const wins=t.filter(x=>x.result==="WIN").length
      const totalR=t.reduce((s,x)=>s+(x.rr||0),0)
      return {dow:DAYS_FULL[dow-1], short:["Mon","Tue","Wed","Thu","Fri"][dow-1], count:t.length,wins,totalR,wr:t.length?(wins/t.length*100).toFixed(0):0}
    })
  },[trades])

  // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ Session/time heatmap (day x session grid) ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬
  const sessionDowGrid = useMemo(()=>{
    const sessions=["London","New York","Asian","London/NY Overlap"]
    const grid={}
    sessions.forEach(s=>{ grid[s]={}; [1,2,3,4,5].forEach(d=>{ grid[s][d]={r:0,count:0,wins:0} }) })
    trades.forEach(t=>{
      if(!t.date||!t.session) return
      const dow=new Date(t.date).getDay()
      if(dow<1||dow>5) return
      if(!grid[t.session]) return
      grid[t.session][dow].r+=(t.rr||0)
      grid[t.session][dow].count++
      if(t.result==="WIN") grid[t.session][dow].wins++
    })
    return {sessions,grid}
  },[trades])

  // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ Streak data ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬
  const streakData = useMemo(()=>{
    const sorted=[...trades].sort((a,b)=>new Date(a.date)-new Date(b.date))
    let curStreak=0,curType=null,maxWin=0,maxLoss=0,curWin=0,curLoss=0
    const streaks=[]
    sorted.forEach(t=>{
      if(t.result==="WIN"){
        if(curType==="WIN") curStreak++; else { curStreak=1; curType="WIN" }
        curWin=curStreak; curLoss=0
      } else if(t.result==="LOSS"){
        if(curType==="LOSS") curStreak++; else { curStreak=1; curType="LOSS" }
        curLoss=curStreak; curWin=0
      }
      maxWin=Math.max(maxWin,curWin)
      maxLoss=Math.max(maxLoss,curLoss)
      streaks.push({result:t.result,r:t.rr||0,date:t.date,pair:t.pair})
    })
    return {curStreak,curType,maxWin,maxLoss,streaks:streaks.slice(-30)}
  },[trades])

  // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ Drawdown data ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬
  const drawdownData = useMemo(()=>{
    const sorted=[...trades].sort((a,b)=>new Date(a.date)-new Date(b.date))
    let peak=0,cum=0,maxDD=0,curDD=0
    const points=[]
    sorted.forEach(t=>{
      cum+=(t.rr||0)
      if(cum>peak) peak=cum
      curDD=peak-cum
      if(curDD>maxDD) maxDD=curDD
      points.push({cum,dd:curDD,date:t.date,pair:t.pair})
    })
    return {points,maxDD,currentDD:curDD,peak}
  },[trades])

  // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ Year bar chart ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬
  const yearlyData = useMemo(()=>{
    return MONTHS.map((m,mi)=>{
      const mt=trades.filter(t=>{ if(!t.date)return false; const d=new Date(t.date); return d.getFullYear()===year&&d.getMonth()===mi })
      return {month:m,r:mt.reduce((s,t)=>s+(t.rr||0),0),count:mt.length,wins:mt.filter(t=>t.result==="WIN").length}
    })
  },[trades,year])
  const maxAbsR=Math.max(1,...yearlyData.map(d=>Math.abs(d.r)))
  const selectedDayTrades = useMemo(()=>{
    if(!selectedDay) return []
    return trades
      .filter(t=>t.date===selectedDay)
      .sort((a,b)=>new Date(b.created_at||b.date)-new Date(a.created_at||a.date))
  },[selectedDay,trades])

  // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ Calendar cell logic ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬
  const firstDay=new Date(year,month,1)
  let startDow=firstDay.getDay(); startDow=startDow===0?6:startDow-1
  const daysInMonth=new Date(year,month+1,0).getDate()
  const totalCells=Math.ceil((startDow+daysInMonth)/7)*7
  const cells=[]
  for(let i=0;i<totalCells;i++){
    const dayNum=i-startDow+1
    if(dayNum<1||dayNum>daysInMonth){cells.push(null);continue}
    const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(dayNum).padStart(2,"0")}`
    const data=dailyMap[dateStr]||null
    const dow=new Date(year,month,dayNum).getDay()
    cells.push({dayNum,dateStr,data,isWeekend:dow===0||dow===6})
  }

  const getCalColor=(data,isWeekend)=>{
    if(isWeekend) return T.isDark?"#1a1a24":"#f0f0f5"
    if(!data) return T.surface2
    if(data.r>=4) return T.isDark?"#14532d":"#bbf7d0"
    if(data.r>=2) return T.isDark?"#166534":"#86efac"
    if(data.r>0)  return T.isDark?"#15803d":"#4ade80"
    if(data.r>-1) return T.isDark?"#7f1d1d":"#fecaca"
    if(data.r>-3) return T.isDark?"#991b1b":"#f87171"
    return T.isDark?"#450a0a":"#ef4444"
  }
  const getCellBorder=(data,isToday)=>{
    if(isToday) return `2px solid ${T.accentBright}`
    if(!data) return `1px solid ${T.border}`
    return data.r>0?`1px solid ${T.green}60`:`1px solid ${T.red}60`
  }

  const VIEWS=[
    {id:"calendar",label:"Calendar"},
    {id:"weekday",label:"Day of Week"},
    {id:"session",label:"Session Grid"},
    {id:"streak",label:"Streaks"},
    {id:"drawdown",label:"Drawdown"},
  ]

  return (
    <div>
      <div style={{marginBottom:18}}>
        <SectionLead
          T={T}
          eyebrow="Pattern Analysis"
          title="Heatmap"
          copy="Read your calendar, sessions, streaks, and drawdown in one tighter performance surface."
        />
      </div>

      {/* Top stats row */}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,minmax(0,1fr))":"repeat(4,minmax(0,1fr))",gap:12,marginBottom:18}}>
        {[
          {l:"Total R",v:`${trades.reduce((s,t)=>s+(t.rr||0),0)>=0?"+":""}${trades.reduce((s,t)=>s+(t.rr||0),0).toFixed(2)}R`,c:trades.reduce((s,t)=>s+(t.rr||0),0)>=0?T.green:T.red,meta:`${trades.length} trades tracked`},
          {l:"Win Rate",v:`${trades.length?(trades.filter(t=>t.result==="WIN").length/trades.length*100).toFixed(1):0}%`,c:T.blue,meta:`${trades.filter(t=>t.result==="WIN").length}W / ${trades.filter(t=>t.result==="LOSS").length}L`},
          {l:"Active Days",v:`${activeDays}`,c:T.amber,meta:bestDay?`Best day ${new Date(bestDay[0]).toLocaleDateString("en-GB",{day:"2-digit",month:"short"})}`:"No daily cluster yet"},
          {l:"Max Drawdown",v:`${drawdownData.maxDD.toFixed(2)}R`,c:T.red,meta:`Best streak ${streakData.maxWin} wins`},
        ].map(k=>(
          <div key={k.l} style={{background:`linear-gradient(180deg,${T.surface} 0%,${T.surface2} 100%)`,border:`1px solid ${T.border}`,borderRadius:16,padding:isMobile?"14px 14px":"16px 18px",boxShadow:`0 16px 30px ${T.cardGlow}`}}>
            <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>{k.l}</div>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:isMobile?20:22,fontWeight:800,color:k.c}}>{k.v}</div>
            <div style={{fontSize:11,color:T.textDim,marginTop:6,lineHeight:1.5}}>{k.meta}</div>
          </div>
        ))}
      </div>

      {/* View switcher */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {VIEWS.map(v=>(
          <button key={v.id} onClick={()=>setActiveView(v.id)} style={{
            padding:isMobile?"9px 14px":"9px 16px",borderRadius:999,fontSize:12,fontWeight:activeView===v.id?800:600,cursor:"pointer",fontFamily:"Inter,sans-serif",
            background:activeView===v.id?`linear-gradient(135deg,${T.accentBright},${T.pink})`:`${T.surface}`,
            color:activeView===v.id?"#fff":T.textDim,
            border:`1px solid ${activeView===v.id?"transparent":T.border}`,
            boxShadow:activeView===v.id?`0 12px 26px ${T.cardGlow}`:"none",
            transition:"all .2s",
          }}>{v.label}</button>
        ))}
      </div>

      {/* ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ CALENDAR VIEW ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ */}
      {activeView==="calendar"&&(
        <div>
          {/* Year overview */}
          <div style={{background:`linear-gradient(180deg,${T.surface} 0%,${T.surface2} 100%)`,border:`1px solid ${T.border}`,borderRadius:20,padding:isMobile?"14px 14px":"16px 18px",marginBottom:14,boxShadow:`0 18px 34px ${T.cardGlow}`}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
              <div>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:15,fontWeight:800,color:T.text}}>Year Overview / {year}</div>
                <div style={{fontSize:12,color:T.textDim,marginTop:4}}>Tap a month to jump straight into its calendar.</div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setYear(y=>y-1)} style={{background:T.surface2,border:`1px solid ${T.border}`,color:T.textDim,padding:"5px 12px",borderRadius:8,cursor:"pointer",fontSize:12}}>{year-1}</button>
                <button onClick={()=>setYear(y=>y+1)} style={{background:T.surface2,border:`1px solid ${T.border}`,color:T.textDim,padding:"5px 12px",borderRadius:8,cursor:"pointer",fontSize:12}}>{year+1}</button>
              </div>
            </div>
            <div style={{display:"flex",gap:isMobile?4:5,alignItems:"flex-end",height:isMobile?70:78}}>
              {yearlyData.map((d,i)=>(
                <div key={d.month} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer"}} onClick={()=>{setMonth(i);setActiveView("calendar")}}>
                  <div style={{fontSize:9,fontWeight:700,color:d.r>=0?T.green:T.red,marginBottom:1}}>{d.count>0?`${d.r>=0?"+":""}${d.r.toFixed(1)}`:""}</div>
                  <div style={{
                    width:"100%",borderRadius:"6px 6px 0 0",
                    height:d.count===0?4:Math.max(6,Math.abs(d.r)/maxAbsR*52),
                    background:d.r>0?`linear-gradient(180deg,${T.green},${T.green}66)`:d.r<0?`linear-gradient(180deg,${T.red},${T.red}66)`:T.surface2,
                    border:`1px solid ${i===month?T.accentBright:T.border}`,
                    boxShadow:i===month?`0 0 12px ${T.accentBright}40`:"none",
                    transition:"all .2s",
                  }}/>
                  <div style={{fontSize:9,fontWeight:700,color:i===month?T.accentBright:T.muted,letterSpacing:"0.04em"}}>{d.month}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly calendar */}
          <div style={{background:`linear-gradient(180deg,${T.surface} 0%,${T.surface2} 100%)`,border:`1px solid ${T.border}`,borderRadius:20,padding:isMobile?"14px 14px":"16px 18px",boxShadow:`0 18px 34px ${T.cardGlow}`}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:isMobile?22:24,fontWeight:800,color:T.text}}>{MONTHS[month]} {year}</div>
                <div style={{fontSize:12,color:T.textDim,marginTop:6}}>Tap a green or red day to open that day’s trade replay and screenshots.</div>
                <div style={{display:"flex",gap:10,marginTop:12,flexWrap:"wrap"}}>
                  {[
                    {label:"Trades",value:monthTrades.length,color:T.text},
                    {label:"Total R",value:`${monthR>=0?"+":""}${monthR.toFixed(2)}R`,color:monthR>=0?T.green:T.red},
                    {label:"Win Rate",value:`${monthWR}%`,color:T.blue},
                    {label:"Record",value:`${monthWins}W / ${monthTrades.length-monthWins}L`,color:T.textDim},
                  ].map(item=>(
                    <div key={item.label} style={{minWidth:isMobile?118:132,background:`linear-gradient(180deg,${T.surface2} 0%,${T.surface} 100%)`,border:`1px solid ${T.border}`,borderRadius:14,padding:isMobile?"10px 12px":"12px 14px",boxShadow:`0 12px 26px ${T.cardGlow}`}}>
                      <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>{item.label}</div>
                      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:isMobile?18:20,fontWeight:800,color:item.color}}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{if(month===0){setMonth(11);setYear(y=>y-1)}else setMonth(m=>m-1)}} style={{background:T.surface2,border:`1px solid ${T.border}`,color:T.textDim,padding:"6px 14px",borderRadius:8,cursor:"pointer"}}>Prev</button>
                <button onClick={()=>{if(month===11){setMonth(0);setYear(y=>y+1)}else setMonth(m=>m+1)}} style={{background:T.surface2,border:`1px solid ${T.border}`,color:T.textDim,padding:"6px 14px",borderRadius:8,cursor:"pointer"}}>Next</button>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,minmax(0,1fr))",gap:isMobile?4:6,marginBottom:6}}>
              {DAYS_SHORT.map(d=><div key={d} style={{textAlign:"center",fontSize:10,fontWeight:700,color:T.muted,padding:"2px 0",letterSpacing:"0.08em",textTransform:"uppercase"}}>{d}</div>)}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,minmax(0,1fr))",gap:isMobile?4:6}}>
              {cells.map((cell,i)=>{
                if(!cell) return <div key={i} style={{minHeight:isMobile?58:74}}/>
                const isToday=cell.dateStr===new Date().toISOString().split("T")[0]
                return (
                  <div key={cell.dateStr} onClick={()=>cell.data&&setSelectedDay(cell.dateStr)} style={{
                    minHeight:isMobile?58:74,borderRadius:isMobile?12:14,padding:isMobile?"6px 6px":"7px 8px",
                    background:getCalColor(cell.data,cell.isWeekend),
                    border:getCellBorder(cell.data,isToday),
                    display:"flex",flexDirection:"column",justifyContent:"space-between",
                    position:"relative",cursor:cell.data?"pointer":"default",
                    boxShadow:isToday?`0 0 0 2px ${T.accentBright}40`:`inset 0 1px 0 rgba(255,255,255,0.02)`,
                  }}>
                    <div style={{fontSize:isMobile?10:11,fontWeight:700,color:cell.isWeekend?T.muted:cell.data?(cell.data.r>=0?"#fff":T.red):T.textDim}}>{cell.dayNum}</div>
                    {cell.data&&(
                      <>
                        <div style={{fontSize:isMobile?10:11,fontWeight:800,color:cell.data.r>=0?"#fff":T.red,lineHeight:1.1}}>{cell.data.r>=0?"+":""}{cell.data.r.toFixed(1)}R</div>
                        {!isMobile&&<div style={{fontSize:9,color:cell.data.r>=0?"rgba(255,255,255,0.75)":T.textDim,letterSpacing:"0.02em"}}>{cell.data.count}t / {cell.data.wins}W</div>}
                      </>
                    )}
                    {isToday&&<div style={{position:"absolute",top:4,right:5,width:5,height:5,borderRadius:"50%",background:T.accentBright}}/>}
                  </div>
                )
              })}
            </div>
            <div style={{display:"flex",gap:10,marginTop:14,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{fontSize:11,color:T.muted,fontWeight:600}}>Legend:</span>
              {[{c:T.isDark?"#15803d":"#4ade80",l:"Strong Win (4R+)"},{c:T.isDark?"#166534":"#86efac",l:"Win"},{c:T.surface2,l:"No Trade"},{c:T.isDark?"#991b1b":"#f87171",l:"Loss"},{c:T.isDark?"#450a0a":"#ef4444",l:"Heavy Loss"}].map(x=>(
                <div key={x.l} style={{display:"flex",alignItems:"center",gap:5}}>
                  <div style={{width:14,height:14,borderRadius:4,background:x.c,border:`1px solid ${T.border}`}}/>
                  <span style={{fontSize:10,color:T.muted}}>{x.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ DAY OF WEEK VIEW ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ */}
      {activeView==="weekday"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{background:`linear-gradient(180deg,${T.surface} 0%,${T.surface2} 100%)`,border:`1px solid ${T.border}`,borderRadius:18,padding:isMobile?"16px 14px":"18px 20px",boxShadow:`0 18px 34px ${T.cardGlow}`}}>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:15,fontWeight:800,color:T.text,marginBottom:16}}>Performance by Day of Week</div>
            {trades.length===0?<EmptyState T={T} compact title="No weekday edge yet" copy="Log trades to see which weekday is really paying you."/>:(
              <>
                {/* Bar chart */}
                <div style={{display:"flex",gap:8,alignItems:"flex-end",height:140,marginBottom:20}}>
                  {dowData.map(d=>{
                    const maxR=Math.max(1,...dowData.map(x=>Math.abs(x.totalR)))
                    const h=d.count===0?4:Math.max(8,Math.abs(d.totalR)/maxR*120)
                    return (
                      <div key={d.dow} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                        <div style={{fontSize:11,fontWeight:700,color:d.totalR>=0?T.green:T.red}}>{d.count>0?`${d.totalR>=0?"+":""}${d.totalR.toFixed(1)}R`:""}</div>
                        <div style={{
                          width:"100%",borderRadius:"8px 8px 0 0",height:h,
                          background:d.totalR>0?`linear-gradient(180deg,${T.green},${T.green}77)`:d.totalR<0?`linear-gradient(180deg,${T.red},${T.red}77)`:T.surface2,
                          border:`1px solid ${T.border}`,transition:"height .5s",
                        }}/>
                        <div style={{fontSize:12,fontWeight:700,color:T.text}}>{d.short}</div>
                        <div style={{fontSize:10,color:T.muted}}>{d.wr}% WR</div>
                        <div style={{fontSize:10,color:T.muted}}>{d.count}t</div>
                      </div>
                    )
                  })}
                </div>
                {/* Table */}
                <div style={{display:"grid",gridTemplateColumns:"1fr",gap:6}}>
                  {dowData.filter(d=>d.count>0).sort((a,b)=>b.totalR-a.totalR).map((d,i)=>(
                    <div key={d.dow} style={{display:"flex",alignItems:isMobile?"flex-start":"center",flexDirection:isMobile?"column":"row",gap:isMobile?8:12,padding:"10px 14px",background:T.surface2,borderRadius:10,border:`1px solid ${d.totalR>0?T.green+"40":d.totalR<0?T.red+"40":T.border}`}}>
                      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:800,color:T.text,minWidth:90}}>{d.dow}</div>
                      <div style={{flex:1,width:isMobile?"100%":"auto",height:6,background:T.surface,borderRadius:3,overflow:"hidden"}}>
                        <div style={{height:"100%",background:d.totalR>=0?T.green:T.red,width:`${Math.min(100,d.count>0?d.wins/d.count*100:0)}%`,transition:"width .5s"}}/>
                      </div>
                      <div style={{fontSize:12,color:T.textDim,minWidth:50,textAlign:isMobile?"left":"right"}}>{d.wins}W / {d.count-d.wins}L</div>
                      <div style={{fontSize:12,fontWeight:700,color:d.totalR>=0?T.green:T.red,minWidth:55,textAlign:isMobile?"left":"right"}}>{d.totalR>=0?"+":""}{d.totalR.toFixed(2)}R</div>
                      <div style={{fontSize:11,color:T.muted,minWidth:40,textAlign:isMobile?"left":"right"}}>{d.wr}% WR</div>
                      {i===0&&<span style={{fontSize:10,background:`${T.green}20`,color:T.green,border:`1px solid ${T.green}40`,padding:"2px 8px",borderRadius:10,fontWeight:700}}>Best</span>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ SESSION GRID VIEW ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ */}
      {activeView==="session"&&(
        <div style={{background:`linear-gradient(180deg,${T.surface} 0%,${T.surface2} 100%)`,border:`1px solid ${T.border}`,borderRadius:18,padding:isMobile?"16px 14px":"18px 20px",boxShadow:`0 18px 34px ${T.cardGlow}`}}>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:15,fontWeight:800,color:T.text,marginBottom:6}}>Session / Day Heatmap</div>
          <div style={{fontSize:12,color:T.muted,marginBottom:16}}>Which session on which day makes you the most money?</div>
          {trades.length===0?<EmptyState T={T} compact title="No session map yet" copy="Log trades to see which session and weekday combination carries your edge."/>:(
            <>
              {/* Header row */}
              <div style={{display:"grid",gridTemplateColumns:isMobile?"92px repeat(5,minmax(0,1fr))":"120px repeat(5,1fr)",gap:6,marginBottom:6}}>
                <div/>
                {["Mon","Tue","Wed","Thu","Fri"].map(d=><div key={d} style={{textAlign:"center",fontSize:12,fontWeight:700,color:T.muted}}>{d}</div>)}
              </div>
              {sessionDowGrid.sessions.map(session=>(
                <div key={session} style={{display:"grid",gridTemplateColumns:isMobile?"92px repeat(5,minmax(0,1fr))":"120px repeat(5,1fr)",gap:6,marginBottom:6}}>
                  <div style={{fontSize:isMobile?11:12,fontWeight:700,color:T.textDim,display:"flex",alignItems:"center"}}>{session.split("/")[0]}</div>
                  {[1,2,3,4,5].map(dow=>{
                    const cell=sessionDowGrid.grid[session]?.[dow]||{r:0,count:0,wins:0}
                    const bg=cell.count===0?T.surface2:cell.r>2?T.isDark?"#14532d":"#bbf7d0":cell.r>0?T.isDark?"#166534":"#86efac":cell.r<-2?T.isDark?"#450a0a":"#fca5a5":cell.r<0?T.isDark?"#7f1d1d":"#fecaca":T.surface2
                    return (
                      <div key={dow} style={{background:bg,border:`1px solid ${cell.count>0?(cell.r>=0?T.green+"50":T.red+"50"):T.border}`,borderRadius:10,padding:isMobile?"8px 4px":"10px 8px",textAlign:"center",minHeight:isMobile?54:60,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3}}>
                        {cell.count===0?(
                          <div style={{fontSize:isMobile?9:11,color:T.muted}}>No data</div>
                        ):(
                          <>
                            <div style={{fontSize:isMobile?10:12,fontWeight:800,color:cell.r>=0?T.green:T.red}}>{cell.r>=0?"+":""}{cell.r.toFixed(1)}R</div>
                            <div style={{fontSize:isMobile?8:10,color:T.textDim}}>{cell.wins}W/{cell.count}t</div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ STREAK VIEW ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ */}
      {activeView==="streak"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {/* Streak KPIs */}
          <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,minmax(0,1fr))":"repeat(4,1fr)",gap:12}}>
            {[
              {l:"Current Streak",v:`${streakData.curStreak} ${streakData.curType==="WIN"?"W":"L"}`,sub:streakData.curType||"None",c:streakData.curType==="WIN"?T.green:T.red},
              {l:"Best Win Streak",v:`${streakData.maxWin} W`,sub:"consecutive wins",c:T.green},
              {l:"Worst Loss Streak",v:`${streakData.maxLoss} L`,sub:"consecutive losses",c:T.red},
              {l:"Total Trades",v:trades.length,sub:`${trades.filter(t=>t.result==="WIN").length}W / ${trades.filter(t=>t.result==="LOSS").length}L`,c:T.accentBright},
            ].map(k=>(
              <div key={k.l} style={{background:`linear-gradient(180deg,${T.surface} 0%,${T.surface2} 100%)`,border:`1px solid ${T.border}`,borderRadius:14,padding:"16px",boxShadow:`0 16px 30px ${T.cardGlow}`}}>
                <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:"0.1em",marginBottom:8}}>{k.l}</div>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:24,fontWeight:800,color:k.c}}>{k.v}</div>
                <div style={{fontSize:11,color:T.muted,marginTop:4}}>{k.sub}</div>
              </div>
            ))}
          </div>
          {/* Streak visualization - last 30 trades */}
          <div style={{background:`linear-gradient(180deg,${T.surface} 0%,${T.surface2} 100%)`,border:`1px solid ${T.border}`,borderRadius:18,padding:isMobile?"16px 14px":"18px 20px",boxShadow:`0 18px 34px ${T.cardGlow}`}}>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:15,fontWeight:800,color:T.text,marginBottom:16}}>Last 30 Trades / Streak View</div>
            {trades.length===0?<EmptyState T={T} compact title="No streak tape yet" copy="Log trades to watch your recent streak structure develop."/>:(
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {streakData.streaks.map((t,i)=>(
                  <div key={i} title={`${t.pair} ${t.date} ${t.r>=0?"+":""}${t.r.toFixed(2)}R`} style={{
                    width:36,height:36,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",
                    background:t.result==="WIN"?`${T.green}25`:t.result==="LOSS"?`${T.red}25`:`${T.amber}25`,
                    border:`1.5px solid ${t.result==="WIN"?T.green:t.result==="LOSS"?T.red:T.amber}`,
                    cursor:"default",
                  }}>
                    <span style={{fontSize:16}}>{t.result==="WIN"?"W":t.result==="LOSS"?"L":"B"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ DRAWDOWN VIEW ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ */}
      {activeView==="drawdown"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:12}}>
            {[
              {l:"Max Drawdown",v:`${drawdownData.maxDD.toFixed(2)}R`,c:T.red,sub:"peak to trough"},
              {l:"Current Drawdown",v:`${drawdownData.currentDD.toFixed(2)}R`,c:drawdownData.currentDD>0?T.amber:T.green,sub:"from current peak"},
              {l:"Peak Equity",v:`+${drawdownData.peak.toFixed(2)}R`,c:T.green,sub:"highest point reached"},
            ].map(k=>(
              <div key={k.l} style={{background:`linear-gradient(180deg,${T.surface} 0%,${T.surface2} 100%)`,border:`1px solid ${T.border}`,borderRadius:14,padding:"16px",boxShadow:`0 16px 30px ${T.cardGlow}`}}>
                <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:"0.1em",marginBottom:8}}>{k.l}</div>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:24,fontWeight:800,color:k.c}}>{k.v}</div>
                <div style={{fontSize:11,color:T.muted,marginTop:4}}>{k.sub}</div>
              </div>
            ))}
          </div>
          <div style={{background:`linear-gradient(180deg,${T.surface} 0%,${T.surface2} 100%)`,border:`1px solid ${T.border}`,borderRadius:18,padding:isMobile?"16px 14px":"18px 20px",boxShadow:`0 18px 34px ${T.cardGlow}`}}>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:15,fontWeight:800,color:T.text,marginBottom:16}}>Equity & Drawdown Chart</div>
            {drawdownData.points.length===0?<EmptyState T={T} compact title="No drawdown curve yet" copy="Log trades to see how equity and drawdown evolve over time."/>:(()=>{
              const pts=drawdownData.points
              const W=600,H=160
              const allR=pts.map(p=>p.cum)
              const allDD=pts.map(p=>-p.dd)
              const allVals=[...allR,...allDD,0]
              const mn=Math.min(...allVals),mx=Math.max(...allVals),rng=mx-mn||1
              const px=i=>(i/(pts.length-1||1))*(W-20)+10
              const py=v=>H-8-((v-mn)/rng)*(H-16)
              const equityPath=pts.map((p,i)=>`${i===0?"M":"L"} ${px(i)} ${py(p.cum)}`).join(" ")
              const ddPath=pts.map((p,i)=>`${i===0?"M":"L"} ${px(i)} ${py(-p.dd)}`).join(" ")
              const ddArea=ddPath+` L ${px(pts.length-1)} ${py(0)} L ${px(0)} ${py(0)} Z`
              return (
                <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block"}}>
                  <defs>
                    <linearGradient id="eqg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.green} stopOpacity="0.3"/><stop offset="100%" stopColor={T.green} stopOpacity="0"/></linearGradient>
                    <linearGradient id="ddg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.red} stopOpacity="0"/><stop offset="100%" stopColor={T.red} stopOpacity="0.3"/></linearGradient>
                  </defs>
                  <line x1="10" y1={py(0)} x2={W-10} y2={py(0)} stroke={T.border} strokeWidth="1" strokeDasharray="4 4"/>
                  <path d={ddArea} fill="url(#ddg)"/>
                  <path d={ddPath} fill="none" stroke={T.red} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7"/>
                  <path d={equityPath+` L ${px(pts.length-1)} ${H} L ${px(0)} ${H} Z`} fill="url(#eqg)"/>
                  <path d={equityPath} fill="none" stroke={T.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )
            })()}
            <div style={{display:"flex",gap:16,marginTop:10,alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:20,height:3,borderRadius:2,background:T.green}}/><span style={{fontSize:11,color:T.muted}}>Equity (R)</span></div>
              <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:20,height:3,borderRadius:2,background:T.red,opacity:0.7}}/><span style={{fontSize:11,color:T.muted}}>Drawdown</span></div>
            </div>
          </div>
        </div>
      )}
      {selectedDay&&(
        <Overlay onClose={()=>setSelectedDay(null)}>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:18,width:"min(760px,96vw)",maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"18px 22px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
              <div>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:18,fontWeight:800,color:T.text}}>{fmtDate(selectedDay)} Trade Drilldown</div>
                <div style={{fontSize:12,color:T.textDim,marginTop:4}}>{selectedDayTrades.length} trade{selectedDayTrades.length!==1?"s":""} logged on this day</div>
              </div>
              <button onClick={()=>setSelectedDay(null)} style={{background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:20}}>x</button>
            </div>
            <div style={{padding:"18px 22px",overflowY:"auto",display:"flex",flexDirection:"column",gap:12}}>
              {selectedDayTrades.length===0?(
                <EmptyState T={T} compact title="No trades on this day" copy="This day block has no drilldown data yet." />
              ):selectedDayTrades.map(trade=>(
                <div key={trade._dbid||`${trade.date}-${trade.pair}-${trade.entry}`} style={{background:`linear-gradient(180deg,${T.surface2} 0%,${T.surface} 100%)`,border:`1px solid ${T.border}`,borderRadius:14,padding:"14px 16px"}}>
                  <div style={{display:"flex",alignItems:isMobile?"flex-start":"center",justifyContent:"space-between",gap:10,flexDirection:isMobile?"column":"row",marginBottom:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:16,fontWeight:800,color:T.accentBright}}>{trade.pair}</div>
                      <Badge color={trade.direction==="LONG"?T.green:T.red}>{trade.direction}</Badge>
                      <Badge color={trade.result==="WIN"?T.green:trade.result==="LOSS"?T.red:T.amber}>{trade.result}</Badge>
                      {trade.session&&<Badge color={T.blue}>{trade.session}</Badge>}
                    </div>
                    <div style={{fontSize:15,fontWeight:800,color:(trade.rr||0)>=0?T.green:T.red}}>{fmtRR(trade.rr||0)}</div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,minmax(0,1fr))":"repeat(4,minmax(0,1fr))",gap:8,marginBottom:10}}>
                    {[{l:"Entry",v:trade.entry||"-"},{l:"Stop",v:trade.sl||"-"},{l:"Target",v:trade.tp||"-"},{l:"Pips",v:trade.pips||0}].map(item=>(
                      <div key={item.l} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 10px"}}>
                        <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:4}}>{item.l}</div>
                        <div style={{fontSize:13,fontWeight:800,color:T.text}}>{item.v}</div>
                      </div>
                    ))}
                  </div>
                  {[{l:"Setup",v:trade.setup},{l:"Manip",v:trade.manipulation},{l:"POI",v:trade.poi}].some(x=>x.v)&&(
                    <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
                      {[{l:"Setup",v:trade.setup},{l:"Manip",v:trade.manipulation},{l:"POI",v:trade.poi}].filter(x=>x.v).map(x=>(
                        <div key={x.l} style={{display:"flex",alignItems:"center",gap:4,background:T.surface,border:`1px solid ${T.border}`,padding:"4px 9px",borderRadius:999,maxWidth:"100%"}}>
                          <span style={{fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.1em"}}>{x.l}</span>
                          <span style={{fontSize:11,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{x.v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {trade.notes&&<div style={{fontSize:12,color:T.textDim,lineHeight:1.6,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px",marginBottom:10}}>{trade.notes}</div>}
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {trade.preScreenshot&&<button onClick={()=>onViewImg?.(trade.preScreenshot)} style={{background:`linear-gradient(135deg,${T.accent}16,${T.blue}12)`,border:`1px solid ${T.accent}40`,color:T.accentBright,padding:"8px 12px",borderRadius:10,cursor:"pointer",fontSize:12,fontWeight:700}}>Pre Screenshot</button>}
                    {trade.postScreenshot&&<button onClick={()=>onViewImg?.(trade.postScreenshot)} style={{background:`linear-gradient(135deg,${T.accent}16,${T.blue}12)`,border:`1px solid ${T.accent}40`,color:T.accentBright,padding:"8px 12px",borderRadius:10,cursor:"pointer",fontSize:12,fontWeight:700}}>Post Screenshot</button>}
                    {!trade.preScreenshot&&!trade.postScreenshot&&<div style={{fontSize:12,color:T.muted}}>No screenshots attached to this trade.</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Overlay>
      )}
    </div>
  )
}


// ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ Trade Modal ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬

export default Heatmap;
