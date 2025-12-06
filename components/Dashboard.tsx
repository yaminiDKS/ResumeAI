
import React, { useState, useRef } from 'react';
import { Icons } from './Icons';
import { AppState, ResearchResult, ResumeAnalysis } from '../types';
import { researchMarketTrends, optimizeResume } from '../services/geminiService';

export const Dashboard: React.FC = () => {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [appState, setAppState] = useState<AppState>('idle');
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setResumeText(event.target.result);
      }
    };
    reader.readAsText(file);
  };

  const handleStart = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      setErrorMsg("Please provide both your Resume LaTeX code and the Job Description.");
      return;
    }
    
    setErrorMsg('');
    setAppState('researching');
    setResearchResult(null);
    setAnalysis(null);

    try {
      // Step 1: Research
      const research = await researchMarketTrends(jobDescription);
      setResearchResult(research);
      setAppState('thinking');

      // Step 2: Optimize
      const result = await optimizeResume(resumeText, jobDescription, research.trends);
      setAnalysis(result);
      setAppState('complete');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred.");
      setAppState('error');
    }
  };

  const downloadLatex = () => {
    if (!analysis?.optimizedResumeLatex) return;
    const blob = new Blob([analysis.optimizedResumeLatex], { type: 'application/x-tex' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'optimized_resume.tex';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Icons.Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              ResumeArchitect AI
            </h1>
          </div>
          <div className="text-sm text-gray-500 hidden sm:block">
            Powered by Gemini 2.5 Flash (Search) & 3.0 Pro (Thinking)
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Inputs */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Icons.FileText className="h-5 w-5 text-indigo-500" />
                Your LaTeX Resume
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Paste LaTeX code or upload .tex</span>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-indigo-600 font-medium hover:text-indigo-800"
                  >
                    Upload .tex File
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".tex,.txt"
                    onChange={handleFileUpload}
                  />
                </div>
                <textarea
                  className="w-full h-48 p-3 text-sm font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-shadow"
                  placeholder="\documentclass{article}..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Icons.Briefcase className="h-5 w-5 text-indigo-500" />
                Target Job Description
              </h2>
              <textarea
                className="w-full h-48 p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-shadow"
                placeholder="Paste the job description (JD) here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            <button
              onClick={handleStart}
              disabled={appState === 'researching' || appState === 'thinking'}
              className={`w-full py-4 px-6 rounded-xl font-bold text-white shadow-lg transform transition-all flex items-center justify-center gap-2
                ${appState === 'researching' || appState === 'thinking' 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                }`}
            >
              {appState === 'researching' && (
                <>
                  <Icons.Search className="h-5 w-5 animate-spin" />
                  Researching Market...
                </>
              )}
              {appState === 'thinking' && (
                <>
                  <Icons.Cpu className="h-5 w-5 animate-pulse" />
                  Thinking & Optimizing...
                </>
              )}
              {(appState === 'idle' || appState === 'complete' || appState === 'error') && (
                <>
                  Generate LaTeX Code
                  <Icons.ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

            {errorMsg && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 text-sm border border-red-200">
                <Icons.AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                {errorMsg}
              </div>
            )}
          </div>

          {/* Right Column: Output & Analysis */}
          <div className="lg:col-span-8 space-y-6">
            
            {appState === 'idle' && !analysis && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 p-12 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50/50">
                <Icons.Sparkles className="h-16 w-16 mb-4 text-gray-300" />
                <h3 className="text-xl font-medium text-gray-600">Ready to Optimize</h3>
                <p className="text-center max-w-md mt-2">
                  Paste your LaTeX resume source and the target JD on the left. We'll optimize your LaTeX code for the role.
                </p>
              </div>
            )}

            {/* Progress / Status Indicators */}
            {(appState === 'researching' || appState === 'thinking') && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center space-y-6 animate-pulse">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {appState === 'researching' ? <Icons.Search className="h-6 w-6 text-indigo-600"/> : <Icons.Cpu className="h-6 w-6 text-indigo-600"/>}
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-800">
                    {appState === 'researching' ? "Analyzing Market Trends..." : "Refactoring LaTeX Code..."}
                  </h3>
                  <p className="text-gray-500 mt-2">
                    {appState === 'researching' 
                      ? "Querying Google Search for up-to-date keywords and recruiter expectations."
                      : "Gemini 3 Pro is thinking deeply (32k tokens) to align your experience with the JD while preserving LaTeX structure."}
                  </p>
                </div>
              </div>
            )}

            {/* Results Dashboard */}
            {analysis && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Top Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Score Card */}
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                      <Icons.TrendingUp className="h-24 w-24" />
                    </div>
                    <div className="relative z-10">
                      <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">Match Score</div>
                      <div className="text-4xl font-bold text-indigo-600 mt-2">{analysis.matchScore}%</div>
                      <div className="text-xs text-gray-400 mt-1">Based on JD keywords</div>
                    </div>
                  </div>

                  {/* Missing Keywords */}
                  <div className="md:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Icons.AlertCircle className="h-5 w-5 text-amber-500" />
                      <h3 className="font-semibold text-gray-800">Critical Missing Keywords</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.missingKeywords.length > 0 ? (
                        analysis.missingKeywords.map((kw, i) => (
                          <span key={i} className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded text-xs font-medium">
                            {kw}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">Great job! No critical keywords missing.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Market Insights */}
                {analysis.marketInsights.length > 0 && (
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                     <div className="flex items-center gap-2 mb-4">
                        <Icons.Search className="h-5 w-5 text-blue-500" />
                        <h3 className="font-semibold text-gray-800">Market Intelligence Applied</h3>
                     </div>
                     <ul className="space-y-2">
                        {analysis.marketInsights.map((insight, i) => (
                           <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                              <Icons.CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                              <span>{insight}</span>
                           </li>
                        ))}
                     </ul>
                     {researchResult?.groundingLinks && researchResult.groundingLinks.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                           <p className="text-xs text-gray-400 mb-2">Sources:</p>
                           <div className="flex flex-wrap gap-2">
                              {researchResult.groundingLinks.map((link, i) => (
                                 <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate max-w-[200px]">
                                    {new URL(link).hostname}
                                 </a>
                              ))}
                           </div>
                        </div>
                     )}
                  </div>
                )}
                
                {/* Improvement Summary */}
                 <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                    <h3 className="font-semibold text-indigo-900 mb-2">Optimization Strategy</h3>
                    <p className="text-sm text-indigo-800 leading-relaxed">
                       {analysis.improvementSummary}
                    </p>
                 </div>

                {/* LaTeX Output Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                   <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <div className="p-1.5 bg-gray-200 rounded">
                            <span className="font-mono text-xs font-bold text-gray-600">TEX</span>
                         </div>
                         <h3 className="font-semibold text-gray-800 text-sm">Optimized LaTeX Code</h3>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigator.clipboard.writeText(analysis.optimizedResumeLatex)}
                          className="text-xs px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700 font-medium transition-colors"
                        >
                           Copy Code
                        </button>
                        <button
                          onClick={downloadLatex}
                          className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium shadow-sm flex items-center gap-1.5 transition-colors"
                        >
                           <Icons.Download className="h-3.5 w-3.5" />
                           Download .tex
                        </button>
                      </div>
                   </div>
                   <div className="relative">
                      <textarea
                         readOnly
                         value={analysis.optimizedResumeLatex}
                         className="w-full h-96 p-4 font-mono text-xs text-gray-800 bg-gray-50 focus:outline-none resize-y"
                         spellCheck={false}
                      />
                   </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
