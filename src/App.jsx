import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  Plus, 
  Trash2, 
  X, 
  FileText, 
  Search, 
  DollarSign, 
  Briefcase, 
  Clock, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  Wallet, 
  Building2, 
  Filter, 
  Eye, 
  Edit2, 
  Save, 
  MessageSquare, 
  RefreshCw, 
  ArrowUpDown, 
  Calendar, 
  Settings, 
  CheckCircle2, 
  Lock, 
  Key, 
  LogOut, 
  Sliders, 
  UserCheck,
  ChevronLeft, 
  Menu
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  ReferenceLine
} from 'recharts';

// --- 1. KONFIGURASI ---
const DEFAULT_PASSWORDS = {
    admin: "admincost2026",
    guest: "guestonly"
};

const LOAD_LIMITS = {
    LOW: 2,   
    HIGH: 6
};

const COLORS = [
  '#2563EB', '#DC2626', '#059669', '#D97706', '#7C3AED', '#DB2777', 
  '#0891B2', '#4F46E5', '#65A30D', '#9333EA', '#EA580C', '#0D9488', '#64748B'
];

// --- 2. FUNGSI PEMBANTU ---
const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val || 0);

const formatCompactCurrency = (val) => {
  const v = Number(val) || 0;
  if (v >= 1000000000000) return `Rp ${(v / 1000000000000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} T`;
  if (v >= 1000000000) return `Rp ${(v / 1000000000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} M`;
  if (v >= 1000000) return `Rp ${(v / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} jt`;
  return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
};

const formatPercent = (val) => `${(val || 0).toFixed(1)}%`;

const formatDate = (date) => {
  if (!date) return '-';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: '2-digit'});
};

// Cek Status Done (Termasuk Pending & Cancelled)
const checkIsDone = (status, progress) => {
    const s = (status || "").toLowerCase();
    const doneKeywords = ['completed', 'done', 'selesai', 'finish', 'cancelled', 'batal', 'pending'];
    return doneKeywords.some(k => s.includes(k)) || progress >= 100;
};

// Smart CSV Parser
const parseCSV = (text) => {
    const rows = [];
    let currentRow = [];
    let currentVal = '';
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i+1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentVal += '"'; 
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentVal);
            currentVal = '';
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') i++; 
            currentRow.push(currentVal);
            rows.push(currentRow);
            currentRow = [];
            currentVal = '';
        } else {
            currentVal += char;
        }
    }
    if (currentVal || currentRow.length) {
        currentRow.push(currentVal);
        rows.push(currentRow);
    }
    return rows;
};

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) => {
  if (percent < 0.02) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text 
      x={x} 
      y={y} 
      fill="#ffffff" 
      textAnchor="middle" 
      dominantBaseline="central" 
      fontSize={14} 
      fontWeight="bold" 
      style={{ textShadow: '0px 1px 3px rgba(0,0,0,0.8)' }}
    >
      {value}
    </text>
  );
};

// --- 3. KOMPONEN UI ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 relative ${className}`}>
    {children}
  </div>
);

const Badge = ({ status }) => {
  const st = (status || "").toLowerCase().trim();
  let style = "bg-slate-100 text-slate-700 border-slate-200";
  if (st.includes("on track") || st.includes("sesuai") || st.includes("lancar") || st.includes("menang") || st.includes("win")) style = "bg-emerald-100 text-emerald-700 border-emerald-200";
  else if (st.includes("overdue") || st.includes("terlambat")) style = "bg-red-200 text-red-900 border-red-300";
  else if (st.includes("delayed") || st.includes("kurang") || st.includes("lost") || st.includes("kalah") || st.includes("critical")) style = "bg-red-100 text-red-700 border-red-200";
  else if (st.includes("risk") || st.includes("kritis") || st.includes("budgetary") || st.includes("prebid")) style = "bg-amber-100 text-amber-700 border-amber-200";
  else if (st.includes("pending") || st.includes("tunggu")) style = "bg-slate-200 text-slate-700 border-slate-300";
  else if (st.includes("completed") || st.includes("selesai") || st.includes("finish") || st.includes("done")) style = "bg-blue-100 text-blue-700 border-blue-200";
  else if (st.includes("cancelled") || st.includes("batal")) style = "bg-gray-100 text-gray-500 border-gray-200 line-through";
  return <span className={`px-2.5 py-1 rounded-full text-xs uppercase font-bold border ${style} whitespace-nowrap`}>{status || "-"}</span>;
};

const StatusProgressLabel = ({ text }) => {
    if (!text) return null;
    const t = String(text).toUpperCase();
    let style = "hidden"; let show = false;
    if (t.includes("NEAR CRITICAL")) { style = "text-amber-700 bg-amber-100 border-amber-200"; show = true; } 
    else if (t.includes("OVERDUE") || t.includes("TERLAMBAT")) { style = "text-red-900 bg-red-200 border-red-300"; show = true; } 
    else if (t.includes("CRITICAL")) { style = "text-red-700 bg-red-100 border-red-200"; show = true; }
    if (!show) return null;
    return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${style} ml-2`}>{text}</span>;
};

const LoadBadge = ({ status }) => {
    let color = "bg-emerald-100 text-emerald-700";
    if (status && status.includes("OVERLOAD")) color = "bg-red-100 text-red-700";
    else if (status && (status.includes("UNDERLOAD") || status.includes("IDLE"))) color = "bg-amber-100 text-amber-700";
    return <span className={`text-[10px] font-bold px-2 py-1 rounded ${color}`}>{status}</span>;
};

const KPICard = ({ title, value, subtext, icon: Icon, colorClass }) => (
    <Card className={`p-4 border-l-4 ${colorClass} flex flex-col justify-between h-full`}>
        <div className="flex justify-between items-start mb-2">
            <div className="overflow-hidden pr-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate">{title}</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1 break-words leading-tight" title={value}>{value}</h3>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl text-slate-500 flex-shrink-0"><Icon size={24} /></div>
        </div>
        {subtext && <div className="mt-auto pt-3 border-t border-slate-50 text-xs font-medium truncate">{subtext}</div>}
    </Card>
);

const SortableHeader = ({ label, sortKey, currentSort, onSort, align="left", stickyLeft = false }) => (
    <th 
        className={`px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group text-${align} sticky top-0 z-20 bg-slate-50 shadow-sm ${stickyLeft ? 'left-0' : ''}`} 
        onClick={() => onSort(sortKey)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
        {label}<ArrowUpDown size={12} className={`text-slate-300 ${currentSort.key === sortKey ? 'text-emerald-600' : 'group-hover:text-slate-400'}`} />
      </div>
    </th>
);

const ProjectRow = ({ project, setSelectedProjectForNotes, notes }) => (
    <tr className="hover:bg-slate-50/80 transition-colors group border-b border-slate-50 last:border-0">
        <td className="px-6 py-4 font-medium text-slate-700 align-top sticky left-0 z-10 bg-white group-hover:bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
            <span className="block whitespace-normal leading-snug min-w-[200px] max-w-[300px] text-sm" title={project.project_name}>{project.project_name}</span>
            <div className="flex flex-wrap items-center mt-1">
                 <div className="text-xs text-slate-400 font-normal flex items-center gap-1"><Building2 size={12} /> {project.owner} {project.department ? `- ${project.department}` : ''}</div>
                 <StatusProgressLabel text={project.specific_status} />
            </div>
        </td>
        <td className="px-6 py-4 text-sm align-top pt-4 whitespace-nowrap">{project.pic}</td>
        <td className="px-6 py-4 text-right font-mono text-sm text-slate-500 align-top pt-4 whitespace-nowrap">{formatCurrency(project.barecost)}</td>
        <td className="px-6 py-4 text-right font-mono text-sm text-slate-700 align-top pt-4 whitespace-nowrap">{formatCurrency(project.penawaran)}</td>
        <td className="px-6 py-4 text-right font-mono text-sm text-blue-700 align-top pt-4 whitespace-nowrap">{formatCurrency(project.kontrak)}</td>
        <td className="px-6 py-4 text-right font-mono text-sm text-emerald-600 font-bold align-top pt-4">{formatPercent(project.gpm_offer_pct)}</td>
        <td className="px-6 py-4 text-right font-mono text-sm text-blue-600 font-bold align-top pt-4">{formatPercent(project.gpm_contract_pct)}</td>
        <td className="px-6 py-4 text-center text-sm text-slate-500 align-top pt-4">{formatDate(project.last_update_date)}</td>
        <td className="px-6 py-4 text-center align-top pt-4"><Badge status={project.status} /></td>
        <td className="px-6 py-4 text-center align-top pt-4">
            <button onClick={() => setSelectedProjectForNotes(project)} className={`p-2 rounded-full transition-all relative ${notes[project.project_name]?.length > 0 ? 'text-emerald-500 bg-emerald-50' : 'text-slate-300 hover:text-emerald-500 hover:bg-slate-100'}`} title="Lihat Notes">
                <FileText size={18} />{notes[project.project_name]?.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
            </button>
        </td>
    </tr>
);

const LoginScreen = ({ onLogin, currentPasswords }) => {
    const [input, setInput] = useState("");
    const [error, setError] = useState(false);
    const handleSubmit = (e) => { e.preventDefault(); if (input === currentPasswords.admin) onLogin('admin'); else if (input === currentPasswords.guest) onLogin('guest'); else setError(true); };
    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-100">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-slate-200">
                <div className="flex justify-center mb-6"><div className="bg-emerald-100 p-4 rounded-full text-emerald-600"><Lock size={32} /></div></div>
                <h2 className="text-xl font-bold text-center text-slate-800 mb-1">Cost Control Dashboard</h2>
                <p className="text-xs text-center text-slate-500 mb-6">Masukkan PIN akses Admin atau Guest</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><input type="password" className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-300 focus:ring-2 focus:ring-emerald-200'} outline-none text-center text-sm transition-all`} placeholder="PIN Akses" value={input} onChange={(e) => {setInput(e.target.value); setError(false)}} autoFocus />{error && <p className="text-[10px] text-red-500 text-center mt-2">PIN salah. Silakan coba lagi.</p>}</div>
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-200">Masuk Dashboard</button>
                </form>
                <p className="text-[10px] text-slate-400 text-center mt-6">Versi Final 1.0.5</p>
            </div>
        </div>
    );
};

const MOCK_DATA = [{ id: 1, project_name: "Contoh Proyek", owner: "PT Mock", pic: "Admin", barecost: 100, penawaran: 120, kontrak: 110, gpm_offer_pct: 20, gpm_contract_pct: 10, status: "On Track", specific_status: "CRITICAL", progress: 50, last_update_date: new Date() }];

// --- 4. APP COMPONENT ---
export default function App() {
  const [auth, setAuth] = useState({ isAuth: false, role: null });
  const [passwords, setPasswords] = useState(() => { try { return JSON.parse(localStorage.getItem('cost_dashboard_passwords')) || DEFAULT_PASSWORDS; } catch { return DEFAULT_PASSWORDS; } });
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSync, setLastSync] = useState(null); 
  
  const [filterOwner, setFilterOwner] = useState('All');
  const [filterPic, setFilterPic] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterProgressStatus, setFilterProgressStatus] = useState('All');

  const [sortConfig, setSortConfig] = useState({ key: 'last_update_date', direction: 'desc' });
  const [loadSettings, setLoadSettings] = useState(() => { try { return JSON.parse(localStorage.getItem('cost_dashboard_load_settings')) || { ongoingOver: 150, ongoingUnder: 80, totalOver: 200, totalUnder: 80 }; } catch { return { ongoingOver: 150, ongoingUnder: 80, totalOver: 200, totalUnder: 80 }; } });
  const [showLoadSettings, setShowLoadSettings] = useState(false);
  const [activePicFilter, setActivePicFilter] = useState(null);
  const [loadChartMetric, setLoadChartMetric] = useState('total');
  
  // State for Done List accordion
  const [isDoneListOpen, setIsDoneListOpen] = useState(false);
  // Sidebar State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [showAllProfitability, setShowAllProfitability] = useState(false);
  const [profitViewMode, setProfitViewMode] = useState('owner'); 
  const [selectedProjectForNotes, setSelectedProjectForNotes] = useState(null);
  const [notes, setNotes] = useState(() => { try { return JSON.parse(localStorage.getItem('cost_dashboard_notes_v8')) || {}; } catch { return {}; } });
  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingText, setEditingText] = useState("");

  const [adminPassInput, setAdminPassInput] = useState("");
  const [guestPassInput, setGuestPassInput] = useState("");
  const [passSaveStatus, setPassSaveStatus] = useState("");

  useEffect(() => { const savedAuth = localStorage.getItem('cost_dashboard_auth_state'); if (savedAuth) setAuth(JSON.parse(savedAuth)); setIsAuthChecking(false); }, []);

  // AUTO EXPAND DONE LIST WHEN SEARCHING
  useEffect(() => {
    if (searchQuery && searchQuery.trim() !== "") {
        setIsDoneListOpen(true);
    }
  }, [searchQuery]);

  const handleLogin = (role) => { const newAuth = { isAuth: true, role }; setAuth(newAuth); localStorage.setItem('cost_dashboard_auth_state', JSON.stringify(newAuth)); if (role === 'guest') setProfitViewMode('owner'); setAdminPassInput(passwords.admin); setGuestPassInput(passwords.guest); setActiveTab('dashboard'); };
  const handleLogout = () => { setAuth({ isAuth: false, role: null }); localStorage.removeItem('cost_dashboard_auth_state'); setActiveTab('dashboard'); };
  const handleSavePasswords = () => { if (!adminPassInput || !guestPassInput) return; const newPasswords = { admin: adminPassInput, guest: guestPassInput }; setPasswords(newPasswords); localStorage.setItem('cost_dashboard_passwords', JSON.stringify(newPasswords)); setPassSaveStatus("Tersimpan!"); setTimeout(() => setPassSaveStatus(""), 3000); };
  const updateLoadThresholds = (key, value) => { const newThresholds = { ...loadSettings, [key]: parseInt(value) }; setLoadThresholds(newThresholds); localStorage.setItem('cost_dashboard_load_settings', JSON.stringify(newThresholds)); };

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const response = await fetch(`https://docs.google.com/spreadsheets/d/e/2PACX-1vSE4iCfy-ul3AvvtRn8crrMl-U8XTbcFQBdXSYTsEeMsUOfrzrmPH451fngepPaiT0wJ2RU11su9FD5/pub?output=csv&t=${Date.now()}`);
      if (!response.ok) throw new Error("Gagal");
      const csvText = await response.text();
      const parsedRows = parseCSV(csvText);
      if (parsedRows.length > 3) {
          const dataRows = parsedRows.slice(3); 
          const parsedData = dataRows.map((columns, index) => {
              if (columns.length < 5) return null; 
              const clean = (val) => val ? val.trim().replace(/^"|"$/g, '') : "";
              const projName = clean(columns[1]);
              if (projName.toUpperCase() === 'JUDUL PEKERJAAN') return null;
              if (projName.toLowerCase().includes('total') || projName.toLowerCase().includes('jumlah')) return null;
              if (!projName) return null;
              if (!isNaN(parseFloat(projName)) && isFinite(projName)) return null;

              const picName = clean(columns[4]); 
              if (!isNaN(parseFloat(picName)) && isFinite(picName)) return null;
              if (picName.includes('%')) return null;

              const parseMoney = (val) => { if (!val) return 0; let cleanStr = val.replace(/Rp|rp|\s/g, ''); if (cleanStr.includes('.') && cleanStr.includes(',')) cleanStr = cleanStr.replace(/\./g, '').replace(',', '.'); else if (cleanStr.match(/\.\d{3}/) && !cleanStr.includes(',')) cleanStr = cleanStr.replace(/\./g, ''); else if (cleanStr.includes(',')) cleanStr = cleanStr.replace(/,/g, ''); return parseFloat(cleanStr) || 0; };
              
              const colProgressText = clean(columns[10]); 
              const colComment = clean(columns[11]); 
              let progressVal = 0; const pctMatch = colProgressText.match(/(\d+(?:[.,]\d+)?)%/);
              if (pctMatch) progressVal = parseFloat(pctMatch[1].replace(',', '.'));
              else { const backupProgress = parseFloat(clean(columns[14]).replace(/%|,/g, '')); if (!isNaN(backupProgress)) progressVal = (backupProgress <= 1 && backupProgress > 0) ? backupProgress * 100 : backupProgress; }
              const parseDateFromText = (text) => { if (!text) return null; let match = text.trim().match(/^(\d{2})[\.\-\/](\d{2})[\.\-\/](\d{2,4})/); if (!match) match = text.trim().match(/^(\d{2})(\d{2})(\d{2})/); if (match) { let year = parseInt(match[3]); if (year < 100) year += 2000; return new Date(year, parseInt(match[2]) - 1, parseInt(match[1])); } return null; };
              const lastUpdateDate = parseDateFromText(colProgressText);
              
              let rawStatus = clean(columns[9]); 
              if (!rawStatus || rawStatus === "-") { if (progressVal >= 100) rawStatus = "Completed"; else if (progressVal > 0) rawStatus = "In Progress"; else rawStatus = "Planned"; }
              
              const barecost = parseMoney(columns[16]); const penawaran = parseMoney(columns[17]); const kontrak = parseMoney(columns[18]); 
              let gpm_offer_raw = parseMoney(columns[22]); let gpm_contract_raw = parseMoney(columns[23]); 
              let gpm_offer_pct = (gpm_offer_raw > 100 && penawaran > 0) ? (gpm_offer_raw/penawaran)*100 : (gpm_offer_raw <= 1 ? gpm_offer_raw*100 : gpm_offer_raw);
              let gpm_contract_pct = (gpm_contract_raw > 100 && kontrak > 0) ? (gpm_contract_raw/kontrak)*100 : (gpm_contract_raw <= 1 ? gpm_contract_raw*100 : gpm_contract_raw);
              const specificStatus = clean(columns[14]); 
              const picSupport = [clean(columns[5]), clean(columns[6]), clean(columns[7])].filter(s => s && s !== "-" && s.length > 2).join(", ");
              const tindakLanjut = colComment ? `${colProgressText}\n\n[Last Update]:\n${colComment}` : colProgressText;

              return {
                  id: index, project_name: projName, department: clean(columns[2]), owner: clean(columns[3]) || "General", pic: picName, pic_support: picSupport,
                  progress: progressVal, tindak_lanjut: tindakLanjut, last_update_date: lastUpdateDate, status: rawStatus, specific_status: specificStatus,
                  barecost, penawaran, kontrak, gpm_offer_val: (gpm_offer_pct/100) * penawaran, gpm_contract_val: (gpm_contract_pct/100) * kontrak,
                  gpm_offer_pct: gpm_offer_pct || 0, gpm_contract_pct: gpm_contract_pct || 0,
              };
          }).filter(item => item !== null && item.project_name);
          setData(parsedData);
      } else setData(MOCK_DATA);
      setLastSync(new Date()); 
    } catch (error) { console.error("Error:", error); if (data.length === 0) setData(MOCK_DATA); setLastSync(new Date()); } 
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { if(auth.isAuth) fetchData(); }, [auth.isAuth, fetchData]);

  const handleAddNote = () => { if (!newNote.trim()) return; const timestamp = new Date().toLocaleString('id-ID'); const projectKey = selectedProjectForNotes.project_name; const projectNotes = notes[projectKey] || []; const updatedNotes = { ...notes, [projectKey]: [...projectNotes, { id: Date.now(), text: newNote, time: timestamp }] }; setNotes(updatedNotes); localStorage.setItem('cost_dashboard_notes_v8', JSON.stringify(updatedNotes)); setNewNote(""); };
  const handleDeleteNote = (noteId) => { const projectKey = selectedProjectForNotes.project_name; const projectNotes = notes[projectKey].filter(n => n.id !== noteId); const updatedNotes = { ...notes, [projectKey]: projectNotes }; setNotes(updatedNotes); localStorage.setItem('cost_dashboard_notes_v8', JSON.stringify(updatedNotes)); };
  const saveEditedNote = (noteId) => { const projectKey = selectedProjectForNotes.project_name; const projectNotes = notes[projectKey].map(n => { if (n.id === noteId) return { ...n, text: editingText }; return n; }); const updatedNotes = { ...notes, [projectKey]: projectNotes }; setNotes(updatedNotes); localStorage.setItem('cost_dashboard_notes_v8', JSON.stringify(updatedNotes)); setEditingNoteId(null); };
  const startEditingNote = (note) => { setEditingNoteId(note.id); setEditingText(note.text); };
  const requestSort = (key) => { let direction = 'asc'; if (sortConfig.key === key && sortConfig.direction === 'asc') { direction = 'desc'; } setSortConfig({ key, direction }); };
  const handlePicClick = (picName) => { setActivePicFilter(activePicFilter === picName ? null : picName); if (activeTab !== 'team') setActiveTab('team'); };

  // STATS
  const stats = useMemo(() => {
    const totalProjects = data.length; const totalBarecost = data.reduce((acc, curr) => acc + curr.barecost, 0); const totalPenawaran = data.reduce((acc, curr) => acc + curr.penawaran, 0); const totalKontrak = data.reduce((acc, curr) => acc + curr.kontrak, 0);
    const totalGVOffer = data.reduce((acc, curr) => acc + curr.gpm_offer_val, 0); const totalGVContract = data.reduce((acc, curr) => acc + curr.gpm_contract_val, 0);
    const avgGPMOffer = totalPenawaran > 0 ? (totalGVOffer / totalPenawaran) * 100 : 0; const avgGPMContract = totalKontrak > 0 ? (totalGVContract / totalKontrak) * 100 : 0;
    
    let countOverdue = 0; let countCritical = 0; let countNearCritical = 0;
    data.forEach(d => {
        const s = (d.specific_status || "").toUpperCase();
        if (s.includes("NEAR CRITICAL")) countNearCritical++; else if (s.includes("OVERDUE") || s.includes("TERLAMBAT")) countOverdue++; else if (s.includes("CRITICAL") || s.includes("KRITIS")) countCritical++;
    });

    const doneProjects = data.filter(p => checkIsDone(p.status, p.progress)).length;
    return { 
        totalProjects, totalBarecost, totalPenawaran, totalKontrak, avgGPMOffer, avgGPMContract, 
        countOverdue, countCritical, countNearCritical, 
        doneProjects, ongoingProjects: totalProjects - doneProjects 
    };
  }, [data]);
  const dynamicLimits = useMemo(() => { const low = Math.floor(stats.totalProjects * (loadSettings.lowPct / 100)); const high = Math.ceil(stats.totalProjects * (loadSettings.highPct / 100)); return { low: low || LOAD_LIMITS.LOW, high: high || LOAD_LIMITS.HIGH }; }, [stats.totalProjects, loadSettings]);
  
  const loadByPic = useMemo(() => {
    const load = {}; let totalUniquePics = 0; const tempPics = new Set();
    data.forEach(p => { const picName = p.pic || "Unassigned"; if (picName.toLowerCase().includes("pic utama") || picName.toLowerCase().includes("pic support")) return; tempPics.add(picName.trim()); });
    totalUniquePics = tempPics.size;
    const avgTotalPerPic = totalUniquePics > 0 ? stats.totalProjects / totalUniquePics : 1;
    const avgOngoingPerPic = totalUniquePics > 0 ? stats.ongoingProjects / totalUniquePics : 1;

    data.forEach(p => {
        const picName = p.pic || "Unassigned"; if (picName.toLowerCase().includes("pic utama") || picName.toLowerCase().includes("pic support")) return;
        const cleanName = picName.trim(); const st = (p.status || "").toLowerCase(); const isDone = checkIsDone(p.status, p.progress);
        if (!load[cleanName]) load[cleanName] = { name: cleanName, count: 0, doneCount: 0, activeCount: 0, supportCount: 0 };
        load[cleanName].count += 1; if (isDone) load[cleanName].doneCount += 1; else load[cleanName].activeCount += 1;
        
        const supName = p.pic_support;
        if (supName && supName !== "-") {
            const supports = supName.split(/[\/,]/).map(s => s.trim());
            supports.forEach(s => {
                if (s && s.length > 2 && !s.toLowerCase().includes("pic")) {
                     if (!load[s]) load[s] = { name: s, count: 0, doneCount: 0, activeCount: 0, supportCount: 0 };
                     load[s].supportCount += 1;
                }
            });
        }
    });

    return Object.values(load).map(p => {
        let statusText = "IDEAL";
        const isOngoingOver = p.activeCount > (avgOngoingPerPic * (loadSettings.ongoingOver / 100)); const isTotalOver = p.count > (avgTotalPerPic * (loadSettings.totalOver / 100));
        const isOngoingUnder = p.activeCount < (avgOngoingPerPic * (loadSettings.ongoingUnder / 100)); const isTotalUnder = p.count < (avgTotalPerPic * (loadSettings.totalUnder / 100));
        if (isOngoingOver && isTotalOver) statusText = "OVERLOAD TOTAL+ONGOING"; else if (isOngoingOver) statusText = "OVERLOAD ONGOING"; else if (isTotalOver) statusText = "OVERLOAD TOTAL"; else if (isOngoingUnder) statusText = "UNDERLOAD ONGOING"; else if (isTotalUnder) statusText = "UNDERLOAD TOTAL";
        if (p.activeCount === 0) statusText = "IDLE";
        return { ...p, statusText };
    }).sort((a, b) => {
        if (loadChartMetric === 'active') return b.activeCount - a.activeCount;
        if (loadChartMetric === 'done') return b.doneCount - a.doneCount;
        return b.count - a.count;
    });
  }, [data, loadSettings, stats, loadChartMetric]);

  const loadByOwner = useMemo(() => { const load = {}; data.forEach(p => { const ownerName = p.owner || "Others"; if (ownerName.toLowerCase() === 'owner') return; const cleanName = ownerName.trim(); if (!load[cleanName]) load[cleanName] = { name: cleanName, count: 0, value: 0 }; load[cleanName].count += 1; load[cleanName].value += p.penawaran; }); return Object.values(load).sort((a, b) => b.value - a.value); }, [data]);
  const statusData = useMemo(() => { const statuses = {}; data.forEach(p => { let st = (p.status || "Unknown").toUpperCase(); if (st.includes("STATUS") || st === "") return; statuses[st] = (statuses[st] || 0) + 1; }); return Object.keys(statuses).map(key => ({ name: key, value: statuses[key] })).sort((a, b) => b.value - a.value); }, [data]);
  const profitData = useMemo(() => { let filtered = showAllProfitability ? data : data.filter(d => checkIsDone(d.status, d.progress)); const aggMap = {}; const key = profitViewMode === 'owner' ? 'owner' : 'pic'; filtered.forEach(p => { let name = p[key] || "Others"; if (key === 'pic' && (name.toLowerCase().includes("pic utama") || name.toLowerCase().includes("pic support"))) return; if (key === 'owner' && name.toLowerCase() === 'owner') return; if (!aggMap[name]) aggMap[name] = { name, offer: 0, contract: 0, gv_offer: 0, gv_contract: 0 }; aggMap[name].offer += p.penawaran; aggMap[name].contract += p.kontrak; aggMap[name].gv_offer += (p.gpm_offer_pct/100)*p.penawaran; aggMap[name].gv_contract += (p.gpm_contract_pct/100)*p.kontrak; }); return Object.values(aggMap).map(o => ({ name: o.name, gpm_offer_pct: o.offer > 0 ? (o.gv_offer/o.offer)*100 : 0, gpm_contract_pct: o.contract > 0 ? (o.gv_contract/o.contract)*100 : 0 })).sort((a,b) => b.gpm_contract_pct - a.gpm_contract_pct).slice(0, 10); }, [data, showAllProfitability, profitViewMode]);
  
  const filteredProjects = useMemo(() => { 
      let filtered = data.filter(p => { 
          const matchesSearch = (p.project_name || "").toLowerCase().includes(searchQuery.toLowerCase()) || (p.pic || "").toLowerCase().includes(searchQuery.toLowerCase()); 
          const matchesOwner = filterOwner === 'All' || p.owner === filterOwner; 
          const matchesPic = filterPic === 'All' || p.pic === filterPic; 
          const matchesStatus = filterStatus === 'All' || p.status === filterStatus; 
          const matchesActivePic = !activePicFilter || p.pic === activePicFilter;
          const matchesProgress = filterProgressStatus === 'All' || (() => {
              const status = (p.specific_status || "").toUpperCase();
              if (filterProgressStatus === 'CRITICAL') {
                  return status.includes('CRITICAL') && !status.includes('NEAR');
              }
              return status.includes(filterProgressStatus);
          })();
          
          return matchesSearch && matchesOwner && matchesPic && matchesStatus && matchesActivePic && matchesProgress; 
      }); 
      filtered.sort((a, b) => { 
          let valA = a[sortConfig.key]; let valB = b[sortConfig.key];
          if (sortConfig.key === 'last_update_date') { valA = a.last_update_date ? a.last_update_date.getTime() : 0; valB = b.last_update_date ? b.last_update_date.getTime() : 0; } 
          else if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = valB ? valB.toLowerCase() : ''; }
          else { valA = Number(valA) || 0; valB = Number(valB) || 0; }
          if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1; if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1; return 0; 
      }); 
      return filtered; 
  }, [data, searchQuery, filterOwner, filterPic, filterStatus, filterProgressStatus, activePicFilter, sortConfig]);
  
  const activeProjectsList = useMemo(() => filteredProjects.filter(p => !checkIsDone(p.status, p.progress)), [filteredProjects]);
  const doneProjectsList = useMemo(() => filteredProjects.filter(p => checkIsDone(p.status, p.progress)), [filteredProjects]);
  
  // LOGIC SORT KHUSUS DASHBOARD (REQ #3 + Limit 10)
  const dashboardProjects = useMemo(() => {
    // REVISI: Menggunakan filteredProjects agar status DONE/CANCELLED/PENDING ikut masuk
    let sorted = [...filteredProjects];
    sorted.sort((a, b) => {
        const aHasNotes = notes[a.project_name] && notes[a.project_name].length > 0;
        const bHasNotes = notes[b.project_name] && notes[b.project_name].length > 0;

        // 1. Proyek dengan Notes di atas
        if (aHasNotes && !bHasNotes) return -1;
        if (!aHasNotes && bHasNotes) return 1;

        // 2. Sort by Last Update Date (Latest First)
        const dateA = a.last_update_date ? new Date(a.last_update_date).getTime() : 0;
        const dateB = b.last_update_date ? new Date(b.last_update_date).getTime() : 0;
        return dateB - dateA;
    });
    // UPDATED: Limit menjadi 10
    return sorted.slice(0, 10);
  }, [filteredProjects, notes]); // Changed dependency to filteredProjects

  const uniqueOwners = useMemo(() => ['All', ...new Set(data.map(d => d.owner).filter(o => o && o.toLowerCase() !== 'owner').sort())], [data]);
  const uniquePics = useMemo(() => ['All', ...new Set(data.map(d => d.pic).filter(p => p && !p.toLowerCase().includes('pic utama') && !p.toLowerCase().includes('pic support')).sort())], [data]);
  const uniqueStatuses = useMemo(() => ['All', ...new Set(data.map(d => d.status).filter(s => s && !s.toLowerCase().includes('status')).sort())], [data]);
  const uniqueProgressStatuses = ['All', 'CRITICAL', 'OVERDUE', 'NEAR CRITICAL'];

  const menuItems = useMemo(() => {
    const base = [{ id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard }, { id: 'projects', label: 'List Pekerjaan', icon: FileText }];
    if (auth.role === 'admin') { base.push({ id: 'team', label: 'Load Tim (PIC)', icon: Users }); base.push({ id: 'owners', label: 'List Owner', icon: Building2 }); base.push({ id: 'settings', label: 'Master Settings', icon: Settings }); }
    return base;
  }, [auth.role]);

  // --- REUSABLE HEADER CELL ---
  const SortableHeader = ({ label, sortKey, currentSort, onSort, align="left", stickyLeft = false }) => (
      <th 
        className={`px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group text-${align} sticky top-0 z-20 bg-slate-50 shadow-sm ${stickyLeft ? 'left-0 z-30' : 'z-20'}`} 
        onClick={() => onSort(sortKey)}
      >
        <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
          {label}<ArrowUpDown size={12} className={`text-slate-300 ${currentSort.key === sortKey ? 'text-emerald-600' : 'group-hover:text-slate-400'}`} />
        </div>
      </th>
  );

  if (isAuthChecking) return null;
  if (!auth.isAuth) return <LoginScreen onLogin={handleLogin} currentPasswords={passwords} />;
  if (loading && !data.length) return <div className="h-screen w-full flex items-center justify-center bg-slate-50 text-slate-500 font-medium animate-pulse">Memuat Data...</div>;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden relative">
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col shadow-xl z-10 transition-all duration-300`}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2 text-white"><Briefcase className="text-emerald-400" /> Cost Control</h1>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{auth.role === 'admin' ? 'Administrator' : 'Guest Mode'}</p>
            </div>
          )}
           {isSidebarCollapsed && (
            <div className="w-full flex justify-center"><Briefcase className="text-emerald-400" /></div>
          )}
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors">
            {isSidebarCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-2">
          {menuItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => { setActiveTab(item.id); setActivePicFilter(null); }} 
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${activeTab === item.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'} ${isSidebarCollapsed ? 'justify-center' : ''}`}
              title={isSidebarCollapsed ? item.label : ''}
            >
                <item.icon size={20} />
                {!isSidebarCollapsed && <span className="font-medium text-sm capitalize">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 bg-slate-950 text-xs text-slate-500 border-t border-slate-800 space-y-3">
            {!isSidebarCollapsed && (
              <div>
                  <p className="font-semibold text-slate-400 mb-1">Last Sync:</p>
                  <p className="font-mono text-[10px] text-emerald-500">{lastSync ? lastSync.toLocaleString('id-ID') : '-'}</p>
              </div>
            )}
            <button onClick={handleLogout} className={`flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors w-full pt-2 ${!isSidebarCollapsed && 'border-t border-slate-800'} ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                <LogOut size={18} /> {!isSidebarCollapsed && 'Logout'}
            </button>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 z-10">
            <div>
                <h2 className="text-lg font-bold text-slate-800 capitalize">{activeTab.replace('_', ' ')} Overview</h2>
                {activePicFilter && <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit mt-1">Filtering: {activePicFilter} <button onClick={() => setActivePicFilter(null)}><X size={10}/></button></span>}
            </div>
            <div className="flex items-center gap-4">
                <button onClick={() => fetchData(true)} className={`p-2 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-full transition-all ${refreshing ? 'animate-spin text-emerald-600' : ''}`} title="Refresh Data"><RefreshCw size={18} /></button>
                <div className="relative group hidden sm:block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-full text-sm focus:bg-white focus:border-emerald-500 w-64 outline-none transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
                <button onClick={handleLogout} className="md:hidden text-slate-400"><LogOut size={18}/></button>
            </div>
        </header>

        <div className="flex-1 overflow-auto p-6 bg-slate-50/50 pb-24 md:pb-6">
            {/* KPI CARDS */}
            {(activeTab === 'dashboard' || activeTab === 'team') && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <KPICard title="Total Barecost" value={formatCompactCurrency(stats.totalBarecost)} icon={Wallet} colorClass="border-slate-500" />
                <KPICard title="Total Penawaran" value={formatCompactCurrency(stats.totalPenawaran)} icon={DollarSign} colorClass="border-emerald-500" subtext={<span className="text-emerald-600">Avg GPM: {formatPercent(stats.avgGPMOffer)}</span>} />
                <KPICard title="Total Kontrak" value={formatCompactCurrency(stats.totalKontrak)} icon={TrendingUp} colorClass="border-blue-500" subtext={<span className="text-blue-600">Avg GPM: {formatPercent(stats.avgGPMContract)}</span>} />
                <Card className={`p-4 border-l-4 ${stats.countCritical > 0 || stats.countOverdue > 0 ? 'border-l-red-500' : 'border-l-emerald-500'} flex flex-col justify-between h-full`}>
                    <div className="flex justify-between items-start mb-2"><div><p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Proyek</p><h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.totalProjects}</h3></div><div className={`p-3 bg-slate-50 rounded-xl ${stats.countCritical > 0 || stats.countOverdue > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{stats.countCritical > 0 || stats.countOverdue > 0 ? <AlertCircle size={24}/> : <CheckCircle2 size={24}/>}</div></div>
                    <div className="mt-auto pt-3 border-t border-slate-50 text-xs flex flex-col gap-1.5">
                        <div className="flex gap-2 justify-between"><span className="text-blue-600 font-bold">{stats.ongoingProjects} Ongoing</span><span className="text-slate-300">|</span><span className="text-emerald-600 font-bold">{stats.doneProjects} Done</span></div>
                        <div className="flex gap-2 justify-between border-t border-slate-100 pt-1.5 mt-1">
                            <span className="text-red-900 font-bold">{stats.countOverdue} Overdue</span><span className="text-red-600 font-bold">{stats.countCritical} Critical</span><span className="text-amber-600 font-bold">{stats.countNearCritical} Near</span>
                        </div>
                    </div>
                </Card>
            </div>
            )}

            {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 p-6">
                        <div className="flex justify-between items-center mb-6"><div><h3 className="font-bold text-lg text-slate-800">Analisa Profitabilitas (Avg GPM %)</h3><p className="text-xs text-slate-400 mt-1">{profitViewMode === 'owner' ? "By Owner (Weighted Avg)" : "By PIC (Weighted Avg)"}</p></div><div className="flex gap-2 bg-slate-100 p-1 rounded-lg">{auth.role === 'admin' && <button onClick={() => setProfitViewMode('pic')} className={`text-xs px-3 py-1.5 rounded-md font-bold flex items-center gap-2 transition-all ${profitViewMode === 'pic' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Users size={14} /> By PIC</button>}<button onClick={() => setProfitViewMode('owner')} className={`text-xs px-3 py-1.5 rounded-md font-bold flex items-center gap-2 transition-all ${profitViewMode === 'owner' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Building2 size={14} /> By Owner</button></div></div>
                        <div className="h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={profitData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" /><XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748B', fontWeight: 'bold'}} tickFormatter={(val) => val && val.length > 8 ? val.substring(0, 6) + '...' : val} /><YAxis tickFormatter={(val) => `${val.toFixed(0)}%`} tick={{fontSize: 12, fill: '#64748B'}} /><Tooltip formatter={(val) => `${val.toFixed(1)}%`} /><Bar dataKey="gpm_offer_pct" name="GPM Penawaran" fill="#10B981" radius={[4, 4, 0, 0]} /><Bar dataKey="gpm_contract_pct" name="GPM Kontrak" fill="#3B82F6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
                    </Card>
                    <Card className="p-6">
                        <h3 className="font-bold text-lg text-slate-800 mb-6 text-center">Status Proyek (Nominal)</h3>
                        <div className="h-72 flex items-center justify-center"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} cx="50%" cy="50%" innerRadius={75} outerRadius={105} paddingAngle={2} dataKey="value" label={renderCustomizedLabel} labelLine={false}>{statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /><Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '11px', paddingTop: '20px'}} layout="horizontal" /></PieChart></ResponsiveContainer></div>
                    </Card>
                    <Card className="lg:col-span-3 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white"><h3 className="font-bold text-slate-700">Update Proyek Terbaru</h3><button onClick={() => setActiveTab('projects')} className="text-emerald-600 text-sm font-medium hover:text-emerald-700 flex items-center gap-1">Lihat Semua <ChevronRight size={16}/></button></div>
                        <div className="overflow-x-auto"><table className="w-full text-sm text-left text-slate-600"><thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
                            <tr>
                                <th className="px-6 py-4 sticky top-0 z-20 bg-slate-50 shadow-sm text-left">Nama Pekerjaan</th>
                                <th className="px-6 py-4 sticky top-0 z-20 bg-slate-50 shadow-sm text-left">PIC</th>
                                <th className="px-6 py-4 sticky top-0 z-20 bg-slate-50 shadow-sm text-right">Barecost</th>
                                <th className="px-6 py-4 sticky top-0 z-20 bg-slate-50 shadow-sm text-right">Penawaran</th>
                                <th className="px-6 py-4 sticky top-0 z-20 bg-slate-50 shadow-sm text-center">Status</th>
                                <th className="px-6 py-4 sticky top-0 z-20 bg-slate-50 shadow-sm text-center">Last Update</th>
                                <th className="px-6 py-4 text-center sticky top-0 z-20 bg-slate-50 shadow-sm">Action</th>
                            </tr>
                            </thead><tbody className="divide-y divide-slate-100">
                                {dashboardProjects.map(project => ( 
                                <tr key={project.id} className="hover:bg-slate-50/80 transition-colors group border-b border-slate-50 last:border-0">
                                    <td className="px-6 py-4 font-medium text-slate-700 align-top sticky left-0 z-10 bg-white group-hover:bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                        <span className="block whitespace-normal leading-snug min-w-[200px] max-w-[300px] text-sm" title={project.project_name}>{project.project_name}</span>
                                        <div className="flex flex-wrap items-center mt-1">
                                            <div className="text-xs text-slate-400 font-normal flex items-center gap-1"><Building2 size={12} /> {project.owner} {project.department ? `- ${project.department}` : ''}</div>
                                            <StatusProgressLabel text={project.specific_status} />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm align-top pt-4 whitespace-nowrap">{project.pic}</td>
                                    <td className="px-6 py-4 text-right font-mono text-sm text-slate-500 align-top pt-4 whitespace-nowrap">{formatCurrency(project.barecost)}</td>
                                    <td className="px-6 py-4 text-right font-mono text-sm text-slate-700 align-top pt-4 whitespace-nowrap">{formatCurrency(project.penawaran)}</td>
                                    <td className="px-6 py-4 text-center align-top pt-4"><Badge status={project.status} /></td>
                                    <td className="px-6 py-4 text-center text-sm text-slate-500 align-top pt-4">{formatDate(project.last_update_date)}</td>
                                    <td className="px-6 py-4 text-center align-top pt-4">
                                        <button onClick={() => setSelectedProjectForNotes(project)} className={`p-2 rounded-full transition-all relative ${notes[project.project_name]?.length > 0 ? 'text-emerald-500 bg-emerald-50' : 'text-slate-300 hover:text-emerald-500 hover:bg-slate-100'}`} title="Lihat Notes">
                                            <FileText size={18} />{notes[project.project_name]?.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
                                        </button>
                                    </td>
                                </tr>
                                ))}
                            </tbody></table></div>
                    </Card>
                </div>
            )}

            {/* 3. TEAM LOAD TAB */}
            {activeTab === 'team' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-6">
                        <h3 className="font-bold text-slate-700 mb-6 flex justify-between items-center"><span>Beban per PIC</span><div className="flex bg-slate-100 rounded-lg p-1 gap-1">{['total', 'active', 'done'].map(m => (<button key={m} onClick={() => setLoadChartMetric(m)} className={`text-[10px] px-2 py-1 rounded capitalize ${loadChartMetric === m ? 'bg-white shadow text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-700'}`}>{m}</button>))}</div></h3>
                        <div className="h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={loadByPic} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}><XAxis type="number" tick={{ fontSize: 12 }} /><YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fontWeight: 'bold' }} /><Tooltip /><Bar dataKey={loadChartMetric === 'total' ? 'count' : loadChartMetric === 'active' ? 'activeCount' : 'doneCount'} fill="#8B5CF6" radius={[0,4,4,0]} barSize={24} /></BarChart></ResponsiveContainer></div>
                    </Card>
                    <Card className="flex flex-col h-[500px]">
                        <div className="p-6 border-b border-slate-100 bg-white z-10 sticky top-0 rounded-t-xl"><div className="flex justify-between items-center"><h3 className="font-bold text-slate-700">Status PIC</h3><div className="relative"><button onClick={() => setShowLoadSettings(!showLoadSettings)} className="text-slate-400 hover:text-slate-600"><Settings size={16}/></button>{showLoadSettings && (<div className="absolute right-0 top-6 bg-white shadow-xl border border-slate-200 p-4 rounded-lg w-64 z-20"><h4 className="text-xs font-bold mb-3">Load Limit Settings</h4><div className="space-y-3"><div><label className="text-[10px] text-slate-500 block">Min Ongoing %</label><input type="range" min="1" max="100" value={loadSettings.ongoingUnder} onChange={(e) => updateLoadThresholds('ongoingUnder', e.target.value)} className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"/><div className="text-right text-[9px]">{loadSettings.ongoingUnder}%</div></div><div><label className="text-[10px] text-slate-500 block">Max Ongoing %</label><input type="range" min="100" max="300" value={loadSettings.ongoingOver} onChange={(e) => updateLoadThresholds('ongoingOver', e.target.value)} className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"/><div className="text-right text-[9px]">{loadSettings.ongoingOver}%</div></div><div><label className="text-[10px] text-slate-500 block">Min Total %</label><input type="range" min="1" max="100" value={loadSettings.totalUnder} onChange={(e) => updateLoadThresholds('totalUnder', e.target.value)} className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"/><div className="text-right text-[9px]">{loadSettings.totalUnder}%</div></div><div><label className="text-[10px] text-slate-500 block">Max Total %</label><input type="range" min="100" max="300" value={loadSettings.totalOver} onChange={(e) => updateLoadThresholds('totalOver', e.target.value)} className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"/><div className="text-right text-[9px]">{loadSettings.totalOver}%</div></div></div></div>)}</div></div></div>
                        <div className="overflow-y-auto flex-1 p-6 space-y-3 pt-0">
                            {loadByPic.map((pic, idx) => (
                                <div key={idx} onClick={() => handlePicClick(pic.name)} className={`p-4 rounded-lg border cursor-pointer transition-all ${activePicFilter === pic.name ? 'bg-violet-50 border-violet-400' : 'bg-slate-50 hover:bg-slate-100 border-slate-100'}`}>
                                    <div className="flex justify-between items-start">
                                        <div><p className="font-bold text-slate-800">{pic.name}</p><div className="flex gap-2 text-[10px] font-bold mt-1"><span className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 uppercase">Total {pic.count}</span><LoadBadge status={pic.statusText} /></div><div className="flex gap-2 text-[10px] text-slate-500 mt-2 font-medium"><span className="text-blue-600">ONGOING {pic.activeCount}</span><span className="text-slate-300">|</span><span className="text-emerald-600">DONE {pic.doneCount}</span><span className="text-slate-300">|</span><span className="text-indigo-600 font-semibold">SUP {pic.supportCount}</span></div></div>
                                        <span className="text-2xl font-black text-violet-600 opacity-80">{pic.count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}
            
            {/* 4. BREAKDOWN TEAM */}
            {activeTab === 'team' && (
                <div className="mt-8">
                     <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-slate-700">Breakdown Proyek {activePicFilter ? `(${activePicFilter})` : ''}</h3>{activePicFilter && <button onClick={() => setActivePicFilter(null)} className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-3 py-1 rounded-full bg-red-50">Reset Filter</button>}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredProjects.length === 0 ? <div className="col-span-full text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">Tidak ada proyek.</div> : filteredProjects.map(project => (
                            <Card key={project.id} className="p-4 border border-slate-200 hover:border-emerald-300 transition-colors group">
                                <div className="flex justify-between items-start mb-3"><Badge status={project.status} /><div className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-bold">{project.department || "N/A"}</div></div>
                                <h4 className="font-semibold text-sm text-slate-800 mb-2 leading-tight whitespace-normal min-h-[1.25em]" title={project.project_name}>{project.project_name}</h4>
                                <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-1 font-medium" title="PIC Utama"><Users size={12} className="text-blue-500" /> <span className="truncate">{project.pic}</span></div>
                                {project.pic_support && project.pic_support !== '-' && (<div className="flex items-start gap-1 text-[10px] text-slate-400 mb-2" title="PIC Support"><UserCheck size={12} className="text-indigo-400 mt-0.5" /> <span className="leading-tight">{project.pic_support}</span></div>)}
                                <p className="text-[11px] text-slate-500 mb-3 italic bg-slate-50 p-2 rounded border border-slate-100 line-clamp-3 min-h-[3em] max-h-24 overflow-y-auto">"{project.tindak_lanjut || "-"}"</p>
                                <div className="flex items-end justify-between pt-3 border-t border-slate-100"><div className="text-[10px] text-slate-500 flex flex-col gap-0.5"><div className="font-mono mb-0.5">BC: {formatCompactCurrency(project.barecost)}</div><div className="font-mono text-slate-700">Offer: {formatCompactCurrency(project.penawaran)}</div><div className="font-mono text-blue-700">Cont: {formatCompactCurrency(project.kontrak)}</div></div><div className="text-right text-[10px] font-bold"><div className="text-emerald-600">GPM Offer: {formatPercent(project.gpm_offer_pct)}</div><div className="text-blue-600">GPM Cont: {formatPercent(project.gpm_contract_pct)}</div></div></div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* 5. PROJECTS LIST TAB */}
            {activeTab === 'projects' && (
                <div className="space-y-6">
                    <Card className="overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 items-center"><div className="flex items-center gap-2 mr-2"><Filter size={16} className="text-slate-400" /><span className="text-xs font-semibold text-slate-600">Filters:</span></div>{['Owner', 'PIC', 'Status', 'Status Progress'].map(filterType => { 
                                const val = filterType === 'Owner' ? filterOwner : filterType === 'PIC' ? filterPic : filterType === 'Status' ? filterStatus : filterProgressStatus; 
                                const setVal = filterType === 'Owner' ? setFilterOwner : filterType === 'PIC' ? setFilterPic : filterType === 'Status' ? setFilterStatus : setFilterProgressStatus; 
                                const opts = filterType === 'Owner' ? uniqueOwners : filterType === 'PIC' ? uniquePics : filterType === 'Status' ? uniqueStatuses : uniqueProgressStatuses; 
                                return (<div key={filterType} className="flex items-center gap-2"><span className="text-xs text-slate-500">{filterType}:</span><select className="text-xs border border-slate-200 rounded px-2 py-1 focus:outline-emerald-500 bg-white" value={val} onChange={(e) => setVal(e.target.value)}>{opts.map(o => <option key={o} value={o}>{o}</option>)}</select></div>); 
                            })}
                            {(filterOwner !== 'All' || filterPic !== 'All' || filterStatus !== 'All' || filterProgressStatus !== 'All') && <button onClick={() => { setFilterOwner('All'); setFilterPic('All'); setFilterStatus('All'); setFilterProgressStatus('All'); }} className="text-xs text-red-500 hover:text-red-700 ml-auto border border-red-200 px-2 py-0.5 rounded bg-white">Reset</button>}</div>
                        <div className="overflow-x-auto">
                            <div className="max-h-[70vh] overflow-auto">
                                <table className="w-full text-sm text-left text-slate-600 relative">
                                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] tracking-wider z-20">
                                        <tr>
                                            <SortableHeader label="Nama Pekerjaan" sortKey="project_name" currentSort={sortConfig} onSort={requestSort} stickyLeft={true} /><SortableHeader label="PIC" sortKey="pic" currentSort={sortConfig} onSort={requestSort}/><SortableHeader label="Barecost" sortKey="barecost" currentSort={sortConfig} onSort={requestSort} align="right"/><SortableHeader label="Penawaran" sortKey="penawaran" currentSort={sortConfig} onSort={requestSort} align="right"/><SortableHeader label="Kontrak" sortKey="kontrak" currentSort={sortConfig} onSort={requestSort} align="right"/><SortableHeader label="GPM Offer" sortKey="gpm_offer_pct" currentSort={sortConfig} onSort={requestSort} align="right"/><SortableHeader label="GPM Cont" sortKey="gpm_contract_pct" currentSort={sortConfig} onSort={requestSort} align="right"/><SortableHeader label="Update" sortKey="last_update_date" currentSort={sortConfig} onSort={requestSort} align="center"/><SortableHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={requestSort} align="center"/><th className="px-6 py-4 text-center sticky top-0 z-20 bg-slate-50 shadow-sm">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">{activeProjectsList.map(project => <ProjectRow key={project.id} project={project} setSelectedProjectForNotes={setSelectedProjectForNotes} notes={notes} />)}</tbody>
                                </table>
                            </div>
                        </div>
                    </Card>
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                        <button onClick={() => setIsDoneListOpen(!isDoneListOpen)} className="w-full flex items-center justify-between p-4 bg-slate-100 hover:bg-slate-200 transition-colors"><div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-500" /><span className="font-bold text-slate-700 text-xs">Pekerjaan Selesai</span></div>{isDoneListOpen ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}</button>
                        {isDoneListOpen && (
                            <div className="overflow-x-auto border-t border-slate-100">
                                <div className="max-h-[70vh] overflow-auto">
                                    <table className="w-full text-sm text-left text-slate-600 relative">
                                        <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] tracking-wider z-20">
                                            <tr>
                                                <SortableHeader label="Nama Pekerjaan" sortKey="project_name" currentSort={sortConfig} onSort={requestSort} stickyLeft={true} />
                                                <SortableHeader label="PIC" sortKey="pic" currentSort={sortConfig} onSort={requestSort} />
                                                <SortableHeader label="Barecost" sortKey="barecost" currentSort={sortConfig} onSort={requestSort} align="right" />
                                                <SortableHeader label="Penawaran" sortKey="penawaran" currentSort={sortConfig} onSort={requestSort} align="right" />
                                                <SortableHeader label="Kontrak" sortKey="kontrak" currentSort={sortConfig} onSort={requestSort} align="right" />
                                                <SortableHeader label="GPM Offer" sortKey="gpm_offer_pct" currentSort={sortConfig} onSort={requestSort} align="right" />
                                                <SortableHeader label="GPM Cont" sortKey="gpm_contract_pct" currentSort={sortConfig} onSort={requestSort} align="right" />
                                                <SortableHeader label="Update" sortKey="last_update_date" currentSort={sortConfig} onSort={requestSort} align="center" />
                                                <SortableHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={requestSort} align="center" />
                                                <th className="px-6 py-4 text-center sticky top-0 z-20 bg-slate-50 shadow-sm">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-slate-50/20">{doneProjectsList.map(project => <ProjectRow key={project.id} project={project} setSelectedProjectForNotes={setSelectedProjectForNotes} notes={notes} />)}</tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {/* 6. OWNERS LIST TAB */}
            {activeTab === 'owners' && (
                <Card className="overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white"><h3 className="font-bold text-lg text-slate-700">List Owner & Portofolio</h3><div className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">Total {loadByOwner.length} Active Owners</div></div>
                    <div className="overflow-x-auto max-h-[70vh]">
                        <table className="w-full text-sm text-left text-slate-600 relative">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs tracking-wider z-20">
                                <tr>
                                    <th className="px-6 py-4 w-12 text-center sticky top-0 bg-slate-50 shadow-sm">No</th>
                                    <th className="px-6 py-4 sticky top-0 bg-slate-50 shadow-sm">Nama Owner</th>
                                    <th className="px-6 py-4 text-center sticky top-0 bg-slate-50 shadow-sm">Jumlah Proyek</th>
                                    <th className="px-6 py-4 text-right sticky top-0 bg-slate-50 shadow-sm">Total Nilai Penawaran</th>
                                    <th className="px-6 py-4 text-right sticky top-0 bg-slate-50 shadow-sm">Avg GPM Penawaran</th>
                                    <th className="px-6 py-4 text-right sticky top-0 bg-slate-50 shadow-sm">Avg GPM Kontrak</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loadByOwner.map((owner, idx) => { 
                                    const ownerProjects = data.filter(p => p.owner === owner.name); 
                                    const totalOwnerVal = ownerProjects.reduce((acc, curr) => acc + curr.penawaran, 0); 
                                    const totalOwnerGPMVal = ownerProjects.reduce((acc, curr) => acc + curr.gpm_offer_val, 0); 
                                    const avgOwnerGPM = totalOwnerVal > 0 ? (totalOwnerGPMVal / totalOwnerVal) * 100 : 0; 
                                    const totalOwnerContractVal = ownerProjects.reduce((acc, curr) => acc + curr.kontrak, 0); 
                                    const totalOwnerGPMContractVal = ownerProjects.reduce((acc, curr) => acc + curr.gpm_contract_val, 0); 
                                    const avgOwnerContractGPM = totalOwnerContractVal > 0 ? (totalOwnerGPMContractVal / totalOwnerContractVal) * 100 : 0; 
                                    return (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4 text-center text-sm text-slate-400">{idx + 1}</td>
                                            <td className="px-6 py-4 font-medium text-sm text-slate-700 flex items-center gap-2"><div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Building2 size={16}/></div>{owner.name}</td>
                                            <td className="px-6 py-4 text-center"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold text-sm">{owner.count}</span></td>
                                            <td className="px-6 py-4 text-right font-mono text-sm text-slate-700">{formatCurrency(owner.value)}</td>
                                            <td className="px-6 py-4 text-right"><span className={`font-bold text-sm ${avgOwnerGPM > 15 ? 'text-emerald-600' : 'text-slate-500'}`}>{formatPercent(avgOwnerGPM)}</span></td>
                                            <td className="px-6 py-4 text-right"><span className={`font-bold text-sm ${avgOwnerContractGPM > 15 ? 'text-blue-600' : 'text-slate-500'}`}>{formatPercent(avgOwnerContractGPM)}</span></td>
                                        </tr>
                                    ); 
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* 7. MASTER SETTINGS (ADMIN ONLY) */}
            {activeTab === 'settings' && auth.role === 'admin' && (
                <div className="max-w-2xl mx-auto mt-10">
                    <Card className="p-8">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100"><div className="bg-slate-100 p-3 rounded-full"><Key size={24} className="text-slate-700"/></div><div><h3 className="font-bold text-xl text-slate-800">Master Password Settings</h3><p className="text-sm text-slate-500">Kelola akses keamanan untuk dashboard</p></div></div>
                        <div className="space-y-6">
                            <div><label className="block text-sm font-bold text-slate-700 mb-2">Admin Password</label><input type="text" className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={adminPassInput} onChange={(e) => setAdminPassInput(e.target.value)} /><p className="text-[10px] text-slate-400 mt-1">Akses penuh ke semua fitur termasuk menu ini.</p></div>
                            <div><label className="block text-sm font-bold text-slate-700 mb-2">Guest Password</label><input type="text" className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" value={guestPassInput} onChange={(e) => setGuestPassInput(e.target.value)} /><p className="text-[10px] text-slate-400 mt-1">Akses terbatas (Hanya Dashboard & List Project).</p></div>
                            <div className="pt-4 flex items-center justify-between"><span className="text-sm font-bold text-emerald-600">{passSaveStatus}</span><button onClick={handleSavePasswords} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center gap-2"><Save size={18}/> Simpan Perubahan</button></div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
        
        {/* Mobile Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-3 flex justify-around shadow-2xl z-50">{menuItems.filter(m => m.id !== 'settings').map(item => (<button key={item.id} onClick={() => { setActiveTab(item.id); setActivePicFilter(null); }} className={`flex flex-col items-center ${activeTab === item.id ? 'text-emerald-600' : 'text-slate-400'}`}><item.icon size={20} /><span className="text-[9px] font-bold uppercase mt-1">{item.id === 'team' ? 'Load' : item.id}</span></button>))}</div>
      </main>

      {/* Modal Notes */}
      {selectedProjectForNotes && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <div className="pr-8"><h3 className="font-bold text-slate-800 flex items-center gap-2">Notes & Tindak Lanjut</h3><p className="text-[11px] text-slate-500 mt-1 leading-tight">{selectedProjectForNotes.project_name}</p></div>
                    <button onClick={() => setSelectedProjectForNotes(null)} className="text-slate-400 p-1 hover:bg-slate-200 rounded-full flex-shrink-0"><X size={20} /></button>
                </div>
                <div className="p-4 h-[450px] overflow-y-auto space-y-4 bg-slate-50/50">
                    <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl shadow-sm">
                        <h4 className="text-xs font-black text-blue-700 mb-2 flex items-center gap-1 uppercase tracking-wider"><MessageSquare size={12}/> Update Terakhir</h4>
                        <div className="flex justify-between items-center text-[10px] mt-2 font-bold text-slate-500 uppercase"><span>{formatDate(selectedProjectForNotes.last_update_date)}</span><Badge status={selectedProjectForNotes.status} /></div>
                        <p className="text-sm text-slate-700 italic mt-2 leading-relaxed bg-white/50 p-2 rounded border border-blue-50 whitespace-pre-wrap">{selectedProjectForNotes.tindak_lanjut || "Tidak ada catatan"}</p>
                    </div>
                    <div className="border-t border-slate-200 my-2 relative"><span className="absolute -top-2.5 left-4 bg-slate-50 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Manual History</span></div>
                    {(!notes[selectedProjectForNotes.project_name] || notes[selectedProjectForNotes.project_name].length === 0) ? (
                        <div className="text-center text-slate-300 py-8"><FileText size={48} className="mx-auto opacity-10 mb-2"/><p className="text-xs font-bold uppercase tracking-widest">Belum ada history</p></div>
                    ) : (
                        notes[selectedProjectForNotes.project_name].map((note) => (
                            <div key={note.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm group hover:border-emerald-200 transition-all">
                                <div className="flex justify-between items-start mb-1 text-[9px] text-slate-400 font-bold">
                                    <span>{note.time}</span>
                                    {auth.role === 'admin' && (
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => startEditingNote(note)} className="text-slate-400 hover:text-blue-500 p-1"><Edit2 size={12} /></button>
                                            <button onClick={() => handleDeleteNote(note.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={12} /></button>
                                        </div>
                                    )}
                                </div>
                                {editingNoteId === note.id ? (
                                    <div className="flex gap-2"><input type="text" className="flex-1 text-sm border-b-2 border-blue-400 outline-none p-1" value={editingText} onChange={(e) => setEditingText(e.target.value)} autoFocus /><button onClick={() => saveEditedNote(note.id)}><Save size={16} className="text-emerald-600"/></button></div>
                                ) : (
                                    <p className="text-sm text-slate-700 leading-relaxed">{note.text}</p>
                                )}
                            </div>
                        ))
                    )}
                </div>
                <div className="p-4 border-t bg-white">
                    <div className="flex gap-2">
                        <input type="text" className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-inner" placeholder="Tulis update tambahan..." value={newNote} onChange={(e) => setNewNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddNote()} />
                        <button onClick={handleAddNote} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-200 flex items-center gap-2"><Plus size={18} /> ADD</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}