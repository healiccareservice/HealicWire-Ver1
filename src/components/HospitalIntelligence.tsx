/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ShieldAlert, AlertTriangle, Info, BellRing, Filter, Clock, MapPin, CheckCircle, Plus, Send } from "lucide-react";
import { HospitalAlert, ImpactSeverity } from "../types";

export default function HospitalIntelligence() {
  const [alerts, setAlerts] = useState<HospitalAlert[]>([]);
  const [filterDept, setFilterDept] = useState("All");
  const [filterSeverity, setFilterSeverity] = useState("All");
  const [loading, setLoading] = useState(true);

  // Form for new alert (visible for clinical staff or simulation)
  const [showAddForm, setShowAddForm] = useState(false);
  const [formHeadline, setFormHeadline] = useState("");
  const [formSeverity, setFormSeverity] = useState<ImpactSeverity>(ImpactSeverity.INFORMATIONAL);
  const [formUrgency, setFormUrgency] = useState<"Routine" | "Immediate" | "Critical">("Routine");
  const [formDepts, setFormDepts] = useState("");
  const [formAction, setFormAction] = useState("");
  const [formSource, setFormSource] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = () => {
    fetch("/api/hospital-alerts")
      .then(res => res.json())
      .then(data => {
        setAlerts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching hospital alerts:", err);
        setLoading(false);
      });
  };

  const handleSubmitAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formHeadline || !formAction) return;

    const payload = {
      headline: formHeadline,
      severity: formSeverity,
      urgency: formUrgency,
      departmentsAffected: formDepts.split(",").map(d => d.trim()).filter(Boolean),
      recommendedAction: formAction,
      source: formSource || "Internal Administration"
    };

    fetch("/api/admin/hospital-alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(() => {
        setSubmitSuccess(true);
        setFormHeadline("");
        setFormAction("");
        setFormDepts("");
        setFormSource("");
        fetchAlerts();
        setTimeout(() => {
          setSubmitSuccess(false);
          setShowAddForm(false);
        }, 1500);
      })
      .catch(err => console.error("Error submitting alert:", err));
  };

  const getSeverityBadge = (sev: ImpactSeverity) => {
    switch (sev) {
      case ImpactSeverity.CRITICAL:
        return "bg-red-500 text-white dark:bg-red-950/80 dark:text-red-300 border-red-600";
      case ImpactSeverity.URGENT:
        return "bg-orange-500 text-white dark:bg-orange-950/80 dark:text-orange-300 border-orange-600";
      case ImpactSeverity.MONITOR:
        return "bg-amber-400 text-zinc-950 dark:bg-amber-950/60 dark:text-amber-300 border-amber-500";
      default:
        return "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900";
    }
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
    new Set(alerts.flatMap(a => a.departmentsAffected))
  );

  const filteredAlerts = alerts.filter(a => {
    const matchDept = filterDept === "All" || a.departmentsAffected.some(d => d.toLowerCase() === filterDept.toLowerCase());
    const matchSeverity = filterSeverity === "All" || a.severity.toLowerCase() === filterSeverity.toLowerCase();
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
            Hospital Intelligence Dashboard
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-xl">
            Real-time critical operational warnings, drug shortages, medical device recalls, and local health outbreak advisories.
          </p>
        </div>

        {/* Trigger Alert Simulation Button */}
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="mt-4 sm:mt-0 flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white shadow-md shadow-red-500/10 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Broadcast Warning</span>
        </button>
      </div>

      {/* Broadcast Form (Collapsible modal/card) */}
      {showAddForm && (
        <div className="mb-8 p-6 rounded-2xl border border-red-500/25 bg-red-500/5 dark:bg-red-950/10 shadow-sm animate-fadeIn">
          <h3 className="text-sm font-bold text-red-700 dark:text-red-400 uppercase tracking-wider font-mono flex items-center space-x-2 mb-4">
            <BellRing className="w-4 h-4 animate-bounce" />
            <span>Emergency Broadcast Transmitter</span>
          </h3>

          {submitSuccess ? (
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 text-sm font-mono p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle className="w-5 h-5" />
              <span>Broadcast Dispatched Successfully! Live on platform.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmitAlert} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1">
                    Alert Headline
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Shortage of IV Heparin 5000 IU"
                    value={formHeadline}
                    onChange={e => setFormHeadline(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1">
                    Issuing Source
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Central Drugs Standard Control Organisation"
                    value={formSource}
                    onChange={e => setFormSource(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1">
                    Severity Tier
                  </label>
                  <select
                    value={formSeverity}
                    onChange={e => setFormSeverity(e.target.value as ImpactSeverity)}
                    className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white focus:outline-none"
                  >
                    <option value={ImpactSeverity.CRITICAL}>Critical (Red)</option>
                    <option value={ImpactSeverity.URGENT}>Urgent (Orange)</option>
                    <option value={ImpactSeverity.MONITOR}>Monitor (Amber)</option>
                    <option value={ImpactSeverity.INFORMATIONAL}>Informational (Blue)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1">
                    Urgency Speed
                  </label>
                  <select
                    value={formUrgency}
                    onChange={e => setFormUrgency(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white focus:outline-none"
                  >
                    <option value="Critical">Critical (Immediate Evacuation/Stop)</option>
                    <option value="Immediate">Immediate Action Required</option>
                    <option value="Routine">Routine Monitor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1">
                    Affected Departments (Comma Separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Pediatrics, Pharmacy, ER"
                    value={formDepts}
                    onChange={e => setFormDepts(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1">
                  Required Clinical Action Points
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe step-by-step clinical actions, quarantines, or substitutions to execute immediately."
                  value={formAction}
                  onChange={e => setFormAction(e.target.value)}
                  className="w-full p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-1 px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs text-white font-semibold shadow-md shadow-red-500/10"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit Broadcast</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

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
                    {alert.severity}
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-800">•</span>
                  <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[10.5px] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(alert.date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-800">•</span>
                  <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[10.5px] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Source: {alert.source}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-1 bg-zinc-50 dark:bg-zinc-900 p-1.5 rounded-md text-[10.5px] font-mono text-zinc-600 dark:text-zinc-300">
                  {getUrgencyIndicator(alert.urgency)}
                  <span className="font-semibold uppercase tracking-wider">{alert.urgency} Action</span>
                </div>
              </div>

              {/* Headline */}
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white mb-2 leading-snug">
                {alert.headline}
              </h3>

              {/* Action and affected departments */}
              <div className="mt-4 space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-900">
                <div className="text-xs">
                  <strong className="text-zinc-700 dark:text-zinc-200 block mb-1">Recommended Response Protocols:</strong>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-mono whitespace-pre-wrap">
                    {alert.recommendedAction}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 items-center pt-2">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mr-1.5">Affected Units:</span>
                  {alert.departmentsAffected.map(dept => (
                    <span
                      key={dept}
                      className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-mono text-[10px] border border-zinc-200/40 dark:border-zinc-850"
                    >
                      {dept}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
