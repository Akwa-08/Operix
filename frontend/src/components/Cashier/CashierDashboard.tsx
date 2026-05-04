import { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp, DollarSign,
  Package, AlertTriangle, CheckCircle, Clock,
  Banknote, Search, X, ChevronDown, Loader,
} from "lucide-react";
import { useDashboard, useCashierCashAdvances, useEmployees } from "../../hooks/useSupabase";
import type { CashAdvanceEligibility } from "../../hooks/useSupabase";
import { LoadingSpinner } from "../Shared/UI/LoadingSpinner";

const CA_LIMIT = 2000;
const fmt = (n: number) => `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
function fmtMoney(v: number | undefined | null) {
  const n = Number(v) || 0;
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000)    return `₱${(n / 1_000).toFixed(1)}k`;
  return `₱${n.toLocaleString()}`;
}

const KpiCard: React.FC<{
  title: string; value: string; sub?: string;
  icon: React.ReactNode; iconBg: string; iconColor: string;
  accent?: "red"|"green"|"yellow"|"blue"|"amber"|"none";
}> = ({ title, value, sub, icon, iconBg, iconColor, accent = "none" }) => {
  const border = { red:"border-l-4 border-l-red-400", green:"border-l-4 border-l-green-400", yellow:"border-l-4 border-l-amber-400", blue:"border-l-4 border-l-cyan-400", amber:"border-l-4 border-l-amber-500", none:"" }[accent];
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm ${border}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight">{title}</p>
        <div className={`p-2 rounded-lg ${iconBg} ${iconColor}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-0.5 truncate">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
};



function CashAdvanceModal({ onClose, onSubmit, checkEligibility }: {
  onClose: () => void;
  onSubmit: (d: { employee_id: string; amount: number; reason?: string }) => Promise<{ success: boolean; error: string | null }>;
  checkEligibility: (id: string) => Promise<CashAdvanceEligibility>;
}) {
  const { employees: rawEmployees } = useEmployees();
  const [search, setSearch] = useState('');
  const [showDrop, setShowDrop] = useState(false);
  const [selEmp, setSelEmp] = useState<any>(null);
  const [eligibility, setEligibility] = useState<CashAdvanceEligibility | null>(null);
  const [checking, setChecking] = useState(false);
  const [amount, setAmount] = useState<string>(String(CA_LIMIT));
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedAmount, setSubmittedAmount] = useState(0);
  const [err, setErr] = useState('');

  const parsedAmount = Number(amount) || 0;
  const maxAllowed = eligibility?.remaining ?? CA_LIMIT;
  const amountValid = parsedAmount > 0 && parsedAmount <= maxAllowed;

  const employees = (rawEmployees as any[]).filter(e => e.is_active);
  const filtered = useMemo(() =>
    !search.trim() ? [] :
    employees.filter((e: any) =>
      e.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      e.employee_code?.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 8),
    [search, employees]
  );

  const handleSelect = useCallback(async (emp: any) => {
    setSelEmp(emp); setSearch(emp.full_name); setShowDrop(false);
    setEligibility(null); setErr(''); setChecking(true);
    setAmount(String(CA_LIMIT));
    try {
      const result = await checkEligibility(emp.id);
      setEligibility(result);
      // Pre-fill amount with remaining available
      if (result.eligible) setAmount(String(result.remaining));
    }
    catch { setEligibility({ eligible: false, reason: 'limit_reached', remaining: 0, totalUsed: 0 }); }
    finally { setChecking(false); }
  }, [checkEligibility]);

  const handleSubmit = async () => {
    if (!selEmp || !eligibility?.eligible) return;
    if (!amountValid) { setErr(`Amount must be between ₱1 and ${fmt(maxAllowed)}.`); return; }
    setSubmitting(true); setErr('');
    const r = await onSubmit({ employee_id: selEmp.id, amount: parsedAmount, reason: reason || undefined });
    if (r.success) { setSubmittedAmount(parsedAmount); setSubmitted(true); }
    else setErr(r.error || 'Failed');
    setSubmitting(false);
  };

  const badge = () => {
    if (checking) return <span className="flex items-center gap-1 text-xs text-gray-400"><Loader size={12} className="animate-spin"/>Checking...</span>;
    if (!eligibility) return null;
    if (eligibility.eligible) {
      return (
        <div className="flex items-center gap-1.5">
          {eligibility.totalUsed > 0 && (
            <span className="text-[10px] text-amber-600 font-semibold">{fmt(eligibility.totalUsed)} used</span>
          )}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
            <CheckCircle size={12}/>Eligible · {fmt(eligibility.remaining)} left
          </span>
        </div>
      );
    }
    if (eligibility.reason === 'restricted_next_period') return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
        <AlertTriangle size={12}/>Restricted — CA Pending Deduction
      </span>
    );
    if (eligibility.reason === 'approved_awaiting_deduction') return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
        <CheckCircle size={12}/>Issued — Deduction Scheduled
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
        <AlertTriangle size={12}/>₱2,000 Period Limit Reached
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg"><X size={20}/></button>

        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600"/>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Request Submitted!</h3>
            <p className="text-sm text-gray-500 mb-1">
              <strong>{fmt(submittedAmount)}</strong> advance requested for <strong>{selEmp?.full_name}</strong>.
            </p>
            <p className="text-xs text-gray-400 mb-6">Admin will be notified in their Payroll Dashboard.</p>
            <button onClick={onClose} className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl text-sm">Done</button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Banknote size={20} className="text-amber-600"/>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Request Cash Advance</h3>
                <p className="text-xs text-gray-400">Maximum {fmt(CA_LIMIT)} per 15-day period</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Employee Search */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Employee *</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input type="text" value={search}
                    onChange={e => { setSearch(e.target.value); setShowDrop(true); setSelEmp(null); setEligibility(null); }}
                    onFocus={() => setShowDrop(true)}
                    placeholder="Search by name or code..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                </div>
                {showDrop && filtered.length > 0 && (
                  <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden max-h-48 overflow-y-auto">
                    {filtered.map((emp: any) => (
                      <button key={emp.id} onClick={() => handleSelect(emp)}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{emp.full_name}</p>
                          <p className="text-xs text-gray-400">{emp.position} · {emp.employee_code}</p>
                        </div>
                        <ChevronDown size={14} className="text-gray-400"/>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Eligibility */}
              {selEmp && (
                <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-50 border border-gray-200">
                  <span className="text-sm text-gray-600 font-medium">Eligibility Status</span>
                  <div className="flex items-center gap-2">
                    {badge()}
                    {eligibility && !checking && (
                      <button onClick={() => handleSelect(selEmp)} title="Re-check eligibility"
                        className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Amount input — max = remaining this period */}
              {selEmp && eligibility?.eligible && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Amount Requested (₱) *
                    <span className="text-xs text-gray-400 font-normal ml-1">
                      max {fmt(maxAllowed)}
                      {(eligibility.totalUsed ?? 0) > 0 && ` · ${fmt(eligibility.totalUsed)} already used this period`}
                    </span>
                  </label>
                  {(eligibility.totalUsed ?? 0) > 0 && (
                    <div className="mb-2">
                      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${Math.min(100, ((eligibility.totalUsed ?? 0) / CA_LIMIT) * 100)}%` }}/>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{fmt(eligibility.totalUsed ?? 0)} of {fmt(CA_LIMIT)} used this period</p>
                    </div>
                  )}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">₱</span>
                    <input type="number" min="1" max={maxAllowed} step="1" value={amount}
                      onChange={e => {
                        const v = e.target.value; setAmount(v);
                        const n = Number(v);
                        if (n > maxAllowed) setErr(`Amount cannot exceed remaining ${fmt(maxAllowed)}.`);
                        else if (n <= 0 && v !== '') setErr('Amount must be greater than ₱0.');
                        else setErr('');
                      }}
                      className={`w-full pl-7 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 font-semibold
                        ${!amountValid && amount !== '' ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-cyan-500'}`}
                    />
                  </div>
                  {parsedAmount > maxAllowed && (
                    <p className="text-xs text-red-600 mt-1 font-semibold">⚠ Exceeds remaining {fmt(maxAllowed)}.</p>
                  )}
                  {parsedAmount > 0 && parsedAmount <= maxAllowed && (
                    <p className="text-xs text-amber-600 mt-1">Requires admin approval before disbursement.</p>
                  )}
                </div>
              )}

              {/* Status messages when ineligible */}
              {selEmp && eligibility && !eligibility.eligible && (
                <div className={`px-4 py-3 rounded-lg border flex items-start gap-2 ${
                  eligibility.reason === 'restricted_next_period' ? 'bg-orange-50 border-orange-200' :
                  eligibility.reason === 'approved_awaiting_deduction' ? 'bg-blue-50 border-blue-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  {eligibility.reason === 'approved_awaiting_deduction'
                    ? <CheckCircle size={14} className="text-blue-600 flex-shrink-0 mt-0.5"/>
                    : eligibility.reason === 'restricted_next_period'
                    ? <AlertTriangle size={14} className="text-orange-600 flex-shrink-0 mt-0.5"/>
                    : <AlertTriangle size={14} className="text-red-600 flex-shrink-0 mt-0.5"/>}
                  <div>
                    {eligibility.reason === 'restricted_next_period' && (
                      <>
                        <p className="text-xs font-bold text-orange-800 mb-0.5">Restricted — Previous Period Had CA</p>
                        <p className="text-xs text-orange-700">
                          This employee received a {eligibility.detail ? fmt(eligibility.detail.amount) : ''} Cash Advance
                          in the previous payroll period ({eligibility.detail?.periodLabel || 'prior period'}).
                          Per policy, they cannot request a new CA in the immediately following period.
                          Their previous CA will be deducted from this period's payroll.
                        </p>
                      </>
                    )}
                    {eligibility.reason === 'approved_awaiting_deduction' && (
                      <>
                        <p className="text-xs font-bold text-blue-800 mb-0.5">CA Issued — Awaiting Deduction Next Period</p>
                        <p className="text-xs text-blue-700">
                          This employee's Cash Advance was issued in the current payroll period.
                          The full amount will be automatically deducted in the next payroll period.
                        </p>
                      </>
                    )}
                    {eligibility.reason === 'limit_reached' && (
                      <>
                        <p className="text-xs font-bold text-red-800 mb-0.5">Period Limit Reached</p>
                        <p className="text-xs text-red-700">
                          This employee has reached the {fmt(CA_LIMIT)} maximum for this 15-day payroll period.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Reason */}
              {selEmp && eligibility?.eligible && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Reason (optional)</label>
                  <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
                    placeholder="e.g. Medical emergency, urgent expense..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"/>
                </div>
              )}

              {err && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={onClose} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm">Cancel</button>
              <button onClick={handleSubmit}
                disabled={!selEmp || !eligibility?.eligible || !amountValid || submitting}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm">
                {submitting ? 'Submitting...' : `Submit (${parsedAmount > 0 ? fmt(parsedAmount) : '—'})`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const CashierDashboard = () => {
  const navigate = useNavigate();
  const { orderStats, invStats, recentOrders, loading } = useDashboard();
  const { pendingCount, submitRequest, checkEligibility, refresh: refreshCA } = useCashierCashAdvances();
  const [showCA, setShowCA] = useState(false);

  const dateStr = new Date().toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" });

  const handleSubmitCA = async (d: { employee_id: string; amount: number; reason?: string }) => {
    const r = await submitRequest(d);
    if (r.success) refreshCA();
    return r;
  };

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {showCA && <CashAdvanceModal onClose={() => setShowCA(false)} onSubmit={handleSubmitCA} checkEligibility={checkEligibility}/>}

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Cashier Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">{dateStr}</p>
      </div>

      {/* 7 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <KpiCard title="Total Orders" value={`${orderStats?.total ?? 0}`} sub="All orders" icon={<Package size={16}/>} iconBg="bg-blue-100" iconColor="text-blue-600" accent="blue"/>
        <KpiCard title="Active Work" value={`${(orderStats?.inQueue ?? 0)+(orderStats?.designing ?? 0)+(orderStats?.payment ?? 0)+(orderStats?.production ?? 0)}`} sub="Work in progress" icon={<Clock size={16}/>} iconBg="bg-orange-100" iconColor="text-orange-600" accent="yellow"/>
        <KpiCard title="Ready Pickup" value={`${orderStats?.pickup ?? 0}`} sub="Awaiting client" icon={<Package size={16}/>} iconBg="bg-cyan-100" iconColor="text-cyan-600" accent="blue"/>
        <KpiCard title="Completed" value={`${orderStats?.completed ?? 0}`} sub="Finished" icon={<CheckCircle size={16}/>} iconBg="bg-green-100" iconColor="text-green-600"/>
        <KpiCard title="Low Stock" value={`${invStats?.lowStock ?? 0}`} sub="Need attention" icon={<AlertTriangle size={16}/>} iconBg="bg-red-100" iconColor="text-red-600" accent={invStats?.lowStock > 0 ? "red" : "none"}/>
        <KpiCard title="Total Revenue" value={fmtMoney(orderStats?.totalRevenue)} sub="All time" icon={<TrendingUp size={16}/>} iconBg="bg-indigo-100" iconColor="text-indigo-600"/>
        <KpiCard title="Collected" value={fmtMoney(orderStats?.totalCollected)} sub="Cash received" icon={<DollarSign size={16}/>} iconBg="bg-emerald-100" iconColor="text-emerald-600" accent="green"/>
        <KpiCard title="Cash Advances" value={`${pendingCount}`} sub="Pending approval" icon={<Banknote size={16}/>} iconBg="bg-amber-100" iconColor="text-amber-600" accent={pendingCount > 0 ? "amber" : "none"}/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Primary Action Section */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 shadow-lg shadow-amber-200 relative overflow-hidden group transition-all hover:shadow-xl hover:-translate-y-1">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"/>
            
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-5 border border-white/30">
                <Banknote size={24} className="text-white"/>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Request Cash Advance</h3>
              <p className="text-amber-100 text-sm mb-6 leading-relaxed">
                Quickly submit financial assistance requests for employees. Maximum ₱2,000 per period.
              </p>
              
              <button 
                onClick={() => setShowCA(true)}
                className="w-full py-3 bg-white text-orange-600 font-bold rounded-xl text-sm shadow-sm hover:bg-orange-50 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Start New Request
                <CheckCircle size={16}/>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500"/>
              Inventory Alerts
            </h3>
            {invStats?.lowStock > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">{invStats.lowStock} items are below reorder point.</p>
                <button 
                  onClick={() => navigate("/cashier/inventory")}
                  className="w-full py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors"
                >
                  Restock Now
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-400">All inventory levels are healthy.</p>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">Recent Orders</h3>
            <button onClick={() => navigate("/cashier/orders")} className="text-xs font-semibold text-cyan-600 hover:text-cyan-700">View All</button>
          </div>
          {!recentOrders?.length ? (
            <div className="text-center py-10 text-gray-400 text-sm">No recent orders.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-3 pr-4 text-xs font-semibold text-gray-500 uppercase">Order ID</th>
                    <th className="pb-3 px-4 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Customer</th>
                    <th className="pb-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="pb-3 pl-4 text-xs font-semibold text-gray-500 uppercase text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map((o: any) => (
                    <tr key={o.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => navigate("/cashier/orders")}>
                      <td className="py-3 pr-4 font-medium text-gray-900 text-sm">{o.orderId || o.id?.slice(0,8)}</td>
                      <td className="py-3 px-4 text-gray-600 text-sm hidden sm:table-cell truncate max-w-[120px]">{o.customerName || 'Walk-in'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold
                          ${String(o.status).includes('complete') ? "bg-gray-100 text-gray-600" :
                            String(o.status).toLowerCase().includes('queue') ? "bg-blue-100 text-blue-700" :
                            String(o.status).toLowerCase().includes('pickup') ? "bg-green-100 text-green-700" :
                            "bg-purple-100 text-purple-700"}`}>
                          {String(o.status).replace("_"," ")}
                        </span>
                      </td>
                      <td className="py-3 pl-4 text-right font-medium text-gray-900 text-sm">{fmtMoney(o.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Policy Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Banknote size={18} className="text-amber-600 flex-shrink-0 mt-0.5"/>
        <div>
          <p className="text-sm font-bold text-amber-800 mb-0.5">Cash Advance Policy</p>
          <p className="text-xs text-amber-700">
            Maximum <strong>{fmt(CA_LIMIT)}</strong> per 15-day period per employee. All requests require admin approval.
            If deductions exceed net salary, the deficit carries over to the next payroll period.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CashierDashboard;