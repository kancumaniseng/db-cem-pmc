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
  BarChart2,
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

// --- KONFIGURASI & KONSTANTA ---

const LOAD_LIMITS = {
    LOW: 2,   
    HIGH: 6
};

// Warna Kontras untuk Pie Chart (12 Variasi)
const COLORS = [
  '#2563EB', // Blue 600 (Primary)
  '#DC2626', // Red 600
  '#059669', // Emerald 600
  '#D97706', // Amber 600
  '#7C3AED', // Violet 600
  '#DB2777', // Pink 600
  '#0891B2', // Cyan 600
  '#4F46E5', // Indigo 600
  '#65A30D', // Lime 600
  '#9333EA', // Purple 600
  '#EA580C', // Orange 600
  '#0D9488', // Teal 600
  '#64748B'  // Slate 500 (Fallback)
];

// --- FUNGSI PEMBANTU (FORMATTER) ---

const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

const formatCompactCurrency = (val) => {
  if (val >= 1000000000000) return `Rp ${(val / 1000000000000).toFixed(2)} T`;
  if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(2)} M`;
  if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(2)} jt`;
  return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
};

const formatPercent = (val) => `${(val || 0).toFixed(1)}%`;

const formatDate = (date) => {
  if (!date) return '-';
  if (!(date instanceof Date)) {
    const d = new Date(date);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: '2-digit'});
  }
  return date.toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: '2-digit'});
};

// Custom Label Pie Chart (Menampilkan Angka Nominal)
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  // Hanya tampilkan jika irisan > 1%
  if (percent < 0.01) return null;

  return (
    <text x={x} y={y} fill="#1e293b" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fontWeight="bold" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.5)' }}>
      {value}
    </text>
  );
};

// --- KOMPONEN UI ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 relative ${className}`}>
    {children}
  </div>
);

const Badge = ({ status }) => {
  const st = (status || "").toLowerCase().trim();
  let style = "bg-slate-100 text-slate-700 border-slate-200";
  
  if (st.includes("on track") || st.includes("sesuai") || st.includes("lancar") || st.includes("menang") || st.includes("win")) {
    style = "bg-emerald-100 text-emerald-700 border-emerald-200";
  } else if (st.includes("delayed") || st.includes("terlambat") || st.includes("kurang") || st.includes("lost") || st.includes("kalah") || st.includes("overdue")) {
    style = "bg-red-100 text-red-700 border-red-200";
  } else if (st.includes("risk") || st.includes("kritis") || st.includes("pending") || st.includes("tunggu") || st.includes("critical") || st.includes("budgetary") || st.includes("prebid")) {
    style = "bg-amber-100 text-amber-700 border-amber-200";
  } else if (st.includes("completed") || st.includes("selesai") || st.includes("finish") || st.includes("done")) {
    style = "bg-blue-100 text-blue-700 border-blue-200";
  }

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold border ${style} whitespace-nowrap`}>
      {status || "-"}
    </span>
  );
};

const LoadBadge = ({ count, lowLimit, highLimit }) => {
    let color = "bg-emerald-100 text-emerald-700";
    let text = "IDEAL";
    
    if (count > highLimit) {
        color = "bg-red-100 text-red-700";
        text = "OVERLOAD";
    } else if (count === 0) {
        color = "bg-slate-100 text-slate-600";
        text = "IDLE";
    } else if (count < lowLimit) {
        color = "bg-blue-100 text-blue-700";
        text = "UNDERLOAD";
    }

    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${color}`}>
            {text}
        </span>
    );
};

const KPICard = ({ title, value, subtext, icon: Icon, colorClass }) => (
    <Card className={`p-4 border-l-4 ${colorClass} flex flex-col justify-between h-full`}>
        <div className="flex justify-between items-start mb-2">
            <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{title}</p>
                <h3 className="text-lg font-bold text-slate-800 mt-1">{value}</h3>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                <Icon size={18} />
            </div>
        </div>
        {subtext && <div className="mt-auto pt-2 border-t border-slate-50 text-[10px] font-medium">{subtext}</div>}
    </Card>
);

// Komponen Baris Tabel (Reusable)
const ProjectRow = ({ project, setSelectedProjectForNotes, notes }) => (
    <tr className="hover:bg-slate-50/80 transition-colors group border-b border-slate-50 last:border-0">
        <td className="px-6 py-4 font-medium text-slate-700 align-top">
            <span className="block whitespace-normal leading-snug min-w-[200px]" title={project.project_name}>
                {project.project_name}
            </span>
            <div className="text-[10px] text-slate-400 font-normal mt-1 flex items-center gap-1">
                <Building2 size={10} /> {project.owner}
            </div>
        </td>
        <td className="px-6 py-4 text-xs align-top pt-4 whitespace-nowrap">{project.pic}</td>
        <td className="px-6 py-4 text-right font-mono text-xs text-slate-500 align-top pt-4 whitespace-nowrap">{formatCurrency(project.barecost)}</td>
        <td className="px-6 py-4 text-right font-mono text-xs text-slate-700 align-top pt-4 whitespace-nowrap">{formatCurrency(project.penawaran)}</td>
        <td className="px-6 py-4 text-right font-mono text-xs text-emerald-600 font-bold align-top pt-4">{formatPercent(project.gpm_offer_pct)}</td>
        <td className="px-6 py-4 text-center text-xs text-slate-500 align-top pt-4">{formatDate(project.last_update_date)}</td>
        <td className="px-6 py-4 text-center align-top pt-4"><Badge status={project.status} /></td>
        <td className="px-6 py-4 text-center align-top pt-4">
            <button 
                onClick={() => setSelectedProjectForNotes(project)}
                className={`p-2 rounded-full transition-all relative ${notes[project.project_name]?.length > 0 ? 'text-emerald-500 bg-emerald-50' : 'text-slate-300 hover:text-emerald-500 hover:bg-slate-100'}`}
                title="Lihat Notes"
            >
                <FileText size={16} />
                {notes[project.project_name]?.length > 0 && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>}
            </button>
        </td>
    </tr>
);

// --- KOMPONEN UTAMA (APP) ---

const MOCK_DATA = [{ id: 1, project_name: "Contoh Proyek (Mock)", owner: "PT Mock", pic: "Admin", barecost: 100, penawaran: 120, gpm_offer_pct: 20, gpm_contract_pct: 0, status: "On Track", progress: 50, last_update_date: new Date() }];

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSync, setLastSync] = useState(null); 
  
  // Filters & Sort
  const [filterOwner, setFilterOwner] = useState('All');
  const [filterPic, setFilterPic] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'last_update_date', direction: 'desc' });

  // Team Load Settings
  const [loadSettings, setLoadSettings] = useState({ lowPct: 10, highPct: 30 }); 
  const [showLoadSettings, setShowLoadSettings] = useState(false);
  const [activePicFilter, setActivePicFilter] = useState(null);
  const [loadChartMetric, setLoadChartMetric] = useState('total');

  // Project List View Settings
  const [isDoneListOpen, setIsDoneListOpen] = useState(false);

  // Profitability Chart Settings
  const [showAllProfitability, setShowAllProfitability] = useState(false);
  const [profitViewMode, setProfitViewMode] = useState('pic'); 
  
  // Notes State
  const [selectedProjectForNotes, setSelectedProjectForNotes] = useState(null);
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('cost_dashboard_notes_v8');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingText, setEditingText] = useState("");

  // --- Data Fetching ---
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch(`https://docs.google.com/spreadsheets/d/e/2PACX-1vSE4iCfy-ul3AvvtRn8crrMl-U8XTbcFQBdXSYTsEeMsUOfrzrmPH451fngepPaiT0wJ2RU11su9FD5/pub?output=csv&t=${Date.now()}`);
      
      if (!response.ok) throw new Error("Gagal mengambil data");
      
      const csvText = await response.text();
      const allRows = csvText.split(/\r\n|\n|\r/);
      
      if (allRows.length > 3) {
          const dataRows = allRows.slice(3); 
          
          const parsedData = dataRows.map((row, index) => {
              let columns = [];
              let inQuote = false;
              let currentVal = '';
              for (let i = 0; i < row.length; i++) {
                  let char = row[i];
                  if (char === '"') { inQuote = !inQuote; continue; }
                  if (char === ',' && !inQuote) {
                      columns.push(currentVal);
                      currentVal = '';
                  } else {
                      currentVal += char;
                  }
              }
              columns.push(currentVal);

              if (!columns[1] || columns[1].trim() === "") return null;
              
              const clean = (val) => val ? val.trim().replace(/^"|"$/g, '') : "";
              if (clean(columns[1]).toLowerCase().includes('total') || clean(columns[1]).toLowerCase().includes('jumlah')) return null;

              const parseMoney = (val) => {
                  if (!val) return 0;
                  let cleanStr = val.replace(/Rp|rp|\s/g, ''); 
                  if (cleanStr.includes('.') && cleanStr.includes(',')) {
                       cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
                  } else if (cleanStr.match(/\.\d{3}/) && !cleanStr.includes(',')) {
                       cleanStr = cleanStr.replace(/\./g, '');
                  } else if (cleanStr.includes(',')) {
                       cleanStr = cleanStr.replace(/,/g, '');
                  }
                  return parseFloat(cleanStr) || 0;
              };

              const colProgressText = clean(columns[9]);
              let progressVal = 0;
              const pctMatch = colProgressText.match(/(\d+(?:[.,]\d+)?)%/);
              if (pctMatch) {
                  progressVal = parseFloat(pctMatch[1].replace(',', '.'));
              } else {
                  const backupProgress = parseFloat(clean(columns[13]).replace(/%|,/g, ''));
                  if (!isNaN(backupProgress)) {
                       progressVal = (backupProgress <= 1 && backupProgress > 0) ? backupProgress * 100 : backupProgress;
                  }
              }

              const parseDateFromText = (text) => {
                  if (!text) return null;
                  let match = text.trim().match(/^(\d{2})[\.\-\/](\d{2})[\.\-\/](\d{2,4})/);
                  if (!match) match = text.trim().match(/^(\d{2})(\d{2})(\d{2})/);
                  if (match) {
                      const day = parseInt(match[1]);
                      const month = parseInt(match[2]) - 1; 
                      let year = parseInt(match[3]);
                      if (year < 100) year += 2000;
                      return new Date(year, month, day);
                  }
                  return null;
              };

              const lastUpdateDate = parseDateFromText(colProgressText);

              let rawStatus = clean(columns[8]); 
              if (!rawStatus || rawStatus === "-") {
                   if (progressVal >= 100) rawStatus = "Completed";
                   else if (progressVal > 0) rawStatus = "In Progress";
                   else rawStatus = "Planned";
              }

              const barecost = parseMoney(columns[15]); 
              const penawaran = parseMoney(columns[16]); 
              const kontrak = parseMoney(columns[17]); 
              
              let gpm_offer_raw = parseMoney(columns[21]); 
              let gpm_contract_raw = parseMoney(columns[22]); 
              let gpm_offer_pct = (gpm_offer_raw > 100 && penawaran > 0) ? (gpm_offer_raw/penawaran)*100 : (gpm_offer_raw <= 1 ? gpm_offer_raw*100 : gpm_offer_raw);
              let gpm_contract_pct = (gpm_contract_raw > 100 && kontrak > 0) ? (gpm_contract_raw/kontrak)*100 : (gpm_contract_raw <= 1 ? gpm_contract_raw*100 : gpm_contract_raw);

              return {
                  id: index,
                  project_name: clean(columns[1]), 
                  department: clean(columns[2]),
                  owner: clean(columns[3]) || "General",
                  pic: clean(columns[4]),
                  progress: progressVal,
                  tindak_lanjut: colProgressText,
                  last_update_date: lastUpdateDate,
                  status: rawStatus,
                  barecost: barecost,
                  penawaran: penawaran,
                  kontrak: kontrak,
                  gpm_offer_val: (gpm_offer_pct/100) * penawaran,
                  gpm_contract_val: (gpm_contract_pct/100) * kontrak,
                  gpm_offer_pct: gpm_offer_pct || 0,
                  gpm_contract_pct: gpm_contract_pct || 0,
              };
          }).filter(item => item !== null && item.project_name);
          
          setData(parsedData);
      } else {
          setData(MOCK_DATA);
      }
      setLastSync(new Date()); 
    } catch (error) {
      console.error("Error:", error);
      if (data.length === 0) setData(MOCK_DATA);
      setLastSync(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Helper Notes ---
  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const timestamp = new Date().toLocaleString('id-ID');
    const projectKey = selectedProjectForNotes.project_name;
    const projectNotes = notes[projectKey] || [];
    
    const updatedNotes = {
      ...notes,
      [projectKey]: [...projectNotes, { id: Date.now(), text: newNote, time: timestamp }]
    };
    setNotes(updatedNotes);
    localStorage.setItem('cost_dashboard_notes_v8', JSON.stringify(updatedNotes));
    setNewNote("");
  };

  const handleDeleteNote = (noteId) => {
    const projectKey = selectedProjectForNotes.project_name;
    const projectNotes = notes[projectKey].filter(n => n.id !== noteId);
    const updatedNotes = { ...notes, [projectKey]: projectNotes };
    setNotes(updatedNotes);
    localStorage.setItem('cost_dashboard_notes_v8', JSON.stringify(updatedNotes));
  };

  const saveEditedNote = (noteId) => {
      const projectKey = selectedProjectForNotes.project_name;
      const projectNotes = notes[projectKey].map(n => {
          if (n.id === noteId) return { ...n, text: editingText };
          return n;
      });
      const updatedNotes = { ...notes, [projectKey]: projectNotes };
      setNotes(updatedNotes);
      localStorage.setItem('cost_dashboard_notes_v8', JSON.stringify(updatedNotes));
      setEditingNoteId(null);
  };

  // --- Kalkulasi Statistik ---
  const stats = useMemo(() => {
    const totalProjects = data.length;
    const totalBarecost = data.reduce((acc, curr) => acc + curr.barecost, 0);
    const totalPenawaran = data.reduce((acc, curr) => acc + curr.penawaran, 0);
    const totalKontrak = data.reduce((acc, curr) => acc + curr.kontrak, 0);
    
    const totalGVOffer = data.reduce((acc, curr) => acc + curr.gpm_offer_val, 0);
    const totalGVContract = data.reduce((acc, curr) => acc + curr.gpm_contract_val, 0);

    const avgGPMOffer = totalPenawaran > 0 ? (totalGVOffer / totalPenawaran) * 100 : 0;
    const avgGPMContract = totalKontrak > 0 ? (totalGVContract / totalKontrak) * 100 : 0;
    
    const criticalProjects = data.filter(d => (d.status || "").toLowerCase().includes('risk') || (d.status || "").toLowerCase().includes('kritis') || (d.status || "").toLowerCase().includes('critical')).length;
    const doneProjects = data.filter(p => {
        const s = (p.status || "").toLowerCase();
        return s.includes('completed') || s.includes('done') || s.includes('selesai') || p.progress >= 100;
    }).length;

    return { totalProjects, totalBarecost, totalPenawaran, totalKontrak, avgGPMOffer, avgGPMContract, criticalProjects, doneProjects, ongoingProjects: totalProjects - doneProjects };
  }, [data]);

  const dynamicLimits = useMemo(() => {
    const low = Math.floor(stats.totalProjects * (loadSettings.lowPct / 100));
    const high = Math.ceil(stats.totalProjects * (loadSettings.highPct / 100));
    return { low: low || LOAD_LIMITS.LOW, high: high || LOAD_LIMITS.HIGH };
  }, [stats.totalProjects, loadSettings]);

  // LoadByPic Logic (FILTER PIC UTAMA)
  const loadByPic = useMemo(() => {
    const load = {};
    data.forEach(p => {
        const picName = p.pic || "Unassigned";
        if (picName.toLowerCase().includes("pic utama") || picName.toLowerCase().includes("pic support")) return;

        const cleanName = picName.trim(); 
        const st = (p.status || "").toLowerCase();
        const isDone = st.includes('completed') || st.includes('done') || st.includes('selesai') || st.includes('finish') || p.progress >= 100;

        if (!load[cleanName]) load[cleanName] = { name: cleanName, count: 0, doneCount: 0, activeCount: 0 };
        load[cleanName].count += 1;
        if (isDone) load[cleanName].doneCount += 1;
        else load[cleanName].activeCount += 1;
    });
    return Object.values(load).sort((a, b) => b.count - a.count);
  }, [data]);

  const loadByOwner = useMemo(() => {
    const load = {};
    data.forEach(p => {
        const ownerName = p.owner || "Others";
        const cleanName = ownerName.trim();
        if (!load[cleanName]) load[cleanName] = { name: cleanName, count: 0, value: 0 };
        load[cleanName].count += 1;
        load[cleanName].value += p.penawaran;
    });
    return Object.values(load).sort((a, b) => b.value - a.value);
  }, [data]);

  const statusData = useMemo(() => {
      const statuses = {};
      data.forEach(p => {
          let st = (p.status || "Unknown").toUpperCase();
          if (st.includes("STATUS") || st === "") return;
          statuses[st] = (statuses[st] || 0) + 1;
      });
      return Object.keys(statuses)
        .map(key => ({ name: key, value: statuses[key] }))
        .sort((a, b) => b.value - a.value);
  }, [data]);

  const profitData = useMemo(() => {
      let filtered = showAllProfitability ? data : data.filter(d => (d.status || "").toLowerCase().includes('done') || d.progress === 100);
      const aggMap = {};
      const key = profitViewMode === 'owner' ? 'owner' : 'pic';
      
      filtered.forEach(p => {
          let name = p[key] || "Others";
          if (key === 'pic' && (name.toLowerCase().includes("pic utama") || name.toLowerCase().includes("pic support"))) return;

          if (!aggMap[name]) aggMap[name] = { name, offer: 0, contract: 0, gv_offer: 0, gv_contract: 0 };
          aggMap[name].offer += p.penawaran;
          aggMap[name].contract += p.kontrak;
          aggMap[name].gv_offer += (p.gpm_offer_pct/100)*p.penawaran; 
          aggMap[name].gv_contract += (p.gpm_contract_pct/100)*p.kontrak;
      });
      
      return Object.values(aggMap).map(o => ({
          name: o.name,
          gpm_offer_pct: o.offer > 0 ? (o.gv_offer/o.offer)*100 : 0,
          gpm_contract_pct: o.contract > 0 ? (o.gv_contract/o.contract)*100 : 0
      })).sort((a,b) => b.gpm_contract_pct - a.gpm_contract_pct).slice(0, 10);
  }, [data, showAllProfitability, profitViewMode]);

  const uniqueOwners = useMemo(() => ['All', ...new Set(data.map(d => d.owner).filter(Boolean).sort())], [data]);
  const uniquePics = useMemo(() => ['All', ...new Set(data.map(d => d.pic).filter(Boolean).sort())], [data]);
  const uniqueStatuses = useMemo(() => ['All', ...new Set(data.map(d => d.status).filter(Boolean).sort())], [data]);

  const filteredProjects = useMemo(() => {
    let filtered = data.filter(p => {
        const matchesSearch = (p.project_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (p.pic || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesOwner = filterOwner === 'All' || p.owner === filterOwner;
        const matchesPic = filterPic === 'All' || p.pic === filterPic;
        const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
        const matchesActivePic = !activePicFilter || p.pic === activePicFilter;
        return matchesSearch && matchesOwner && matchesPic && matchesStatus && matchesActivePic;
    });

    filtered.sort((a, b) => {
        let valA, valB;
        if (sortConfig.key === 'project_name') {
            valA = (a.project_name || "").toLowerCase();
            valB = (b.project_name || "").toLowerCase();
        } else if (sortConfig.key === 'last_update_date') {
            valA = a.last_update_date ? a.last_update_date.getTime() : 0;
            valB = b.last_update_date ? b.last_update_date.getTime() : 0;
        }
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });
    return filtered;
  }, [data, searchQuery, filterOwner, filterPic, filterStatus, activePicFilter, sortConfig]);

  const activeProjectsList = useMemo(() => filteredProjects.filter(p => {
      const s = (p.status || "").toLowerCase();
      return !s.includes('completed') && !s.includes('done') && !s.includes('selesai') && p.progress < 100;
  }), [filteredProjects]);

  const doneProjectsList = useMemo(() => filteredProjects.filter(p => {
      const s = (p.status || "").toLowerCase();
      return s.includes('completed') || s.includes('done') || s.includes('selesai') || p.progress >= 100;
  }), [filteredProjects]);

  const handleSort = (key) => {
      setSortConfig(current => ({
          key,
          direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
      }));
  };

  const handlePicClick = (picName) => {
      setActivePicFilter(activePicFilter === picName ? null : picName);
      if (activeTab !== 'team') setActiveTab('team');
  };

  if (loading) {
      return <div className="h-screen w-full flex items-center justify-center bg-slate-50 text-slate-500 font-medium animate-pulse">Memuat Data Cost Engineering...</div>;
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden relative">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col shadow-xl z-10">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold flex items-center gap-2 text-white">
            <Briefcase className="text-emerald-400" /> Cost Control
          </h1>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Project Monitoring</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {['dashboard', 'projects', 'team', 'owners'].map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setActivePicFilter(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === tab ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                {tab === 'dashboard' && <LayoutDashboard size={18} />}
                {tab === 'projects' && <FileText size={18} />}
                {tab === 'team' && <Users size={18} />}
                {tab === 'owners' && <Building2 size={18} />}
                <span className="font-medium text-sm capitalize">{tab === 'dashboard' ? 'Dashboard Utama' : tab === 'projects' ? 'List Pekerjaan' : tab === 'team' ? 'Load Tim (PIC)' : 'List Owner'}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 bg-slate-950 text-xs text-slate-500 border-t border-slate-800">
            <p className="font-semibold text-slate-400 mb-1">Last Sync:</p>
            <p className="font-mono text-[10px] text-emerald-500">{lastSync ? lastSync.toLocaleString('id-ID') : '-'}</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 z-10">
            <div>
                <h2 className="text-lg font-bold text-slate-800 capitalize">{activeTab === 'dashboard' ? 'Executive Overview' : activeTab === 'projects' ? 'Project Master List' : activeTab === 'team' ? 'PIC Workload Monitor' : 'Owner Portfolio'}</h2>
                {activePicFilter && <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit mt-1">Filtering: {activePicFilter} <button onClick={() => setActivePicFilter(null)}><X size={10}/></button></span>}
            </div>
            <div className="flex items-center gap-4">
                <button 
                  onClick={() => fetchData(true)} 
                  className={`p-2 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-full transition-all ${refreshing ? 'animate-spin text-emerald-600' : ''}`} 
                  title="Refresh Data"
                >
                  <RefreshCw size={18} />
                </button>
                <div className="relative group hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-full text-sm focus:bg-white focus:border-emerald-500 w-64 outline-none transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
            </div>
        </header>

        <div className="flex-1 overflow-auto p-6 bg-slate-50/50 pb-24 md:pb-6">
            
            {/* KPI Cards */}
            {(activeTab === 'dashboard' || activeTab === 'team') && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <KPICard title="Total Barecost" value={formatCompactCurrency(stats.totalBarecost)} icon={Wallet} colorClass="border-slate-500" />
                <KPICard title="Total Penawaran" value={formatCompactCurrency(stats.totalPenawaran)} icon={DollarSign} colorClass="border-emerald-500" subtext={<span className="text-emerald-600">Avg GPM: {formatPercent(stats.avgGPMOffer)}</span>} />
                <KPICard title="Total Kontrak" value={formatCompactCurrency(stats.totalKontrak)} icon={TrendingUp} colorClass="border-blue-500" subtext={<span className="text-blue-600">Avg GPM: {formatPercent(stats.avgGPMContract)}</span>} />
                <Card className="p-4 border-l-4 border-l-red-500 flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Proyek</p>
                            <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.totalProjects}</h3>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg text-red-500"><AlertCircle size={18}/></div>
                    </div>
                    <div className="mt-auto pt-2 border-t border-slate-50 text-[10px] flex justify-between">
                         <div className="flex gap-2">
                             <span className="text-blue-600 font-bold">{stats.ongoingProjects} Ongoing</span>
                             <span className="text-slate-300">|</span>
                             <span className="text-emerald-600 font-bold">{stats.doneProjects} Done</span>
                         </div>
                         <span className="text-red-500 font-bold">{stats.criticalProjects} Critical</span>
                    </div>
                </Card>
            </div>
            )}

            {/* Dashboard View */}
            {activeTab === 'dashboard' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <div>
                                <h3 className="font-bold text-slate-700">Analisa Profitabilitas (Avg GPM %)</h3>
                                <p className="text-[10px] text-slate-400 mt-1">Weighted Average GPM based on Value</p>
                            </div>
                            <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                                <button onClick={() => setProfitViewMode('pic')} className={`text-xs px-3 py-1.5 rounded-md font-bold flex items-center gap-2 transition-all ${profitViewMode === 'pic' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                    <Users size={14} /> By PIC
                                </button>
                                <button onClick={() => setProfitViewMode('owner')} className={`text-xs px-3 py-1.5 rounded-md font-bold flex items-center gap-2 transition-all ${profitViewMode === 'owner' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                    <Building2 size={14} /> By Owner
                                </button>
                            </div>
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={profitData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748B'}} tickFormatter={(val) => val && val.length > 8 ? val.substring(0, 6) + '...' : val} />
                                    <YAxis tickFormatter={(val) => `${val.toFixed(0)}%`} tick={{fontSize: 10, fill: '#64748B'}} />
                                    <Tooltip formatter={(val) => `${val.toFixed(1)}%`} />
                                    <Bar dataKey="gpm_offer_pct" name="GPM Penawaran" fill="#10B981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="gpm_contract_pct" name="GPM Kontrak" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-bold text-slate-700 mb-6 text-center">Status Proyek (Nominal)</h3>
                        <div className="h-64 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" label={renderCustomizedLabel} labelLine={false}>
                                        {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={80} iconType="circle" wrapperStyle={{fontSize: '10px'}} layout="horizontal" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                     <Card className="lg:col-span-3 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
                            <h3 className="font-bold text-slate-700">Proyek Terbaru</h3>
                            <button onClick={() => setActiveTab('projects')} className="text-emerald-600 text-sm font-medium hover:text-emerald-700 flex items-center gap-1">Lihat Semua <ChevronRight size={16}/></button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-600">
                                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3">Nama Pekerjaan</th>
                                        <th className="px-6 py-3">PIC</th>
                                        <th className="px-6 py-3">Owner</th>
                                        <th className="px-6 py-3 text-right">Barecost</th>
                                        <th className="px-6 py-3 text-right">Penawaran</th>
                                        <th className="px-6 py-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {[...data].sort((a,b) => (b.last_update_date || 0) - (a.last_update_date || 0)).slice(0,5).map((project) => (
                                        <tr key={project.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-3 font-medium text-slate-700 whitespace-normal leading-tight max-w-[300px]">{project.project_name}</td>
                                            <td className="px-6 py-3 text-xs">{project.pic}</td>
                                            <td className="px-6 py-3">{project.owner}</td>
                                            <td className="px-6 py-3 text-right font-mono text-xs">{formatCurrency(project.barecost)}</td>
                                            <td className="px-6 py-3 text-right font-mono text-xs">{formatCurrency(project.penawaran)}</td>
                                            <td className="px-6 py-3 text-center"><Badge status={project.status} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {/* Team Load View (FIXED LAYOUT) */}
            {activeTab === 'team' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-6">
                        <h3 className="font-bold text-slate-700 mb-6 flex justify-between items-center">
                            <span>Beban per PIC</span>
                            <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                                {['total', 'active', 'done'].map(m => (
                                    <button key={m} onClick={() => setLoadChartMetric(m)} className={`text-[10px] px-2 py-1 rounded capitalize ${loadChartMetric === m ? 'bg-white shadow text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-700'}`}>{m}</button>
                                ))}
                            </div>
                        </h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={loadByPic} layout="vertical">
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 10}} />
                                    <Tooltip />
                                    <Bar dataKey={loadChartMetric === 'total' ? 'count' : loadChartMetric === 'active' ? 'activeCount' : 'doneCount'} fill="#8B5CF6" radius={[0,4,4,0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                    
                    <Card className="flex flex-col h-[500px]">
                        <div className="p-6 border-b border-slate-100 bg-white z-10 sticky top-0 rounded-t-xl">
                             <div className="flex justify-between items-center">
                                 <h3 className="font-bold text-slate-700">Status PIC</h3>
                                 <div className="relative">
                                    <button onClick={() => setShowLoadSettings(!showLoadSettings)} className="text-slate-400 hover:text-slate-600"><Settings size={16}/></button>
                                    {showLoadSettings && (
                                        <div className="absolute right-0 top-6 bg-white shadow-xl border border-slate-200 p-4 rounded-lg w-64 z-20">
                                            <h4 className="text-xs font-bold mb-3">Load Limit Settings</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-[10px] text-slate-500 block">Low Limit (&lt; {dynamicLimits.low})</label>
                                                    <input type="range" min="1" max="20" value={loadSettings.lowPct} onChange={(e) => setLoadSettings({...loadSettings, lowPct: parseInt(e.target.value)})} className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"/>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-slate-500 block">High Limit (&gt; {dynamicLimits.high})</label>
                                                    <input type="range" min="10" max="50" value={loadSettings.highPct} onChange={(e) => setLoadSettings({...loadSettings, highPct: parseInt(e.target.value)})} className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"/>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                             </div>
                        </div>
                        <div className="overflow-y-auto flex-1 p-6 space-y-3 pt-0">
                            {loadByPic.map((pic, idx) => (
                                <div key={idx} onClick={() => handlePicClick(pic.name)} className={`p-4 rounded-lg border cursor-pointer transition-all ${activePicFilter === pic.name ? 'bg-violet-50 border-violet-400' : 'bg-slate-50 hover:bg-slate-100 border-slate-100'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-slate-800">{pic.name}</p>
                                            <div className="flex gap-2 text-[10px] font-bold mt-1">
                                                <span className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 uppercase">Total {pic.count}</span>
                                                <LoadBadge count={pic.count} lowLimit={dynamicLimits.low} highLimit={dynamicLimits.high} />
                                            </div>
                                            <div className="flex gap-2 text-[10px] text-slate-500 mt-2 font-medium">
                                                <span className="text-blue-600">ONGOING {pic.activeCount}</span>
                                                <span className="text-slate-300">|</span>
                                                <span className="text-emerald-600">DONE {pic.doneCount}</span>
                                            </div>
                                        </div>
                                        <span className="text-2xl font-black text-violet-600 opacity-80">{pic.count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}

            {/* Breakdown Project Section (Placed Outside Grid for Full Width) */}
            {activeTab === 'team' && (
                <div className="mt-8">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-700">Breakdown Proyek {activePicFilter ? `(${activePicFilter})` : ''}</h3>
                        {activePicFilter && (
                            <button onClick={() => setActivePicFilter(null)} className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-3 py-1 rounded-full bg-red-50">
                                Reset Filter (Show All)
                            </button>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredProjects.length === 0 ? (
                            <div className="col-span-full text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                                Tidak ada proyek untuk PIC ini.
                            </div>
                        ) : (
                            filteredProjects.map(project => (
                                <Card key={project.id} className="p-4 border border-slate-200 hover:border-emerald-300 transition-colors group">
                                    <div className="flex justify-between items-start mb-3">
                                        <Badge status={project.status} />
                                        <div className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-bold">{project.department || "N/A"}</div>
                                    </div>
                                    
                                    <h4 className="font-semibold text-sm text-slate-800 mb-2 leading-tight whitespace-normal min-h-[1.25em]" title={project.project_name}>
                                        {project.project_name} 
                                    </h4>

                                    <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-2 font-medium">
                                        <Users size={12} /> {project.pic}
                                    </div>
                                    
                                    <p className="text-[11px] text-slate-500 mb-3 italic bg-slate-50 p-2 rounded border border-slate-100 line-clamp-3 min-h-[3em]">
                                        "{project.tindak_lanjut || "-"}"
                                    </p>

                                    <div className="flex items-end justify-between pt-3 border-t border-slate-100">
                                        <div className="text-[10px] text-slate-500">
                                            <div className="font-mono mb-0.5">BC: {formatCompactCurrency(project.barecost)}</div>
                                            <div className="font-mono text-slate-700">Offer: {formatCompactCurrency(project.penawaran)}</div>
                                        </div>
                                        <div className="text-right text-[10px] font-bold">
                                            <div className="text-emerald-600">GPM Offer: {formatPercent(project.gpm_offer_pct)}</div>
                                            <div className="text-blue-600">GPM Cont: {formatPercent(project.gpm_contract_pct)}</div>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* NEW: List Owner Tab */}
            {activeTab === 'owners' && (
                <Card className="overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                        <h3 className="font-bold text-lg text-slate-700">List Owner & Portofolio</h3>
                        <div className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                            Total {loadByOwner.length} Active Owners
                        </div>
                    </div>
                    <div className="overflow-x-auto min-h-[500px]">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 w-12 text-center">No</th>
                                    <th className="px-6 py-4">Nama Owner</th>
                                    <th className="px-6 py-4 text-center">Jumlah Proyek</th>
                                    <th className="px-6 py-4 text-right">Total Nilai Penawaran</th>
                                    <th className="px-6 py-4 text-right">Avg GPM Penawaran</th>
                                    <th className="px-6 py-4 text-right">Avg GPM Kontrak</th>
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
                                            <td className="px-6 py-4 text-center text-slate-400">{idx + 1}</td>
                                            <td className="px-6 py-4 font-medium text-slate-700 flex items-center gap-2">
                                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Building2 size={16}/></div>
                                                {owner.name}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold text-xs">{owner.count}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-slate-700">{formatCurrency(owner.value)}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`font-bold text-xs ${avgOwnerGPM > 15 ? 'text-emerald-600' : 'text-slate-500'}`}>
                                                    {formatPercent(avgOwnerGPM)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`font-bold text-xs ${avgOwnerContractGPM > 15 ? 'text-blue-600' : 'text-slate-500'}`}>
                                                    {formatPercent(avgOwnerContractGPM)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Project List Table Full */}
            {activeTab === 'projects' && (
                <div className="space-y-6">
                    <Card className="overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 items-center">
                            <div className="flex items-center gap-2 mr-2">
                                <Filter size={16} className="text-slate-400" />
                                <span className="text-xs font-semibold text-slate-600">Filters:</span>
                            </div>
                            
                            {['Owner', 'PIC', 'Status'].map(filterType => {
                                const val = filterType === 'Owner' ? filterOwner : filterType === 'PIC' ? filterPic : filterStatus;
                                const setVal = filterType === 'Owner' ? setFilterOwner : filterType === 'PIC' ? setFilterPic : setFilterStatus;
                                const opts = filterType === 'Owner' ? uniqueOwners : filterType === 'PIC' ? uniquePics : uniqueStatuses;

                                return (
                                    <div key={filterType} className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500">{filterType}:</span>
                                        <select className="text-xs border border-slate-200 rounded px-2 py-1 focus:outline-emerald-500 bg-white" value={val} onChange={(e) => setVal(e.target.value)}>
                                            {opts.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    </div>
                                );
                            })}
                            
                            {(filterOwner !== 'All' || filterPic !== 'All' || filterStatus !== 'All') && (
                                <button onClick={() => { setFilterOwner('All'); setFilterPic('All'); setFilterStatus('All'); }} className="text-xs text-red-500 hover:text-red-700 ml-auto border border-red-200 px-2 py-0.5 rounded bg-white">Reset</button>
                            )}
                        </div>
                        
                        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex gap-3">
                            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1"><ArrowUpDown size={14}/> Sort:</span>
                            <button onClick={() => handleSort('project_name')} className={`text-xs px-2 py-0.5 rounded border ${sortConfig.key === 'project_name' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200'}`}>
                                Name {sortConfig.key === 'project_name' && (sortConfig.direction === 'asc' ? 'A-Z' : 'Z-A')}
                            </button>
                            <button onClick={() => handleSort('last_update_date')} className={`text-xs px-2 py-0.5 rounded border ${sortConfig.key === 'last_update_date' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200'}`}>
                                Last Update {sortConfig.key === 'last_update_date' && (sortConfig.direction === 'asc' ? '(Oldest)' : '(Newest)')}
                            </button>
                        </div>

                        {/* ACTIVE PROJECTS TABLE */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-600">
                                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Judul Pekerjaan</th>
                                        <th className="px-6 py-4">PIC Utama</th>
                                        <th className="px-6 py-4 text-right">Barecost</th>
                                        <th className="px-6 py-4 text-right">Penawaran</th>
                                        <th className="px-6 py-4 text-right">GPM Offer</th>
                                        <th className="px-6 py-4 text-center">Last Update</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {activeProjectsList.length === 0 && (
                                        <tr><td colSpan="8" className="text-center py-8 text-slate-400">Tidak ada proyek aktif.</td></tr>
                                    )}
                                    {activeProjectsList.map((project) => (
                                        <ProjectRow key={project.id} project={project} setSelectedProjectForNotes={setSelectedProjectForNotes} notes={notes} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* DONE PROJECTS SECTION (COLLAPSIBLE) */}
                    {doneProjectsList.length > 0 && (
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                            <button 
                                onClick={() => setIsDoneListOpen(!isDoneListOpen)}
                                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={18} className="text-emerald-500" />
                                    <span className="font-semibold text-slate-700">Pekerjaan Selesai (Done)</span>
                                    <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{doneProjectsList.length}</span>
                                </div>
                                {isDoneListOpen ? <ChevronUp size={18} className="text-slate-400"/> : <ChevronDown size={18} className="text-slate-400"/>}
                            </button>
                            
                            {isDoneListOpen && (
                                <div className="overflow-x-auto border-t border-slate-100">
                                    <table className="w-full text-sm text-left text-slate-600">
                                        <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4">Judul Pekerjaan</th>
                                                <th className="px-6 py-4">PIC Utama</th>
                                                <th className="px-6 py-4 text-right">Barecost</th>
                                                <th className="px-6 py-4 text-right">Penawaran</th>
                                                <th className="px-6 py-4 text-right">GPM Offer</th>
                                                <th className="px-6 py-4 text-center">Last Update</th>
                                                <th className="px-6 py-4 text-center">Status</th>
                                                <th className="px-6 py-4 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-slate-50/30">
                                            {doneProjectsList.map((project) => (
                                                <ProjectRow key={project.id} project={project} setSelectedProjectForNotes={setSelectedProjectForNotes} notes={notes} />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

        </div>
        
        {/* Mobile Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-3 flex justify-around shadow-2xl z-50">
            {['dashboard', 'projects', 'team', 'owners'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`flex flex-col items-center ${activeTab === tab ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {tab === 'dashboard' && <LayoutDashboard size={20} />}
                    {tab === 'projects' && <FileText size={20} />}
                    {tab === 'team' && <Users size={20} />}
                    {tab === 'owners' && <Building2 size={20} />}
                    <span className="text-[9px] font-bold uppercase mt-1">{tab === 'team' ? 'Load' : tab}</span>
                </button>
            ))}
        </div>
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
                        <h4 className="text-xs font-black text-blue-700 mb-2 flex items-center gap-1 uppercase tracking-wider"><MessageSquare size={12}/> Update Terakhir (PROGRESS Col)</h4>
                        <div className="flex justify-between items-center text-[10px] mt-2 font-bold text-slate-500 uppercase">
                            <span>{formatDate(selectedProjectForNotes.last_update_date)}</span>
                            <Badge status={selectedProjectForNotes.status} />
                        </div>
                        <p className="text-sm text-slate-700 italic mt-2 leading-relaxed bg-white/50 p-2 rounded border border-blue-50">"{selectedProjectForNotes.tindak_lanjut || "Tidak ada catatan"}"</p>
                    </div>
                    <div className="border-t border-slate-200 my-2 relative"><span className="absolute -top-2.5 left-4 bg-slate-50 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Manual History</span></div>
                    {(!notes[selectedProjectForNotes.project_name] || notes[selectedProjectForNotes.project_name].length === 0) ? (
                        <div className="text-center text-slate-300 py-8"><FileText size={48} className="mx-auto opacity-10 mb-2"/><p className="text-xs font-bold uppercase tracking-widest">Belum ada history</p></div>
                    ) : (
                        notes[selectedProjectForNotes.project_name].map((note) => (
                            <div key={note.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm group hover:border-emerald-200 transition-all">
                                <div className="flex justify-between items-start mb-1 text-[9px] text-slate-400 font-bold">
                                    <span>{note.time}</span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => startEditingNote(note)} className="text-slate-400 hover:text-blue-500 p-1"><Edit2 size={12} /></button>
                                        <button onClick={() => handleDeleteNote(note.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={12} /></button>
                                    </div>
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