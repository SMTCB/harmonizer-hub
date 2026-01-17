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
  RefreshCw,
  WifiOff
} from 'lucide-react';

/**
 * THE HARMONIZER DECISION HUB - LIVE VERSION
 */

// --- CONFIGURATION ---
// 1. Ensure this matches your ngrok terminal EXACTLY
const NGROK_URL = "https://amiably-vitiated-hilde.ngrok-free.dev"; 

// 2. IMPORTANT FOR N8N:
//    - Switched to "/webhook" because workflows are now PUBLISHED/ACTIVE.
const WEBHOOK_PREFIX = "/webhook"; 

// --- FALLBACK MOCK DATA ---
// Used if the live connection fails so the demo can continue.
const MOCK_INVOICES = [
  { Invoice_ID: 'INV-TEST-001', Vendor_Name: 'Acme Supplies', Invoice_Date: '2024-01-20', Amount: 1200.00, Status: 'Ready', PO_Number: '4500012345' },
  { Invoice_ID: 'INV-DEMO-002', Vendor_Name: 'Global Pharma', Invoice_Date: '2024-01-22', Amount: 5400.00, Status: 'Ready', PO_Number: '4500067890' }
];

const MOCK_SAP_DATA = {
  '4500012345': { items: 10, grQty: 10, unitPrice: 100, material: 'Laptop X1' },
  '4500067890': { items: 50, grQty: 50, unitPrice: 100, material: 'Lab Reagent A' }
};

const App = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState(0); 
  const [auditResult, setAuditResult] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [usingMock, setUsingMock] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    setUsingMock(false);
    
    const targetUrl = `${NGROK_URL}${WEBHOOK_PREFIX}/get-queue`;
    console.log(`[Dashboard] Attempting to reach: ${targetUrl}`);
    
    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        mode: 'cors', 
        headers: {
          "Accept": "application/json",
          "ngrok-skip-browser-warning": "true",
        }
      });

      if (!response.ok) {
        throw new Error(`Connection Error (${response.status}): ${response.statusText}`);
      }

      const data = await response.json();
      console.log("[Dashboard] Success! Data received:", data);

      const invoicesArray = Array.isArray(data) ? data : [];
      setInvoices(invoicesArray);

      if (invoicesArray.length === 0) {
        console.warn("[Dashboard] List is empty. Ensure Sheets row Status is 'Ready'.");
      }
    } catch (err) {
      console.error("[Dashboard] Network Error:", err);
      
      // AUTO-FALLBACK: Switch to Mock Data so the demo doesn't stop
      console.warn("Switching to Demo Mode due to connection failure.");
      setUsingMock(true);
      setInvoices(MOCK_INVOICES);
      setError("Live connection failed. Running in Demo Mode.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (NGROK_URL && !NGROK_URL.includes("REPLACE")) {
      fetchQueue();
    }
  }, []);

  const handleProcessInvoice = async (inv) => {
    setSelectedInvoice(inv);
    setIsProcessing(true);
    setActiveStep(1);
    setAuditResult(null);

    // MOCK EXECUTION (Fallback)
    if (usingMock) {
      setTimeout(() => {
        setActiveStep(2);
        setTimeout(() => {
          setActiveStep(3);
          const sapRecord = MOCK_SAP_DATA[inv.PO_Number] || { grQty: 0 };
          const isQtyMismatch = (inv.Amount / 100) !== sapRecord.grQty; // Simplified logic
          
          setAuditResult({
            finding: isQtyMismatch 
              ? `QUANTITY MISMATCH: Supplier billed ${inv.Amount/100} units. Warehouse receipt confirms ${sapRecord.grQty} units.` 
              : "MATCH SUCCESS: Invoice matches SAP Purchase Order and Goods Receipt records.",
            status: isQtyMismatch ? "Discrepancy" : "Matched"
          });
          setIsProcessing(false);
        }, 1500);
      }, 1500);
      return;
    }

    // LIVE EXECUTION
    try {
      const response = await fetch(`${NGROK_URL}${WEBHOOK_PREFIX}/process-invoice`, {
        method: 'POST',
        mode: 'cors',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          invoiceId: inv.Invoice_ID,
          poNumber: inv.PO_Number,
          qty: inv.Amount 
        })
      });

      if (!response.ok) throw new Error("Audit request failed.");

      const result = await response.json();
      setActiveStep(3);
      setAuditResult({
        finding: result.finding || "Analysis Complete. Check Notion for logs.",
        status: result.status || "Processed"
      });
    } catch (err) {
      console.error("Audit failed:", err);
      // Fallback on failure during audit too
      setAuditResult({ finding: "Connection to n8n failed. Demo Mode would show AI reasoning here." });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const statusValue = (inv.Status || inv.status || "").toString();
      const vendorValue = (inv.Vendor_Name || inv.vendor_name || inv.vendor || "").toString();
      const idValue = (inv.Invoice_ID || inv.invoice_id || inv.id || "").toString();

      const matchStatus = filterStatus === 'All' || statusValue.toLowerCase() === filterStatus.toLowerCase();
      const matchSearch = vendorValue.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          idValue.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchStatus && matchSearch;
    });
  }, [invoices, filterStatus, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 p-2 rounded-lg shadow-lg">
            <ShieldCheck className="text-blue-400 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-800 uppercase italic">Harmonizer <span className="text-blue-600 tracking-normal">Decision Hub</span></h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-3 h-3" /> Live Feed: {loading ? "Syncing..." : usingMock ? "Offline Mode" : "Connected"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchQueue} 
            disabled={loading}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 disabled:opacity-50"
            title="Refresh Invoices"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">FA</div>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-inner">
          <div className="p-6 space-y-4 border-b border-slate-100">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileSearch className="w-4 h-4" /> Invoice Queue
            </h2>
            <input 
              type="text" 
              placeholder="Search ID or Vendor..." 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading ? (
              <div className="text-center py-10 text-slate-300 animate-pulse font-bold text-xs uppercase tracking-widest">Scanning n8n Tunnel...</div>
            ) : error ? (
              <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 text-amber-600 text-xs">
                <div className="flex items-center gap-2 mb-2">
                  <WifiOff className="w-4 h-4" />
                  <p className="font-bold uppercase">Demo Mode Active</p>
                </div>
                <p className="mb-3 leading-relaxed opacity-80">Connection failed. Showing simulated data.</p>
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-10 px-4 text-slate-400 text-xs flex flex-col items-center gap-3">
                <Package className="w-8 h-8 opacity-20" />
                <p className="italic">No "Ready" invoices found in Sheets.</p>
                <button onClick={fetchQueue} className="text-blue-600 font-bold uppercase tracking-tighter hover:underline">Retry Sync</button>
              </div>
            ) : filteredInvoices.map((inv) => (
              <button
                key={inv.Invoice_ID || inv.id}
                onClick={() => handleProcessInvoice(inv)}
                className={`w-full p-4 rounded-2xl border text-left transition-all group ${
                  selectedInvoice?.Invoice_ID === inv.Invoice_ID || selectedInvoice?.id === inv.id
                    ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' 
                    : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">#{inv.Invoice_ID || inv.id}</span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                    (inv.Status || inv.status) === 'Ready' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {inv.Status || inv.status}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-800 truncate">{inv.Vendor_Name || inv.vendor}</p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">PO: {inv.PO_Number || inv.po}</p>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          {selectedInvoice ? (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Process Status Header */}
              <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl flex justify-between items-center">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black italic tracking-tight">Audit Process: {selectedInvoice.Invoice_ID || selectedInvoice.id}</h2>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-3 h-3 text-blue-400" /> Multi-Source Validation Mode
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${activeStep >= 1 ? 'bg-blue-600 shadow-lg shadow-blue-500/30' : 'bg-slate-800'}`}>
                    <Cpu className={`w-6 h-6 ${isProcessing ? 'animate-pulse' : ''}`} />
                  </div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${activeStep >= 3 ? 'bg-green-600 shadow-lg shadow-green-500/30' : 'bg-slate-800'}`}>
                    <CheckCircle className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Data Comparison Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest flex items-center gap-2">
                    <FileText className="w-3 h-3" /> Invoice Data
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Vendor</p>
                      <p className="text-sm font-bold">{selectedInvoice.Vendor_Name || selectedInvoice.vendor}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Total Amount</p>
                      <p className="text-lg font-black text-slate-800">${selectedInvoice.Amount || selectedInvoice.amount}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest flex items-center gap-2">
                    <Database className="w-3 h-3" /> SAP Record (PO)
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Purchase Order</p>
                      <p className="text-sm font-bold">#{selectedInvoice.PO_Number || selectedInvoice.po}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-50 p-2 rounded-xl">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span className="uppercase tracking-tighter italic">Validating Ledger...</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Reasoning Section */}
              {(isProcessing || (activeStep === 3 && auditResult)) && (
                <div className={`bg-white rounded-3xl border-2 transition-all p-8 shadow-2xl animate-in zoom-in-95 duration-500 ${
                  isProcessing ? 'border-slate-200 opacity-60' : 'border-blue-600'
                }`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200">
                      <AlertCircle className="text-white w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black uppercase text-xs tracking-widest text-slate-800">Gemini Auditor Reasoning</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">3-Way Match Validation Engine</p>
                    </div>
                  </div>
                  
                  {isProcessing ? (
                    <div className="space-y-4">
                      <div className="h-4 bg-slate-100 rounded-full w-full animate-pulse" />
                      <div className="h-4 bg-slate-100 rounded-full w-3/4 animate-pulse" />
                      <div className="h-4 bg-slate-100 rounded-full w-1/2 animate-pulse" />
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 shadow-inner">
                      <p className="text-lg text-slate-700 leading-relaxed italic font-medium">
                        "{auditResult?.finding}"
                      </p>
                    </div>
                  )}
                  
                  {!isProcessing && (
                    <div className="mt-8 pt-8 border-t border-slate-100 flex justify-end gap-3">
                      <button className="px-6 py-3 rounded-xl border border-slate-200 text-[10px] font-black uppercase text-slate-400 hover:bg-slate-50 transition-all">Flag for Review</button>
                      <button className="px-6 py-3 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">Post to Ledger</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 select-none">
              <div className="bg-white p-12 rounded-full shadow-2xl shadow-slate-200 mb-8 border border-white">
                <Package className="w-24 h-24 text-slate-300" />
              </div>
              <h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter italic">Queue Idle</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Select an invoice to begin AI auditing</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;