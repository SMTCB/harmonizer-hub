import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Database, 
  CheckCircle, 
  AlertCircle, 
  ShieldCheck,
  Package,
  Activity,
  User,
  Share2,
  Search,
  ArrowRight,
  Clock,
  FileSearch,
  Cpu,
  RefreshCw
} from 'lucide-react';

/**
 * THE HARMONIZER DECISION HUB - LIVE VERSION
 */

// --- CONFIGURATION ---
// 1. Ensure this matches your ngrok terminal EXACTLY
const NGROK_URL = "https://amiably-vitiated-hilde.ngrok-free.dev"; 

// 2. Set this to "/webhook-test" if you are clicking "Test Workflow" in n8n.
//    Set this to "/webhook" once you successfully toggle the workflow to ACTIVE.
const WEBHOOK_PREFIX = "/webhook-test"; 

const App = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState(0); 
  const [auditResult, setAuditResult] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchQueue = async () => {
    setLoading(true);
    try {
      // We add the 'ngrok-skip-browser-warning' header to bypass the ngrok splash page
      const response = await fetch(`${NGROK_URL}${WEBHOOK_PREFIX}/get-queue`, {
        headers: {
          "ngrok-skip-browser-warning": "69420"
        }
      });
      const data = await response.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching queue:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (NGROK_URL !== "REPLACE_WITH_YOUR_NGROK_URL") {
      fetchQueue();
    }
  }, []);

  const handleProcessInvoice = async (inv) => {
    setSelectedInvoice(inv);
    setIsProcessing(true);
    setActiveStep(1);

    try {
      const response = await fetch(`${NGROK_URL}${WEBHOOK_PREFIX}/process-invoice`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '69420'
        },
        body: JSON.stringify({
          invoiceId: inv.Invoice_ID,
          poNumber: inv.PO_Number,
          qty: inv.Amount 
        })
      });

      const result = await response.json();
      setActiveStep(3);
      setAuditResult({
        finding: result.finding || "Analysis Complete. Check Notion.",
        status: result.status || "Pending Review"
      });
    } catch (error) {
      console.error("Audit failed:", error);
      setAuditResult({ finding: "Connection to n8n failed. Ensure the tunnel is open." });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchStatus = filterStatus === 'All' || inv.Status === filterStatus;
      const vendorName = inv.Vendor_Name || "";
      const matchSearch = vendorName.toLowerCase().includes(searchTerm.toLowerCase()) || inv.Invoice_ID?.includes(searchTerm);
      return matchStatus && matchSearch;
    });
  }, [invoices, filterStatus, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 p-2 rounded-lg shadow-lg">
            <ShieldCheck className="text-blue-400 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-800 uppercase italic">Harmonizer <span className="text-blue-600 tracking-normal">Decision Hub</span></h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-3 h-3" /> Live Feed: {loading ? "Syncing..." : "Connected"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={fetchQueue} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">FA</div>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-inner">
          <div className="p-6 space-y-4 border-b border-slate-100">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileSearch className="w-4 h-4" /> Invoice Queue
            </h2>
            <input 
              type="text" placeholder="Search..." 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading ? (
              <div className="text-center py-10 text-slate-300 animate-pulse font-bold text-xs uppercase">Connecting to Local n8n...</div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs italic">No "Ready" invoices in sheet.</div>
            ) : filteredInvoices.map((inv) => (
              <button
                key={inv.Invoice_ID}
                onClick={() => handleProcessInvoice(inv)}
                className={`w-full p-4 rounded-2xl border text-left transition-all ${
                  selectedInvoice?.Invoice_ID === inv.Invoice_ID 
                    ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' 
                    : 'border-slate-100 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-blue-600">#{inv.Invoice_ID}</span>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-700">{inv.Status}</span>
                </div>
                <p className="text-sm font-bold text-slate-800 truncate">{inv.Vendor_Name}</p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">PO: {inv.PO_Number}</p>
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          {selectedInvoice ? (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black italic">Audit Process: {selectedInvoice.Invoice_ID}</h2>
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">3-Way Match Simulation</p>
                </div>
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${activeStep >= 1 ? 'bg-blue-600' : 'bg-slate-800'}`}>
                    <Cpu className={`w-6 h-6 ${isProcessing ? 'animate-pulse' : ''}`} />
                  </div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${activeStep >= 3 ? 'bg-green-600' : 'bg-slate-800'}`}>
                    <CheckCircle className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4">Invoice Data</h3>
                  <div className="space-y-2">
                    <p className="text-sm font-bold">Vendor: {selectedInvoice.Vendor_Name}</p>
                    <p className="text-sm font-medium">Billed Amount: ${selectedInvoice.Amount}</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4">SAP Record (PO)</h3>
                  <div className="space-y-2">
                    <p className="text-sm font-bold">PO #: {selectedInvoice.PO_Number}</p>
                    <p className="text-xs text-slate-500 italic">Connected to {NGROK_URL}</p>
                  </div>
                </div>
              </div>

              {activeStep === 3 && auditResult && (
                <div className="bg-white rounded-3xl border-2 border-blue-600 p-8 shadow-2xl animate-in zoom-in-95">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertCircle className="text-blue-600 w-6 h-6" />
                    <h4 className="font-black uppercase text-xs tracking-widest">Gemini Auditor Reasoning</h4>
                  </div>
                  <p className="text-lg text-slate-700 bg-slate-50 p-6 rounded-2xl border border-slate-100 leading-relaxed italic">
                    "{auditResult.finding}"
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <Package className="w-16 h-16 text-slate-200 mb-4" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Select an invoice to begin audit</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;