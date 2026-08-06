import React, { useState, useRef, useEffect } from 'react';
import { Search, ShieldCheck, Copy, Share2, Download, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const EXAMPLES = [
  "Does intermittent fasting reverse diabetes?",
  "Vitamin D prevents cancer.",
  "Coffee reduces cardiovascular mortality.",
  "Chandipura Virus has a mortality rate of 70%."
];

export const FactCheckWidget: React.FC = () => {
  const [claim, setClaim] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAnalyzing && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [response, isAnalyzing]);

  const handleDownloadPDF = async () => {
    if (!response) return;
    try {
      setIsGeneratingPdf(true);
      const element = document.getElementById('pdf-template');
      if (!element) return;
      
      // Temporarily make it visible for html2pdf to capture properly
      const parent = element.parentElement;
      if (parent) {
        parent.style.position = 'absolute';
        parent.style.left = '-9999px';
        parent.style.display = 'block';
      }
      
      // @ts-ignore
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;
      
      const opt = {
        margin:       [10, 10, 10, 10] as [number, number, number, number],
        filename:     'HealicWire-FactCheck.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt as any).from(element).save();
      
      // Hide it back
      if (parent) {
        parent.style.display = 'none';
        parent.style.position = 'static';
        parent.style.left = 'auto';
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleShare = async () => {
    if (!response) return;
    try {
      const shareData = {
        title: 'HealicWire FactCheck',
        text: `Check out this Evidence-Based FactCheck Report by HealicWire 🛡️\n\nFeatures: AI-Powered Clinical Insights | Evidence-Based Medicine | Real-Time Intelligence\n\nAnalyzed Claim: "${claim}"`,
      };
      
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.text}`);
        alert('Share text copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
      if (err instanceof Error && err.name !== 'AbortError') {
        alert('Failed to share: ' + (err.message || 'Unknown error'));
      }
    }
  };

  const handleAnalyze = async (query: string = claim) => {
    if (!query.trim()) return;
    
    setIsAnalyzing(true);
    setResponse('');
    setError('');
    setClaim(query);

    try {
      const res = await fetch('http://localhost:8080/api/factcheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim: query }),
      });

      if (!res.ok) {
        throw new Error('Failed to start analysis');
      }

      if (!res.body) {
        throw new Error('No response body');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; 
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.substring(6).trim();
              if (dataStr === '[DONE]') {
                done = true;
                break;
              }
              if (dataStr) {
                try {
                  const data = JSON.parse(dataStr);
                  if (data.error) {
                    setError(data.error);
                  } else if (data.text) {
                    setResponse((prev) => prev + data.text);
                  }
                } catch (e) {
                  console.error('Error parsing SSE data', e);
                }
              }
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(response);
    alert('Report copied to clipboard!');
  };

  const handleReset = () => {
    setClaim('');
    setResponse('');
    setError('');
    setIsAnalyzing(false);
  };

  return (
    <div className="bg-white dark:bg-zinc-950 p-6 md:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 dark:bg-teal-400/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      
      <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-mono flex flex-wrap items-center gap-2">
                FactCheck <span className="text-zinc-300 dark:text-zinc-700 font-light hidden sm:inline">|</span> <span className="text-teal-600 dark:text-teal-400">AI Evidence Analyzer</span>
              </h2>
            </div>
          </div>
          
          <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
            Ask any healthcare question or paste a health news article. We'll analyze what the current scientific evidence says using Evidence-Based Medicine principles.
          </p>

          <div className="space-y-4">
            <div className="relative">
              <textarea
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                placeholder="Type a medical claim, paste a scientific news article, research abstract, social media post, or ask any healthcare question..."
                className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 min-h-[120px] focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all resize-y text-zinc-900 dark:text-zinc-100 text-sm"
              />
            </div>

            <button
              onClick={() => handleAnalyze()}
              disabled={!claim.trim() || isAnalyzing}
              className="w-full sm:w-auto mt-4 px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md"
            >
              <Search className="w-5 h-5" />
              What Does the Evidence Say?
            </button>
          </div>
        </div>
      {/* RESULT MODAL */}
      {(response || isAnalyzing) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <div className="bg-white dark:bg-zinc-950 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-zinc-200 dark:border-zinc-800 relative animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h2 className="font-bold text-zinc-900 dark:text-white">FactCheck Evidence Report</h2>
            </div>
              <button 
                onClick={handleReset}
                className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">

          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
              <span className="text-zinc-600 dark:text-zinc-400 font-bold text-sm">You</span>
            </div>
            <p className="text-sm text-zinc-800 dark:text-zinc-200 mt-1 whitespace-pre-wrap">{claim}</p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="self-start h-8 px-3 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
              <span className="text-teal-600 dark:text-teal-400 font-bold text-xs whitespace-nowrap">Healicwire Intelligence</span>
            </div>
            <div className="flex-1 min-w-0">
              {error ? (
                <div className="p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </div>
              ) : (
                <div className="prose prose-zinc dark:prose-invert prose-teal max-w-none prose-headings:font-bold prose-headings:text-zinc-900 dark:prose-headings:text-white prose-h3:text-lg prose-h3:font-extrabold prose-h3:mt-6 prose-h3:mb-3 prose-p:leading-relaxed prose-li:my-1 prose-strong:text-zinc-900 dark:prose-strong:text-white">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h3: ({node, ...props}) => <h3 className="text-xl font-black text-zinc-900 dark:text-white mt-8 mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold text-zinc-900 dark:text-white bg-teal-50 dark:bg-teal-900/30 px-1 rounded" {...props} />
                    }}
                  >
                    {response}
                  </ReactMarkdown>
                  
                  {isAnalyzing && (
                    <div className="flex items-center gap-2 mt-4 text-teal-600 dark:text-teal-400 animate-pulse">
                      <div className="w-2 h-2 bg-current rounded-full" />
                      <div className="w-2 h-2 bg-current rounded-full" />
                      <div className="w-2 h-2 bg-current rounded-full" />
                      <span className="text-sm font-medium ml-2">Analyzing evidence...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
            </div>
            
            {/* Modal Footer (Actions) */}
            {!isAnalyzing && !error && response && (
              <div className="p-4 sm:p-6 border-t border-zinc-100 dark:border-zinc-800 shrink-0 bg-zinc-50 dark:bg-zinc-900/50 flex flex-wrap items-center gap-3">
                <button 
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium transition-colors border border-zinc-200 dark:border-zinc-700 shadow-sm"
                >
                  <Copy className="w-4 h-4" />
                  Copy Report
                </button>
                <button 
                  onClick={handleShare}
                  disabled={isGeneratingPdf}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium transition-colors border border-zinc-200 dark:border-zinc-700 shadow-sm disabled:opacity-50"
                >
                  <Share2 className="w-4 h-4" />
                  {isGeneratingPdf ? 'Preparing...' : 'Share'}
                </button>
                <button 
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPdf}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium transition-colors border border-zinc-200 dark:border-zinc-700 shadow-sm disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden PDF Template */}
      <div style={{ display: 'none' }}>
        <div id="pdf-template" style={{ width: '800px', backgroundColor: '#ffffff', color: '#18181b', fontFamily: 'sans-serif', padding: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px', borderBottom: '1px solid #e4e4e7', paddingBottom: '24px' }}>
            <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0f766e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', margin: 0 }}>
              <ShieldCheck style={{ width: '40px', height: '40px' }} />
              HealicWire
            </h1>
            <p style={{ color: '#71717a', marginTop: '8px', fontWeight: '500', fontSize: '18px' }}>AI-Powered Clinical Insights | Evidence-Based Medicine | Real-Time Intelligence</p>
          </div>
          
          <div style={{ marginBottom: '24px', backgroundColor: '#fafafa', padding: '24px', borderRadius: '12px', border: '1px solid #e4e4e7' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', marginTop: 0 }}>Claim / Question Analyzed</h2>
            <p style={{ fontSize: '20px', fontWeight: '500', color: '#18181b', lineHeight: '1.6', margin: 0 }}>{claim}</p>
          </div>

          <div style={{ lineHeight: '1.7', fontSize: '16px', color: '#18181b' }}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                h3: ({node, ...props}) => <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#18181b', marginTop: '32px', marginBottom: '16px', borderBottom: '1px solid #e4e4e7', paddingBottom: '8px' }} {...props} />,
                strong: ({node, ...props}) => <strong style={{ fontWeight: 'bold', color: '#18181b', backgroundColor: '#f0fdfa', padding: '2px 4px', borderRadius: '4px' }} {...props} />,
                p: ({node, ...props}) => <p style={{ marginBottom: '16px' }} {...props} />,
                ul: ({node, ...props}) => <ul style={{ marginBottom: '16px', paddingLeft: '24px', listStyleType: 'disc' }} {...props} />,
                li: ({node, ...props}) => <li style={{ marginBottom: '4px' }} {...props} />
              }}
            >
              {response}
            </ReactMarkdown>
          </div>
          
          <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #e4e4e7', textAlign: 'center', color: '#71717a', fontSize: '14px', fontWeight: '500' }}>
            Generated by HealicWire FactCheck Intelligence • healicwire.com
          </div>
        </div>
      </div>
    </div>
  );
};
