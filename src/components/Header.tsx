/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Activity, ShieldAlert, BookOpen, Search, Sun, Moon, Database, Calendar, Stethoscope, Menu, X, UserCheck, Layers } from "lucide-react";
import HealicLogo from "./HealicLogo";

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  onOpenAdmin: () => void;
  alertCount: number;
}

export default function Header({
  currentTab,
  setCurrentTab,
  searchQuery,
  setSearchQuery,
  theme,
  toggleTheme,
  onOpenAdmin,
  alertCount
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const tabs = [
    { id: "news", label: "Latest News", icon: Activity },
    { id: "editorials", label: "Editorials", icon: UserCheck },
    { id: "guidelines", label: "Current Guidelines", icon: BookOpen },
    { id: "pharma-drugs", label: "Pharma and Drugs", icon: Layers },
    { id: "alerts", label: "Hospital Intelligence", icon: ShieldAlert },
    { id: "treatment-updates", label: "Treatment Update", icon: Stethoscope },
    { id: "events", label: "Scientific Events", icon: Calendar }
  ];

  const categories = [
    "Clinical",
    "Research",
    "Pharma and Drugs",
    "Health Technology",
    "Policy and Public Health"
  ];

  const activeCategory = searchQuery.startsWith("category:") ? searchQuery.split(":")[1] : (searchQuery === "" && currentTab === "news" ? "All" : "");

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Name */}
          <div 
            className="flex items-center space-x-2.5 cursor-pointer shrink-0" 
            onClick={() => {
              setCurrentTab("news");
              setMobileMenuOpen(false);
            }}
          >
            <HealicLogo className="w-10 h-10" />
            <div className="flex flex-col justify-center">
              <span className="text-xl sm:text-2xl font-black font-sans tracking-tight text-zinc-900 dark:text-white uppercase leading-none">
                HEALIC<span className="text-teal-600 dark:text-teal-400">WIRE</span>
              </span>
              <p className="text-[10px] sm:text-[11px] font-sans font-semibold text-zinc-500 dark:text-zinc-400 leading-tight tracking-normal mt-0.5">
                Healthcare News & Intelligence
              </p>
            </div>
          </div>

          {/* Primary Navigation - Desktop */}
          <nav className="hidden lg:flex items-center space-x-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? "bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 font-bold"
                      : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.id === "alerts" && alertCount > 0 && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Actions & Search */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Desktop Search Input */}
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search medical news..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-44 lg:w-56 pl-8 pr-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
            </div>

            {/* Mobile Search Toggle */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden p-2 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
              title="Toggle Theme"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Admin CMS Access (contrl-panl) */}
            <button
              onClick={onOpenAdmin}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-teal-600/40 dark:border-teal-400/40 text-xs font-mono font-bold text-teal-700 dark:text-teal-300 bg-teal-50/60 dark:bg-teal-950/40 hover:bg-teal-100/80 transition-all shadow-2xs"
              title="Control Panel (contrl-panl)"
            >
              <Database className="w-3.5 h-3.5 text-teal-600" />
              <span>contrl-panl</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Overlay Bar */}
        {mobileSearchOpen && (
          <div className="md:hidden pb-3 pt-1 border-t border-zinc-100 dark:border-zinc-850">
            <div className="relative">
              <input
                type="text"
                placeholder="Search medical news..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-8 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white"
              />
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 space-y-1.5 shadow-lg animate-fade-in">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setCurrentTab(tab.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-teal-600 text-white font-bold"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </div>
                {tab.id === "alerts" && alertCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-red-500 text-white">
                    {alertCount} ALERT
                  </span>
                )}
              </button>
            );
          })}

          {/* Dedicated contrl-panl Mobile Button */}
          <button
            onClick={() => {
              onOpenAdmin();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-xs font-mono font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 border border-teal-200 dark:border-teal-800"
          >
            <Database className="w-4 h-4 text-teal-600" />
            <span>contrl-panl</span>
          </button>
        </div>
      )}

      {/* Dedicated Category Pill Bar (Desktop & Mobile Parity - Flex Wrap on Mobile) */}
      <div className="border-t border-zinc-150 dark:border-zinc-850 bg-zinc-50/95 dark:bg-zinc-950/80 py-2">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
          <span className="font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-[9.5px] sm:text-[10px] shrink-0 mr-0.5">
            CATEGORIES:
          </span>

          {/* ALL Pill */}
          <button
            onClick={() => {
              setCurrentTab("news");
              setSearchQuery("");
            }}
            className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10.5px] sm:text-xs font-semibold border transition-all ${
              activeCategory === "All"
                ? "bg-teal-600 text-white border-teal-600 shadow-xs font-bold"
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            All
          </button>

          {/* Categories Pills */}
          {categories.map(cat => {
            const isCatActive = activeCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => {
                  setCurrentTab("news");
                  setSearchQuery(`category:${cat}`);
                }}
                className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10.5px] sm:text-xs font-semibold border transition-all ${
                  isCatActive
                    ? "bg-teal-600 text-white border-teal-600 shadow-xs font-bold"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {cat}
              </button>
            );
          })}

          <div className="hidden sm:block h-4 w-[1px] bg-zinc-200 dark:border-zinc-800 mx-0.5" />

          {/* India Focus Badge */}
          <button
            onClick={() => {
              setCurrentTab("news");
              setSearchQuery("region:india");
            }}
            className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10.5px] sm:text-xs font-bold flex items-center space-x-1 border transition-all ${
              searchQuery === "region:india"
                ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                : "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-300/80 dark:border-amber-800/80 hover:bg-amber-100"
            }`}
          >
            <span>🇮🇳</span>
            <span>India Focus</span>
          </button>
        </div>
      </div>
    </header>
  );
}
