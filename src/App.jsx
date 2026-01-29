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

// --- Configuration Constants ---
const LOAD_LIMITS = {
    LOW: 2,   
    HIGH: 6
};

// --- Utility Components ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>
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
  } else if (st.includes("risk") || st.includes("kritis") || st.includes("pending") || st.includes("tunggu") || st.includes("critical")) {
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

// --- Mock Data Fallback ---
const MOCK_DATA = [
  { 
    id: 1, 
    project_name: "Pembangunan Gudang Limbah B3", 
    owner: "PT Semen Gresik",
    pic: "Budi Santoso", 
    department: "Sipil", 
    barecost: 4000000000, 
    penawaran: 4800000000,
    kontrak: 4750000000, 
    gpm_offer_val: 800000000, 
    gpm_contract_val: 750000000,
    gpm_offer_pct: 16.6,
    gpm_contract_pct: 15.8,
    progress: 100, 
    tindak_lanjut: "28.01.25 Pekerjaan selesai 100%, sedang proses BAST.",
    status: "Completed",
    last_update_date: new Date('2025-01-28')
  },
  { 
    id: 2, 
    project_name: "Overhaul Turbin Unit 2", 
    owner: "PT PLN Nusantara",
    pic: "Siti Aminah", 
    department: "Mekanikal", 
    barecost: 900000000, 
    penawaran: 1200000000,
    kontrak: 1150000000, 
    gpm_offer_val: 300000000, 
    gpm_contract_val: 250000000,
    gpm_offer_pct: 25.0,
    gpm_contract_pct: 21.7,
    progress: 95, 
    tindak_lanjut: "20.01.25 Menunggu material sparepart import.",
    status: "Critical",
    last_update_date: new Date('2025-01-20')
  },
];

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [profitViewMode, setProfitViewMode] = useState('pic'); // Changed default to 'pic' per user request
  
  // Notes State
  const [selectedProjectForNotes, setSelectedProjectForNotes] = useState(null);
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('cost_dashboard_notes_v6');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingText, setEditingText] = useState("");

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Adding cache busting parameter to force refresh
      const response = await fetch(`https://docs.google.com/spreadsheets/d/e/2PACX-1vSE4iCfy-ul3AvvtRn8crrMl-U8XTbcFQBdXSYTsEeMsUOfrzrmPH451fngepPaiT0wJ2RU11su9FD5/pub?output=csv&t=${Date.now()}`);
      
      if (!response.ok) throw new Error("Network response was not ok");
      
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

              let rawStatus = clean(columns[13]); 
              if (!rawStatus || rawStatus === "-") rawStatus = clean(columns[8]); 
              if ((!rawStatus || rawStatus === "") && progressVal > 0) {
                  rawStatus = progressVal >= 100 ? "Completed" : "In Progress";
              } else if (!rawStatus) {
                  rawStatus = "Planned";
              }

              const barecost = parseMoney(columns[15]); 
              const penawaran = parseMoney(columns[16]); 
              const kontrak = parseMoney(columns[17]); 
              
              let gpm_offer_raw = parseMoney(columns[21]); 
              let gpm_contract_raw = parseMoney(columns[22]); 

              let gpm_offer_val = 0;
              let gpm_offer_pct = 0;
              
              if (gpm_offer_raw > 100) {
                  gpm_offer_val = gpm_offer_raw;
                  gpm_offer_pct = penawaran > 0 ? (gpm_offer_val / penawaran) * 100 : 0;
              } else {
                  gpm_offer_pct = gpm_offer_raw <= 1 ? gpm_offer_raw * 100 : gpm_offer_raw;
                  gpm_offer_val = penawaran * (gpm_offer_pct / 100);
              }

              let gpm_contract_val = 0;
              let gpm_contract_pct = 0;

              if (gpm_contract_raw > 100) {
                  gpm_contract_val = gpm_contract_raw;
                  gpm_contract_pct = kontrak > 0 ? (gpm_contract_val / kontrak) * 100 : 0;
              } else {
                  gpm_contract_pct = gpm_contract_raw <= 1 ? gpm_contract_raw * 100 : gpm_contract_raw;
                  gpm_contract_val = kontrak * (gpm_contract_pct / 100);
              }

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
                  gpm_offer_val: gpm_offer_val,
                  gpm_contract_val: gpm_contract_val,
                  gpm_offer_pct: gpm_offer_pct || 0,
                  gpm_contract_pct: gpm_contract_pct || 0,
              };
          }).filter(item => item !== null && item.project_name);
          
          if (parsedData.length === 0) setData(MOCK_DATA);
          else setData(parsedData);
      } else {
          setData(MOCK_DATA);
      }
      setLastSync(new Date()); 
    } catch (error) {
      console.error("Error fetching/parsing:", error);
      setData(MOCK_DATA);
      setLastSync(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Helpers ---
  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const timestamp = new Date().toLocaleString('id-ID');
    const projectNotes = notes[selectedProjectForNotes.id] || [];
    const updatedNotes = {
      ...notes,
      [selectedProjectForNotes.id]: [...projectNotes, { id: Date.now(), text: newNote, time: timestamp }]
    };
    setNotes(updatedNotes);
    localStorage.setItem('cost_dashboard_notes_v6', JSON.stringify(updatedNotes));
    setNewNote("");
  };

  const handleDeleteNote = (noteId) => {
    const projectNotes = notes[selectedProjectForNotes.id].filter(n => n.id !== noteId);
    const updatedNotes = { ...notes, [selectedProjectForNotes.id]: projectNotes };
    setNotes(updatedNotes);
    localStorage.setItem('cost_dashboard_notes_v6', JSON.stringify(updatedNotes));
  };

  const startEditingNote = (note) => {
      setEditingNoteId(note.id);
      setEditingText(note.text);
  };

  const saveEditedNote = (noteId) => {
      const projectNotes = notes[selectedProjectForNotes.id].map(n => {
          if (n.id === noteId) return { ...n, text: editingText };
          return n;
      });
      const updatedNotes = { ...notes, [selectedProjectForNotes.id]: projectNotes };
      setNotes(updatedNotes);
      localStorage.setItem('cost_dashboard_notes_v6', JSON.stringify(updatedNotes));
      setEditingNoteId(null);
      setEditingText("");
  };

  // --- Calculations ---
  const stats = useMemo(() => {
    const totalProjects = data.length;
    const totalBarecost = data.reduce((acc, curr) => acc + curr.barecost, 0);
    const totalPenawaran = data.reduce((acc, curr) => acc + curr.penawaran, 0);
    const totalKontrak = data.reduce((acc, curr) => acc + curr.kontrak, 0);
    
    const totalGPMOfferVal = data.reduce((acc, curr) => acc + curr.gpm_offer_val, 0);
    const totalGPMContractVal = data.reduce((acc, curr) => acc + curr.gpm_contract_val, 0);

    const avgGPMOffer = totalPenawaran > 0 ? (totalGPMOfferVal / totalPenawaran) * 100 : 0;
    const avgGPMContract = totalKontrak > 0 ? (totalGPMContractVal / totalKontrak) * 100 : 0;
    
    const criticalProjects = data.filter(d => 
        (d.status || "").toLowerCase().includes('risk') || 
        (d.status || "").toLowerCase().includes('kritis') ||
        (d.status || "").toLowerCase().includes('critical') ||
        (d.status || "").toLowerCase().includes('alert')
    ).length;

    // Calculate Done vs Ongoing for the Header
    const doneProjects = data.filter(p => {
        const st = (p.status || "").toLowerCase();
        return st.includes('completed') || st.includes('done') || st.includes('selesai') || st.includes('finish') || p.progress >= 100;
    }).length;
    const ongoingProjects = totalProjects - doneProjects;

    return { 
        totalProjects, 
        totalBarecost, 
        totalPenawaran, 
        totalKontrak, 
        avgGPMOffer, 
        avgGPMContract, 
        criticalProjects,
        doneProjects,
        ongoingProjects 
    };
  }, [data]);

  const dynamicLimits = useMemo(() => {
    const low = Math.floor(stats.totalProjects * (loadSettings.lowPct / 100));
    const high = Math.ceil(stats.totalProjects * (loadSettings.highPct / 100));
    return { low: low || LOAD_LIMITS.LOW, high: high || LOAD_LIMITS.HIGH };
  }, [stats.totalProjects, loadSettings]);

  // LoadByPic Logic
  const loadByPic = useMemo(() => {
    const load = {};
    data.forEach(p => {
        const picName = p.pic || "Unassigned";
        const cleanName = picName.trim(); 
        
        const st = (p.status || "").toLowerCase();
        const isDone = st.includes('completed') || st.includes('done') || st.includes('selesai') || st.includes('finish') || p.progress >= 100;

        if (!load[cleanName]) load[cleanName] = { name: cleanName, count: 0, doneCount: 0, activeCount: 0, barecost: 0 };
        
        load[cleanName].count += 1;
        if (isDone) {
            load[cleanName].doneCount += 1;
        } else {
            load[cleanName].activeCount += 1; 
        }
        
        load[cleanName].barecost += p.barecost;
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
          let st = p.status || "Unknown";
          st = st.charAt(0).toUpperCase() + st.slice(1).toLowerCase();
          statuses[st] = (statuses[st] || 0) + 1;
      });
      return Object.keys(statuses).map(key => ({ name: key, value: statuses[key] }));
  }, [data]);

  const profitData = useMemo(() => {
      // 1. Base Filter (Show All or Done Only)
      // Note: for average calculation per PIC/Owner, usually better to include DONE projects or ALL.
      // Let's use the toggle to filter source data.
      let filtered = showAllProfitability 
        ? data 
        : data.filter(d => d.progress === 100 || (d.status || "").toLowerCase().includes('completed') || (d.status || "").toLowerCase().includes('done'));
      
      if (profitViewMode === 'owner') {
          // --- VIEW BY OWNER (Weighted Average GPM) ---
          const ownerMap = {};
          filtered.forEach(p => {
              const owner = p.owner || "Others";
              if (!ownerMap[owner]) ownerMap[owner] = { name: owner, offer: 0, contract: 0, gpm_offer_val: 0, gpm_contract_val: 0 };
              ownerMap[owner].offer += p.penawaran;
              ownerMap[owner].contract += p.kontrak;
              ownerMap[owner].gpm_offer_val += p.gpm_offer_val;
              ownerMap[owner].gpm_contract_val += p.gpm_contract_val;
          });
          
          return Object.values(ownerMap).map(o => ({
              name: o.name,
              gpm_offer_pct: o.offer > 0 ? (o.gpm_offer_val / o.offer) * 100 : 0,
              gpm_contract_pct: o.contract > 0 ? (o.gpm_contract_val / o.contract) * 100 : 0
          })).sort((a,b) => b.gpm_contract_pct - a.gpm_contract_pct).slice(0, 10);
      } else {
          // --- VIEW BY PIC (Weighted Average GPM) ---
          const picMap = {};
          filtered.forEach(p => {
              const pic = p.pic || "Unassigned";
              if (!picMap[pic]) picMap[pic] = { name: pic, offer: 0, contract: 0, gpm_offer_val: 0, gpm_contract_val: 0 };
              picMap[pic].offer += p.penawaran;
              picMap[pic].contract += p.kontrak;
              picMap[pic].gpm_offer_val += p.gpm_offer_val;
              picMap[pic].gpm_contract_val += p.gpm_contract_val;
          });

          return Object.values(picMap).map(p => ({
              name: p.name,
              gpm_offer_pct: p.offer > 0 ? (p.gpm_offer_val / p.offer) * 100 : 0,
              gpm_contract_pct: p.contract > 0 ? (p.gpm_contract_val / p.contract) * 100 : 0
          })).sort((a,b) => b.gpm_contract_pct - a.gpm_contract_pct);
      }
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

  // Expanded Colors for distinctness
  const COLORS = [
      '#10B981', // Emerald (On Track)
      '#3B82F6', // Blue (Ongoing)
      '#F59E0B', // Amber (Risk/Pending)
      '#EF4444', // Red (Delayed)
      '#8B5CF6', // Violet (Negotiation)
      '#EC4899', // Pink (Prebid)
      '#06B6D4', // Cyan
      '#F97316', // Orange
      '#84CC16', // Lime
      '#6366F1', // Indigo
      '#14B8A6', // Teal
      '#F43F5E'  // Rose
  ];

  const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
  const formatCompactCurrency = (val) => {
    if (val >= 1000000000000) return `Rp ${(val / 1000000000000).toFixed(2)} T`;
    if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(2)} M`;
    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(2)} jt`;
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
  };
  const formatPercent = (val) => `${(val || 0).toFixed(1)}%`;
  const formatDate = (date) => date ? date.toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: '2-digit'}) : '-';

  // Customized Label: Shows VALUE (Count) instead of Percent
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return percent > 0.05 ? <text x={x} y={y} fill="#1e293b" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fontWeight="bold" style={{ textShadow: '0px 0px 3px rgba(255,255,255,0.8)' }}>{value}</text> : null;
  };

  // Reusable Project Table Row
  const ProjectRow = ({ project }) => (
    <tr className="hover:bg-slate-50/80 transition-colors group">
        <td className="px-6 py-4 font-medium text-slate-700">
            <span className="block whitespace-normal leading-tight" title={project.project_name}>
                {project.project_name}
            </span>
            <div className="text-[10px] text-slate-400 font-normal mt-1">{project.owner}</div>
        </td>
        <td className="px-6 py-4 text-xs align-top pt-4">{project.pic}</td>
        <td className="px-6 py-4 text-right font-mono text-xs text-slate-500 align-top pt-4">{formatCurrency(project.barecost)}</td>
        <td className="px-6 py-4 text-right font-mono text-xs text-slate-700 align-top pt-4">{formatCurrency(project.penawaran)}</td>
        <td className="px-6 py-4 text-right font-mono text-xs text-emerald-600 font-bold align-top pt-4">{formatPercent(project.gpm_offer_pct)}</td>
        <td className="px-6 py-4 text-center text-xs text-slate-500 align-top pt-4">{formatDate(project.last_update_date)}</td>
        <td className="px-6 py-4 text-center align-top pt-4"><Badge status={project.status} /></td>
        <td className="px-6 py-4 text-center align-top pt-4">
            <button 
                onClick={() => setSelectedProjectForNotes(project)}
                className={`p-2 rounded-full transition-all relative ${notes[project.id]?.length > 0 ? 'text-emerald-500 bg-emerald-50' : 'text-slate-300 hover:text-emerald-500 hover:bg-slate-100'}`}
            >
                <FileText size={16} />
                {notes[project.id]?.length > 0 && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>}
            </button>
        </td>
    </tr>
  );

  if (loading) {
      return <div className="h-screen w-full flex items-center justify-center bg-slate-50 text-slate-500 font-medium animate-pulse">Memuat Data Cost Engineering...</div>;
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden relative">
      
      {/* Sidebar (Hidden on Mobile) */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col shadow-xl z-10">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold flex items-center gap-2 text-white">
            <Briefcase className="text-emerald-400" />
            Cost Control
          </h1>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Project Monitoring System</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {['dashboard', 'projects', 'team', 'owners'].map(tab => (
            <button 
                key={tab}
                onClick={() => { setActiveTab(tab); setActivePicFilter(null); }} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === tab ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
                {tab === 'dashboard' && <LayoutDashboard size={18} />}
                {tab === 'projects' && <FileText size={18} />}
                {tab === 'team' && <Users size={18} />}
                {tab === 'owners' && <Building2 size={18} />}
                <span className="font-medium text-sm capitalize">
                    {tab === 'dashboard' ? 'Dashboard Utama' : tab === 'projects' ? 'List Pekerjaan' : tab === 'team' ? 'Load Tim (PIC)' : 'List Owner'}
                </span>
            </button>
          ))}
        </nav>

        <div className="p-4 bg-slate-950 text-xs text-slate-500 border-t border-slate-800">
            <p className="font-semibold text-slate-400 mb-1">Last Sync:</p>
            <p className="font-mono text-[10px] text-emerald-500">
                {lastSync ? lastSync.toLocaleString('id-ID', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                }) : '-'}
            </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 z-10">
            <div>
                <h2 className="text-lg font-bold text-slate-800">
                    {activeTab === 'dashboard' ? 'Executive Overview' : activeTab === 'projects' ? 'Project Master List' : activeTab === 'team' ? 'PIC Workload Monitor' : 'Owner Portfolio'}
                </h2>
                {activePicFilter && (
                    <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit mt-1">
                        Filtering: {activePicFilter} <button onClick={() => setActivePicFilter(null)}><X size={10}/></button>
                    </span>
                )}
            </div>
            <div className="flex items-center gap-4">
                <button 
                    onClick={fetchData} 
                    className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-full transition-all"
                    title="Refresh Data from Source"
                >
                    <RefreshCw size={18} />
                </button>
                <div className="relative group hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search Project / PIC..." 
                        className="pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-full text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none w-64 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
        </header>

        {/* Content (Bottom Padding added for Mobile Nav) */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50/50 pb-24 md:pb-6">
            
            {/* KPI Cards (Available in Dashboard & Team view) */}
            {(activeTab === 'dashboard' || activeTab === 'team') && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="p-5 border-l-4 border-l-slate-500 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Barecost</p>
                            <h3 className="text-lg font-bold text-slate-800 tracking-tight">{formatCompactCurrency(stats.totalBarecost)}</h3>
                        </div>
                        <div className="p-2 bg-slate-100 text-slate-600 rounded-lg"><Wallet size={20}/></div>
                    </div>
                </Card>
                <Card className="p-5 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Penawaran</p>
                            <h3 className="text-lg font-bold text-slate-800 tracking-tight">{formatCompactCurrency(stats.totalPenawaran)}</h3>
                            <div className="flex items-center gap-1 mt-1"><span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">Avg GPM: {formatPercent(stats.avgGPMOffer)}</span></div>
                        </div>
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign size={20}/></div>
                    </div>
                </Card>
                <Card className="p-5 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Kontrak</p>
                            <h3 className="text-lg font-bold text-slate-800 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">{formatCompactCurrency(stats.totalKontrak)}</h3>
                            <div className="flex items-center gap-1 mt-1"><span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">Avg GPM: {formatPercent(stats.avgGPMContract)}</span></div>
                        </div>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><TrendingUp size={20}/></div>
                    </div>
                </Card>
                <Card className="p-5 border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Proyek</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.totalProjects}</h3>
                            <div className="flex gap-2 text-[10px] mt-1">
                                <span className="text-blue-600 font-bold">{stats.ongoingProjects} Ongoing</span>
                                <span className="text-slate-300">|</span>
                                <span className="text-emerald-600 font-bold">{stats.doneProjects} Done</span>
                            </div>
                            <p className="text-[10px] text-red-500 mt-1 font-medium">{stats.criticalProjects} Critical</p>
                        </div>
                        <div className="p-2 bg-red-50 text-red-600 rounded-lg"><AlertCircle size={20}/></div>
                    </div>
                </Card>
            </div>
            )}

            {/* Dashboard View */}
            {activeTab === 'dashboard' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-bold text-slate-700">Analisa Profitabilitas (GPM %)</h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    {profitViewMode === 'owner' 
                                        ? "Analisis per Owner (Avg GPM)" 
                                        : "Analisis per PIC (Avg GPM)"}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setProfitViewMode(profitViewMode === 'pic' ? 'owner' : 'pic')} 
                                    className={`text-xs flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors font-medium border ${profitViewMode === 'owner' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <Building2 size={12} /> {profitViewMode === 'pic' ? "View by Owner" : "View by PIC"}
                                </button>
                                {profitViewMode === 'project' && (
                                    <button onClick={() => setShowAllProfitability(!showAllProfitability)} className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors font-medium border border-slate-200">
                                        <Eye size={12} /> {showAllProfitability ? "Filter Done" : "Lihat Semua"}
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={profitData} barGap={0}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis 
                                        dataKey={profitViewMode === 'owner' ? 'name' : (profitViewMode === 'pic' ? 'name' : 'project_name')} 
                                        tick={{fontSize: 10, fill: '#64748B'}} 
                                        tickFormatter={(val) => val && val.length > 8 ? val.substring(0, 6) + '...' : val} 
                                    />
                                    <YAxis tickFormatter={(val) => `${val}%`} tick={{fontSize: 10, fill: '#64748B'}} />
                                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(val, name) => [formatPercent(val), name]} cursor={{fill: '#F1F5F9'}} />
                                    <Legend wrapperStyle={{fontSize: '11px', marginTop: '10px'}}/>
                                    <ReferenceLine y={0} stroke="#94A3B8" />
                                    <Bar dataKey="gpm_offer_pct" name="GPM Penawaran %" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                                    <Bar dataKey="gpm_contract_pct" name="GPM Kontrak %" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-bold text-slate-700 mb-6">Distribusi Status Progress</h3>
                        <div className="h-64 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" labelLine={false} label={renderCustomizedLabel}>
                                        {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '11px'}}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                     <Card className="lg:col-span-3 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
                            <h3 className="font-bold text-slate-700">Proyek Terbaru (Update Terakhir)</h3>
                            <button onClick={() => setActiveTab('projects')} className="text-emerald-600 text-sm font-medium hover:text-emerald-700 flex items-center gap-1">Lihat Semua <ChevronRight size={16}/></button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-600">
                                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3">Nama Pekerjaan</th>
                                        <th className="px-6 py-3">Owner</th>
                                        <th className="px-6 py-3 text-right">Penawaran</th>
                                        <th className="px-6 py-3 text-center">Last Update</th>
                                        <th className="px-6 py-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {[...data].sort((a,b) => (b.last_update_date || 0) - (a.last_update_date || 0)).slice(0,5).map((project) => (
                                        <tr key={project.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-3 font-medium text-slate-700">
                                                {/* Multi-line Title fix in Recent Projects */}
                                                <span className="block whitespace-normal leading-tight" title={project.project_name}>
                                                    {project.project_name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">{project.owner}</td>
                                            <td className="px-6 py-3 text-right font-mono text-xs">{formatCurrency(project.penawaran)}</td>
                                            <td className="px-6 py-3 text-center text-xs text-slate-500">{formatDate(project.last_update_date)}</td>
                                            <td className="px-6 py-3 text-center"><Badge status={project.status} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {/* Team Load View */}
            {activeTab === 'team' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="p-6">
                            <h3 className="font-bold text-slate-700 mb-6 flex justify-between items-center">
                                <span>Load Analysis per PIC</span>
                                <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                                    {['total', 'active', 'done'].map(m => (
                                        <button 
                                            key={m}
                                            onClick={() => setLoadChartMetric(m)}
                                            className={`text-[10px] px-2 py-1 rounded capitalize ${loadChartMetric === m ? 'bg-white shadow text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart 
                                        data={loadByPic} 
                                        layout="vertical"
                                        onClick={(data) => data && handlePicClick(data.activeLabel)}
                                        className="cursor-pointer"
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0"/>
                                        <XAxis type="number" allowDecimals={false} tick={{fontSize: 10}}/>
                                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11, fill: '#334155'}} />
                                        <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px'}} />
                                        <Bar 
                                            dataKey={loadChartMetric === 'total' ? 'count' : loadChartMetric === 'active' ? 'activeCount' : 'doneCount'} 
                                            name={`${loadChartMetric} Projects`} 
                                            fill={loadChartMetric === 'done' ? '#10B981' : loadChartMetric === 'active' ? '#3B82F6' : '#8B5CF6'} 
                                            radius={[0, 4, 4, 0]} 
                                            barSize={24} 
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-xs text-slate-400 mt-2 text-center italic">*Klik pada batang chart untuk filter detail di bawah</p>
                        </Card>

                        <Card className="p-6 overflow-auto h-[400px]">
                            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2 z-10 border-b border-slate-100">
                                <h3 className="font-bold text-slate-700">Status Beban Kerja</h3>
                                <div className="relative">
                                    <button onClick={() => setShowLoadSettings(!showLoadSettings)} className="text-slate-400 hover:text-slate-600"><Settings size={16}/></button>
                                    {showLoadSettings && (
                                        <div className="absolute right-0 top-6 bg-white shadow-xl border border-slate-200 p-4 rounded-lg w-64 z-20">
                                            <h4 className="text-xs font-bold mb-3">Load Limit Settings (Total Proj)</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-[10px] text-slate-500 block">Low Limit (Underload &lt; {dynamicLimits.low})</label>
                                                    <input type="range" min="1" max="50" value={loadSettings.lowPct} onChange={(e) => setLoadSettings({...loadSettings, lowPct: parseInt(e.target.value)})} className="w-full accent-blue-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"/>
                                                    <div className="text-right text-xs font-mono">{loadSettings.lowPct}%</div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-slate-500 block">High Limit (Overload &gt; {dynamicLimits.high})</label>
                                                    <input type="range" min="10" max="100" value={loadSettings.highPct} onChange={(e) => setLoadSettings({...loadSettings, highPct: parseInt(e.target.value)})} className="w-full accent-red-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"/>
                                                    <div className="text-right text-xs font-mono">{loadSettings.highPct}%</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                {loadByPic.map((pic, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => handlePicClick(pic.name)}
                                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${activePicFilter === pic.name ? 'bg-violet-50 border-violet-300 ring-1 ring-violet-300' : 'bg-slate-50 border-slate-100 hover:border-violet-200'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-xs">
                                                {pic.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm text-slate-700">{pic.name}</p>
                                                
                                                {/* NEW DETAIL LAYOUT: TOTAL, ONGOING, DONE */}
                                                <div className="flex flex-col gap-0.5 mt-1">
                                                     <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">TOTAL {pic.count}</span>
                                                        <LoadBadge count={pic.count} lowLimit={dynamicLimits.low} highLimit={dynamicLimits.high} />
                                                     </div>
                                                     <div className="flex items-center gap-2 text-[9px]">
                                                        <span className="text-blue-600 font-semibold">ONGOING {pic.activeCount}</span>
                                                        <span className="text-slate-300">|</span>
                                                        <span className="text-emerald-600 font-semibold">DONE {pic.doneCount}</span>
                                                     </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {/* Big Number is TOTAL now */}
                                            <span className="text-xl font-bold text-purple-600">{pic.count}</span>
                                            <p className="text-[10px] text-slate-400">Total Load</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    <div className="flex items-center justify-between mt-8 mb-4">
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
                                        <div className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded">
                                            {project.department || "N/A"}
                                        </div>
                                    </div>
                                    
                                    {/* TITLE & PIC (Multi-line + Truncate limit 3 lines if needed) */}
                                    <h4 className="font-semibold text-sm text-slate-800 mb-2 leading-tight line-clamp-3 min-h-[1.25em]" title={project.project_name}>
                                        {project.project_name} 
                                    </h4>

                                    <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-2 font-medium">
                                        <Users size={12} /> {project.pic}
                                    </div>
                                    
                                    {/* NOTES INSTEAD OF PROGRESS */}
                                    <p className="text-[11px] text-slate-500 mb-3 italic bg-slate-50 p-2 rounded border border-slate-100 line-clamp-3 min-h-[3em]">
                                        "{project.tindak_lanjut || "-"}"
                                    </p>

                                    <div className="flex items-end justify-between pt-3 border-t border-slate-100">
                                        <div className="text-[10px] text-slate-500">
                                            <div className="font-mono">BC: {formatCompactCurrency(project.barecost)}</div>
                                        </div>
                                        <div className="text-right text-[10px]">
                                            <div className="text-emerald-600 font-bold">GPM Offer: {formatPercent(project.gpm_offer_pct)}</div>
                                            <div className="text-blue-600 font-bold">GPM Cont: {formatPercent(project.gpm_contract_pct)}</div>
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
                                        <ProjectRow key={project.id} project={project} />
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
                                                <ProjectRow key={project.id} project={project} />
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
        
        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-3 z-50 shadow-2xl">
            {['dashboard', 'projects', 'team', 'owners'].map(tab => (
                <button 
                    key={tab}
                    onClick={() => { setActiveTab(tab); setActivePicFilter(null); }} 
                    className={`flex flex-col items-center gap-1 ${activeTab === tab ? 'text-emerald-600' : 'text-slate-400'}`}
                >
                    {tab === 'dashboard' && <LayoutDashboard size={20} />}
                    {tab === 'projects' && <FileText size={20} />}
                    {tab === 'team' && <Users size={20} />}
                    {tab === 'owners' && <Building2 size={20} />}
                    <span className="text-[10px] font-medium capitalize">{tab === 'team' ? 'Load' : tab}</span>
                </button>
            ))}
        </div>

      </main>

      {/* Notes Modal (Same as before) */}
      {selectedProjectForNotes && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">Notes & Tindak Lanjut</h3>
                        <p className="text-xs text-slate-500 truncate max-w-[300px]">{selectedProjectForNotes.project_name}</p>
                    </div>
                    <button onClick={() => setSelectedProjectForNotes(null)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full"><X size={20} /></button>
                </div>
                
                <div className="p-4 h-96 overflow-y-auto space-y-4 bg-slate-50/50">
                    <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-lg">
                        <h4 className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1"><MessageSquare size={12}/> Update Terakhir (Source)</h4>
                        <div className="flex justify-between items-start text-xs text-slate-600 mb-2">
                             <div className="flex items-center gap-1"><Calendar size={10} className="text-blue-400"/> {formatDate(selectedProjectForNotes.last_update_date)}</div>
                             <Badge status={selectedProjectForNotes.status} />
                        </div>
                        <p className="text-xs text-slate-700 italic border-l-2 border-blue-300 pl-2">"{selectedProjectForNotes.tindak_lanjut || "Tidak ada tindak lanjut di source"}"</p>
                        <p className="text-[10px] text-slate-400 mt-2 text-right">*Data diambil dari kolom PROGRESS</p>
                    </div>

                    <div className="border-t border-slate-200 my-2 relative">
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-slate-50 px-2 text-[10px] text-slate-400">Manual Notes</span>
                    </div>

                    {(!notes[selectedProjectForNotes.id] || notes[selectedProjectForNotes.id].length === 0) ? (
                        <div className="text-center text-slate-400 py-4"><p className="text-sm">Belum ada catatan manual.</p></div>
                    ) : (
                        notes[selectedProjectForNotes.id].map((note) => (
                            <div key={note.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm group hover:border-emerald-200 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full"><Clock size={10} /> {note.time}</span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => startEditingNote(note)} className="text-slate-400 hover:text-blue-500 p-1"><Edit2 size={12} /></button>
                                        <button onClick={() => handleDeleteNote(note.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={12} /></button>
                                    </div>
                                </div>
                                {editingNoteId === note.id ? (
                                    <div className="flex gap-2 mt-1">
                                        <input type="text" className="flex-1 text-sm border border-blue-300 rounded px-2 py-1 outline-none" value={editingText} onChange={(e) => setEditingText(e.target.value)} autoFocus />
                                        <button onClick={() => saveEditedNote(note.id)} className="text-blue-600 hover:text-blue-800"><Save size={16}/></button>
                                        <button onClick={() => setEditingNoteId(null)} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{note.text}</p>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 bg-white">
                    <div className="flex gap-2">
                        <input type="text" className="flex-1 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="Tulis catatan tambahan..." value={newNote} onChange={(e) => setNewNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddNote()} />
                        <button onClick={handleAddNote} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm shadow-emerald-200">
                            <Plus size={16} /> <span className="hidden sm:inline">Add</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}