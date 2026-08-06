/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ShieldAlert, AlertTriangle, Info, BellRing, Filter, Clock, MapPin, CheckCircle, Plus, Send } from "lucide-react";
import { HospitalAlert, ImpactSeverity } from "../types";
import { supabase, mapAlertFromDB } from "../lib/supabase";
import { authFetch } from "../lib/api";

export default function HospitalIntelligence() {
  const [alerts, setAlerts] = useState<HospitalAlert[]>([]);
  const [filterDept, setFilterDept] = useState("All");
  const [filterSeverity, setFilterSeverity] = useState("All");
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('hospital_alerts')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      if (data) {
        setAlerts(data.map(mapAlertFromDB));
      }
    } catch (err) {
      console.error("Error fetching hospital alerts:", err);
    } finally {
      setLoading(false);
    }
  };



  const getSeverityBadge = (sev: ImpactSeverity | string | undefined) => {
    const s = (sev || "").toLowerCase();
    if (s.includes("critical")) {
      return "bg-red-500 text-white dark:bg-red-950/80 dark:text-red-300 border-red-600";
    }
    if (s.includes("urgent") || s.includes("high")) {
      return "bg-orange-500 text-white dark:bg-orange-950/80 dark:text-orange-300 border-orange-600";
    }
    if (s.includes("monitor") || s.includes("moderate")) {
      return "bg-amber-400 text-zinc-950 dark:bg-amber-950/60 dark:text-amber-300 border-amber-500";
    }
    return "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900";
  };

  const getUrgencyIndicator = (urgency: string) => {
    switch (urgency) {
      case "Critical":
        return <AlertTriangle className="w-4 h-4 text-red-500 animate-bounce" />;
      case "Immediate":
        return <BellRing className="w-4 h-4 text-orange-500 animate-pulse" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  // Collect all unique departments for filters
  const allDepts = Array.from(
    new Set(alerts.flatMap(a => [
      ...(a.departmentsAffected || []),
      ...(a.departmentsImpacted || [])
    ]))
  ).filter(Boolean);

  const filteredAlerts = alerts.filter(a => {
    const combinedDepts = [...(a.departmentsAffected || []), ...(a.departmentsImpacted || [])];
    const matchDept = filterDept === "All" || combinedDepts.some(d => d.toLowerCase() === filterDept.toLowerCase());
    const matchSeverity = filterSeverity === "All" || (a.severity || "").toLowerCase().includes(filterSeverity.toLowerCase());
    return matchDept && matchSeverity;
  });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-6 mb-8">
        <div>
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 mb-2">
            <ShieldAlert className="w-5 h-5" />
            <span className="text-xs font-mono tracking-widest uppercase font-bold">Institutional Security</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
            Clinical Alerts
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-xl">
            Real-time critical operational warnings, drug shortages, medical device recalls, and local health outbreak advisories.
          </p>
        </div>


      </div>



      {/* Filter Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 mb-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
        <div className="flex items-center space-x-2 text-zinc-500 dark:text-zinc-400">
          <Filter className="w-4 h-4" />
          <span className="text-xs font-mono uppercase tracking-wider font-semibold">Triage Filters</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-mono text-zinc-400">Department:</span>
            <select
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
              className="px-2.5 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="All">All Departments</option>
              {allDepts.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-mono text-zinc-400">Severity:</span>
            <select
              value={filterSeverity}
              onChange={e => setFilterSeverity(e.target.value)}
              className="px-2.5 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical Only</option>
              <option value="Urgent">Urgent Only</option>
              <option value="Monitor">Monitor Only</option>
              <option value="Informational">Informational Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts Grid/List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-zinc-100 dark:bg-zinc-900 rounded-xl" />
          ))}
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No warnings or advisories match the selected triage criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map(alert => (
            <div
              key={alert.id}
              className={`relative border rounded-xl p-5 bg-white dark:bg-zinc-950 transition-all duration-200 border-l-4 ${
                alert.severity === ImpactSeverity.CRITICAL
                  ? "border-red-500 hover:border-red-600 shadow-sm"
                  : alert.severity === ImpactSeverity.URGENT
                  ? "border-orange-500 hover:border-orange-600"
                  : alert.severity === ImpactSeverity.MONITOR
                  ? "border-amber-400 hover:border-amber-500"
                  : "border-blue-400 hover:border-blue-500"
              }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[9.5px] font-mono uppercase tracking-widest font-bold px-2 py-0.5 rounded border ${getSeverityBadge(alert.severity)}`}>
                    {alert.severity || 'Information'}
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-800">•</span>
                  <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[10.5px] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(alert.effectiveDate || alert.date || Date.now()).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-800">•</span>
                  <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[10.5px] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Source: {alert.evidenceSource || alert.source}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-1 bg-zinc-50 dark:bg-zinc-900 p-1.5 rounded-md text-[10.5px] font-mono text-zinc-600 dark:text-zinc-300">
                  {getUrgencyIndicator(alert.urgency || "Routine")}
                  <span className="font-semibold uppercase tracking-wider">{alert.currentStatus || alert.urgency || "Active"}</span>
                </div>
              </div>

              {/* Headline & Category */}
              {alert.alertCategory && (
                <div className="mb-1">
                  <span className="text-[10px] font-mono font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                    {alert.alertCategory}
                  </span>
                </div>
              )}
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white mb-2 leading-snug">
                {alert.title || alert.headline}
              </h3>
              
              {/* Summary */}
              {alert.summary && (
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                  {alert.summary}
                </p>
              )}

              {/* Action and affected departments */}
              <div className="mt-4 space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-900">
                <div className="text-xs">
                  <strong className="text-zinc-700 dark:text-zinc-200 block mb-1">Recommended Response Protocols:</strong>
                  {alert.recommendedHospitalActions && alert.recommendedHospitalActions.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1 text-zinc-600 dark:text-zinc-400">
                      {alert.recommendedHospitalActions.map((action, i) => (
                        <li key={i}>{action}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-mono whitespace-pre-wrap">
                      {alert.recommendedAction}
                    </p>
                  )}
                </div>

                {alert.whoIsAffected && alert.whoIsAffected.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 items-center pt-1">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mr-1.5">Who Is Affected:</span>
                    {alert.whoIsAffected.map(who => (
                      <span
                        key={who}
                        className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-mono text-[10px] border border-zinc-200/40 dark:border-zinc-850"
                      >
                        {who}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 items-center pt-1">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mr-1.5">Affected Units:</span>
                  {[...(alert.departmentsImpacted || []), ...(alert.departmentsAffected || [])].filter((v, i, a) => a.indexOf(v) === i).map(dept => (
                    <span
                      key={dept}
                      className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-mono text-[10px] border border-zinc-200/40 dark:border-zinc-850"
                    >
                      {dept}
                    </span>
                  ))}
                </div>
                
                {alert.officialReference && alert.officialReference !== "#" && (
                  <div className="pt-2">
                    <a href={alert.officialReference} target="_blank" rel="noreferrer" className="text-[10px] font-mono text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center">
                      View Official Advisory ↗
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
