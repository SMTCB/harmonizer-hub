import React, { useState, useMemo } from 'react';
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
  Loader2,
  Search,
  Filter,
  ArrowRight,
  Clock,
  History,
  FileSearch,
  Cpu
} from 'lucide-react';

/**
 * THE FINANCE ANALYST DECISION DASHBOARD
 * Role: Monitors a Google Drive 'Vendor Portal' queue and processes 3-Way Matches.
 */

const App = () => {
  // --- MOCK INVOICE QUEUE (Simulated from G-Drive/Sheets) ---
  const [invoices, setInvoices] = useState([
    { id: 'INV-102', vendor: 'Acme Supplies', date: '2024-01-20', amount: 1200.00, status: 'Ready', po: '4500012345' },
    { id: 'INV-103', vendor: 'Global Pharma', date: '2024-01-21', amount: 5400.00, status: 'Ready', po: '4500067890' },
    { id: 'INV-099', vendor: 'Tech Logistics', date: '2024-01-18', amount: 250.00, status: 'Posted', po: '4500011111' },
    { id: 'INV-095', vendor: 'Acme Supplies', date: '2024-01-15', amount: 800.00, status: 'Disputed', po: '4500012345' },
  ]);

  // --- MOCK SAP DATA ---
  const sapData = {
    '4500012345': { items: 10, grQty: 10, unitPrice: 100, material: 'Laptop X1' },
    '4500067890': { items: 50, grQty: 50, unitPrice: 100, material: 'Lab Reagent A' }
  };

  // --- UI STATE ---
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState(0); // 0: Idle, 1: OCR, 2: 3-Way Match, 3: Final
  const [auditResult, setAuditResult] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // --- LOGIC ---
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchStatus = filterStatus === 'All' || inv.status === filterStatus;
      const matchSearch = inv.vendor.toLowerCase().includes(searchTerm.toLowerCase()) || inv.id.includes(searchTerm);
      return matchStatus && matchSearch;
    });
  }, [invoices, filterStatus, searchTerm]);

  const handleProcessInvoice = (inv) => {
    setSelectedInvoice(inv);
    setIsProcessing(true);
    setActiveStep(1); // Starting OCR

    // Simulate n8n Pipeline
    // NOTE: In Step 8 of your manual, you will replace this with a real fetch() call to n8n
    setTimeout(() => {
      setActiveStep(2); // Starting 3-Way Match logic
      setTimeout(() => {
        setActiveStep(3); // Result Ready
        setAuditResult({
          ocrQty: inv.id === 'INV-102' ? 12 : 50, // Scenario 1 has mismatch
          sapQty: sapData[inv.po]?.grQty || 0,
          sapPrice: sapData[inv.po]?.unitPrice || 0,
          finding: inv.id === 'INV-102' 
            ? "QUANTITY MISMATCH: Supplier billed 12 units. Warehouse receipt confirms 10." 
            : "PRICE MISMATCH: Unit price in invoice ($120) exceeds SAP agreement ($100)."
        });
        setIsProcessing(false);
      }, 1500);
    }, 1500);
  };

  const handleFinalAction = (status) => {
    const updated = invoices.map(inv => 
      inv.id === selectedInvoice.id ? { ...inv, status: status } : inv
    );
    setInvoices(updated);
    setSelectedInvoice(null);
    setAuditResult(null);
    setActiveStep(0);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 p-2 rounded-lg shadow-lg">
            <ShieldCheck className="text-blue-400 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-800 uppercase italic">Harmonizer <span className="text-blue-600">Decision Hub</span></h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-3 h-3" /> Real-time Vendor Queue
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-100 shadow-sm">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
             <span className="text-[11px] font-black text-green-700 uppercase tracking-tight">n8n Tunnel: Active</span>
          </div>
          <div className="flex items-center gap-3 border-l pl-6 border-slate-200">
             <div className="text-right">
                <p className="text-xs font-bold">F. Analyst</p>
                <p className="text-[10px] text-slate-400">Finance Dept.</p>
             </div>
             <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 border-2 border-white shadow-md">FA</div>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: The Queue */}
        <aside className="w-96 bg-white border-r border-slate-200 flex flex-col shadow-inner">
          <div className="p-6 space-y-4 border-b border-slate-100 bg-slate-50/30">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <FileSearch className="w-4 h-4" /> Invoice Queue
              </h2>
              <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                {invoices.filter(i => i.status === 'Ready').length} New
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search Vendor or ID..." 
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {['All', 'Ready', 'Posted', 'Disputed'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight border transition-all whitespace-nowrap ${
                      filterStatus === status 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredInvoices.map((inv) => (
              <button
                key={inv.id}
                onClick={() => handleProcessInvoice(inv)}
                disabled={inv.status !== 'Ready'}
                className={`w-full p-4 rounded-2xl border text-left transition-all relative group ${
                  selectedInvoice?.id === inv.id 
                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600 shadow-md' 
                    : inv.status === 'Ready'
                      ? 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5'
                      : 'border-slate-100 bg-slate-50 opacity-60'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">#{inv.id}</span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                    inv.status === 'Ready' ? 'bg-amber-100 text-amber-700' :
                    inv.status === 'Posted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {inv.status}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-800">{inv.vendor}</p>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs font-medium text-slate-500">{inv.date}</span>
                  <span className="text-sm font-black text-slate-900">${inv.amount.toLocaleString()}</span>
                </div>
                {inv.status === 'Ready' && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <ArrowRight className="w-5 h-5 text-blue-600" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Main Part: The Comparison & Decision Screen */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          {selectedInvoice ? (
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
              
              {/* Top Banner: AI Processing Status */}
              <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <Cpu className="w-32 h-32" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-2xl font-black mb-2">Invoice Audit: {selectedInvoice.id}</h2>
                    <p className="text-slate-400 text-sm font-medium">Comparing extracted payload vs PO #{selectedInvoice.po}</p>
                  </div>
                  <div className="flex gap-4">
                    {[
                      { id: 1, label: 'OCR Extraction', active: activeStep >= 1 },
                      { id: 2, label: '3-Way Match', active: activeStep >= 2 },
                      { id: 3, label: 'Audit Ready', active: activeStep >= 3 },
                    ].map(step => (
                      <div key={step.id} className="flex flex-col items-center gap-2">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                          activeStep >= step.id ? 'bg-blue-600 shadow-lg shadow-blue-500/30' : 'bg-slate-800 text-slate-600'
                        }`}>
                          {activeStep > step.id ? <CheckCircle className="w-6 h-6" /> : (step.id === 1 ? <Cpu className="w-6 h-6" /> : step.id === 2 ? <Activity className="w-6 h-6" /> : <User className="w-6 h-6" />)}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest">{step.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Data Grid: Invoice vs SAP */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 1. Invoice Side (From G-Drive) */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-black uppercase tracking-widest">Extracted Invoice Details</h3>
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <span className="text-[10px] font-black text-slate-400 uppercase">Vendor Invoice #</span>
                          <p className="text-lg font-black text-slate-800">{selectedInvoice.id}</p>
                       </div>
                       <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <span className="text-[10px] font-black text-slate-400 uppercase">Invoice Date</span>
                          <p className="text-lg font-black text-slate-800">{selectedInvoice.date}</p>
                       </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                       <h4 className="text-xs font-black text-slate-400 uppercase mb-4">Line Item Mapping</h4>
                       <div className="flex justify-between items-center py-2 border-b border-slate-50">
                          <span className="text-sm font-bold text-slate-700">{sapData[selectedInvoice.po]?.material}</span>
                          <span className="text-lg font-black text-blue-600">
                            {activeStep >= 3 ? auditResult.ocrQty : '---'} <span className="text-[10px] text-slate-400">UNITS</span>
                          </span>
                       </div>
                    </div>
                  </div>
                </div>

                {/* 2. SAP Side (From Google Sheets) */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                    <Database className="w-5 h-5 text-slate-400" />
                    <h3 className="text-sm font-black uppercase tracking-widest">SAP Records (Mock Backend)</h3>
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <span className="text-[10px] font-black text-slate-400 uppercase">PO Reference</span>
                          <p className="text-lg font-black text-slate-800">#{selectedInvoice.po}</p>
                       </div>
                       <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <span className="text-[10px] font-black text-slate-400 uppercase">Goods Receipt Qty</span>
                          <p className="text-lg font-black text-slate-800">{sapData[selectedInvoice.po]?.grQty} units</p>
                       </div>
                    </div>
                    <div className="bg-slate-900 text-white rounded-2xl p-6 flex justify-between items-center">
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase">Agreed Unit Price</p>
                          <p className="text-xl font-black">${sapData[selectedInvoice.po]?.unitPrice.toFixed(2)}</p>
                       </div>
                       <ShieldCheck className="w-10 h-10 text-blue-500 opacity-20" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. AI Reasoning & Decision */}
              {activeStep === 3 && auditResult && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
                  <div className="p-6 bg-red-600 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3 font-black text-xs uppercase tracking-[0.2em]">
                       <AlertCircle className="w-5 h-5" /> AI Verification Exception Found
                    </div>
                  </div>
                  <div className="p-10 flex flex-col md:flex-row gap-12">
                    <div className="flex-1 space-y-6">
                       <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Auditor Reasoning Log</h4>
                       <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-slate-700 italic text-lg leading-relaxed shadow-inner">
                         "{auditResult.finding}"
                       </div>
                    </div>
                    <div className="w-full md:w-80 flex flex-col justify-end gap-4">
                       <button 
                        onClick={() => handleFinalAction('Disputed')}
                        className="w-full py-4 bg-white border-2 border-slate-200 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all text-slate-500 hover:border-red-500 hover:text-red-500"
                       >
                         Raise Dispute
                       </button>
                       <button 
                        onClick={() => handleFinalAction('Posted')}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-300 hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                       >
                         <CheckCircle className="w-5 h-5" /> Approve & Post to ERP
                       </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6">
               <div className="bg-white p-10 rounded-[40px] shadow-xl border border-slate-200">
                  <Package className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                  <h3 className="text-xl font-bold text-slate-800">Operational Readiness</h3>
                  <p className="text-sm text-slate-400 mt-2 font-medium">Please select an invoice from the vendor queue on the left to initiate the AI-driven 3-way match process.</p>
               </div>
               <div className="flex gap-4">
                  <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                     <History className="w-5 h-5 text-slate-300" />
                     <div className="text-left">
                        <p className="text-lg font-black text-slate-800">14</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Historical Audits</p>
                     </div>
                  </div>
                  <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                     <Share2 className="w-5 h-5 text-slate-300" />
                     <div className="text-left">
                        <p className="text-lg font-black text-slate-800">100%</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Notion Hub Sync</p>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer / Meta */}
      <footer className="bg-white border-t border-slate-200 px-8 py-3 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
         <div className="flex gap-6">
            <span>Env: Vercel Production</span>
            <span>API Integrity: 200 OK</span>
         </div>
         <div className="flex gap-4 items-center">
            <span>Secure Audit Verified</span>
            <ShieldCheck className="w-3 h-3 text-blue-500" />
         </div>
      </footer>
    </div>
  );
};

export default App;