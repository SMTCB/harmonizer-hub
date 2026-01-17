import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Database, CheckCircle, AlertCircle, ShieldCheck, 
  Package, Activity, Clock, FileSearch, RefreshCw, 
  WifiOff, AlertTriangle, ExternalLink 
} from 'lucide-react';

// --- CONFIGURATION ---
const NGROK_URL = "https://amiably-vitiated-hilde.ngrok-free.dev"; 
const WEBHOOK_PREFIX = "/webhook"; 

const MOCK_INVOICES = [
  { Invoice_ID: 'INV-TEST-001', Vendor_Name: 'Acme Supplies', Invoice_Date: '2024-01-20', Amount: 1200.00, Status: 'Ready', PO_Number: '4500012345' }
];

const MOCK_SAP_DATA = {
  '4500012345': { ordered: 10, received: 10 }
};

const App = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [usingMock, setUsingMock] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${NGROK_URL}${WEBHOOK_PREFIX}/get-queue`, {
        headers: { "ngrok-skip-browser-warning": "true" }
      });
      if (!response.ok) throw new Error("Offline");
      const data = await response.json();
      setInvoices(Array.isArray(data) ? data : []);
      setUsingMock(false);
    } catch (err) {
      setUsingMock(true);
      setInvoices(MOCK_INVOICES);
      setError("Running in Demo Mode");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQueue(); }, []);

  const handleProcessInvoice = async (inv) => {
    setSelectedInvoice(inv);
    setIsProcessing(true);
    setAuditResult(null);

    try {
      const response = await fetch(`${NGROK_URL}${WEBHOOK_PREFIX}/process-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ invoiceId: inv.Invoice_ID, poNumber: inv.PO_Number, qty: inv.Amount })
      });
      const result = await response.json();
      setAuditResult({
        finding: result.finding || "No finding returned from n8n.",
        status: result.status || "PROCESSED"
      });
    } catch (err) {
      setAuditResult({ finding: "Connection failed.", status: "ERROR" });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => 
      (inv.Vendor_Name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
      (inv.Invoice_ID || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [invoices, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 p-2 rounded-lg shadow-lg">
            <ShieldCheck className="text-blue-400 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-800 uppercase italic">Harmonizer <span className="text-blue-600">Decision Hub</span></h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-3 h-3" /> {loading ? "Syncing..." : usingMock ? "Offline Mode" : "Connected"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a href="https://harmonizer-hub.vercel.app" target="_blank" className="text-[10px] font-bold uppercase bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-slate-200 transition-colors">
            Live Site <ExternalLink className="w-3 h-3" />
          </a>
          <button onClick={fetchQueue} className="p-2 hover:bg-slate-100 rounded-full"><RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-inner">
          <div className="p-6 border-b border-slate-100">
            <input 
              type="text" placeholder="Search..." 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredInvoices.map((inv) => (
              <button key={inv.Invoice_ID} onClick={() => handleProcessInvoice(inv)} className={`w-full p-4 rounded-2xl border text-left transition-all ${selectedInvoice?.Invoice_ID === inv.Invoice_ID ? 'border-blue-600 bg-blue-50 ring-1' : 'bg-white border-slate-100'}`}>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] font-bold text-blue-600">#{inv.Invoice_ID}</span>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-700">{inv.Status}</span>
                </div>
                <p className="text-sm font-bold text-slate-800 truncate">{inv.Vendor_Name}</p>
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-8">
          {selectedInvoice ? (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className={`rounded-3xl p-8 text-white shadow-xl flex justify-between items-center transition-colors duration-500 ${isProcessing ? 'bg-blue-600' : auditResult?.status === 'DISCREPANCY' ? 'bg-red-600' : auditResult?.status === 'MATCHED' ? 'bg-green-600' : 'bg-slate-900'}`}>
                <div className="space-y-1">
                  <h2 className="text-2xl font-black italic">{isProcessing ? 'Analyzing...' : auditResult ? `Audit: ${auditResult.status}` : `Ready: ${selectedInvoice.Invoice_ID}`}</h2>
                  <p className="text-white/70 text-xs font-bold uppercase tracking-widest flex items-center gap-2"><Activity className="w-3 h-3" /> Gemini 3-Way Match</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  {isProcessing ? <RefreshCw className="w-6 h-6 animate-spin" /> : auditResult?.status === 'DISCREPANCY' ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Invoice Details</h3>
                  <p className="text-sm font-bold">{selectedInvoice.Vendor_Name}</p>
                  <p className="text-lg font-black text-slate-800">${selectedInvoice.Amount}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">SAP Record (PO)</h3>
                  <p className="text-sm font-bold">#{selectedInvoice.PO_Number}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2 font-black text-sm">
                    <div className="bg-slate-50 p-2 rounded-lg"><p className="text-[9px] text-slate-400">ORDERED</p>{MOCK_SAP_DATA[selectedInvoice.PO_Number]?.ordered || '---'}</div>
                    <div className="bg-slate-50 p-2 rounded-lg"><p className="text-[9px] text-slate-400">RECEIVED</p>{MOCK_SAP_DATA[selectedInvoice.PO_Number]?.received || '---'}</div>
                  </div>
                </div>
              </div>

              {(isProcessing || auditResult) && (
                <div className={`bg-white rounded-3xl border-2 p-8 shadow-2xl transition-all ${isProcessing ? 'opacity-50' : 'border-blue-600'}`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-blue-600 p-2 rounded-xl"><AlertCircle className="text-white w-5 h-5" /></div>
                    <h4 className="font-black uppercase text-xs tracking-widest">Gemini Auditor Reasoning</h4>
                  </div>
                  <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 italic">
                    {isProcessing ? "Gemini is analyzing sources..." : auditResult?.finding}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 italic font-black uppercase tracking-widest">Select an invoice to begin</div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;