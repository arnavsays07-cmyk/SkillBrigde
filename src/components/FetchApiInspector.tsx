import React, { useState } from 'react';
import { engine, FetchRequestLog } from '../services/mockBackend';
import {
  Terminal,
  Play,
  Copy,
  Check,
  Code2,
  Clock,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';

export const FetchApiInspector: React.FC = () => {
  const [subjectQuery, setSubjectQuery] = useState('Data');
  const [departmentQuery, setDepartmentQuery] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'fetch-code' | 'debounce-pattern' | 'abort-controller'>('fetch-code');
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testLog, setTestLog] = useState<FetchRequestLog | null>(null);

  const departments = ['', ...engine.getDepartments()];

  const runTestFetch = async () => {
    setIsRunning(true);
    const result = await engine.searchPeersApi(subjectQuery, departmentQuery);
    const logs = engine.getLogs();
    setTestResult(result);
    if (logs.length > 0) {
      setTestLog(logs[0]);
    }
    setIsRunning(false);
  };

  const codeSnippets = {
    'fetch-code': `// =====================================================================
// Modern Fetch API implementation for Asynchronous Peer Search
// Endpoint: /skillbridge/api/search_peers.php
// =====================================================================

async function searchPeers(subject = '', department = '') {
  try {
    // 1. Build Query Parameters safely
    const params = new URLSearchParams({
      subject: subject.trim(),
      department: department.trim()
    });

    // 2. Execute modern Fetch API call with security headers
    const response = await fetch(\`/skillbridge/api/search_peers.php?\${params.toString()}\`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest' // Identifies AJAX request to PHP
      }
    });

    // 3. Handle HTTP 401 Unauthorized redirect
    if (response.status === 401) {
      window.location.href = '/skillbridge/auth/login.php';
      return [];
    }

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    // 4. Parse JSON Response
    const result = await response.json();
    console.log(\`Received \${result.count} peers from server:\`, result.data);

    // 5. Render peers dynamically into DOM
    renderPeersToContainer(result.data);
    return result.data;

  } catch (error) {
    console.error('Fetch peer search failed:', error);
    showErrorMessage('Unable to load peers. Please check network.');
    return [];
  }
}`,
    'debounce-pattern': `// =====================================================================
// Debouncing Input Events (Prevents flooding PHP server on each keystroke)
// =====================================================================

const searchInput = document.getElementById('peer-search-input');
let debounceTimer = null;

searchInput.addEventListener('input', (event) => {
  const query = event.target.value;

  // Clear previous pending timer if user keeps typing
  clearTimeout(debounceTimer);

  // Wait 300 milliseconds after the last keystroke before calling fetch()
  debounceTimer = setTimeout(() => {
    console.log('Debounce elapsed! Firing fetch for:', query);
    searchPeers(query, document.getElementById('peer-dept-filter').value);
  }, 300);
});`,
    'abort-controller': `// =====================================================================
// Race Condition Defense: AbortController cancels outdated in-flight requests
// =====================================================================

let currentAbortController = null;

async function searchWithCancellation(query, dept) {
  // If a previous fetch is still downloading, abort it immediately!
  if (currentAbortController) {
    currentAbortController.abort();
  }

  // Create fresh abort signal for this new request
  currentAbortController = new AbortController();

  try {
    const params = new URLSearchParams({ subject: query, department: dept });
    const response = await fetch(\`/skillbridge/api/search_peers.php?\${params}\`, {
      signal: currentAbortController.signal // Link signal to fetch
    });
    const json = await response.json();
    return json.data;
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('Previous fetch cancelled gracefully.');
      return;
    }
    throw err;
  }
}`
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              Fetch API Workbench &amp; Live Telemetry
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Client-Side Fetch API &amp; AJAX Architecture
          </h2>
          <p className="text-slate-400 text-sm max-w-2xl">
            Test and inspect how the frontend communicates asynchronously with <code className="text-indigo-300 font-mono text-xs">api/search_peers.php</code>.
            Includes debouncing, URL encoding, HTTP header negotiation, and response JSON deserialization.
          </p>
        </div>
      </div>

      {/* Live Request Builder Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <Play className="w-4 h-4 text-emerald-400" />
          Interactive Fetch() Request Tester
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4">
          <div className="sm:col-span-6">
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Query Parameter: <code className="text-indigo-300">?subject=</code>
            </label>
            <input
              type="text"
              value={subjectQuery}
              onChange={(e) => setSubjectQuery(e.target.value)}
              placeholder="e.g. Data, Algorithm, SQL, Python"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Query Parameter: <code className="text-indigo-300">?department=</code>
            </label>
            <select
              value={departmentQuery}
              onChange={(e) => setDepartmentQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">(All Departments)</option>
              {departments.filter(Boolean).map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              onClick={runTestFetch}
              disabled={isRunning}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 rounded-xl text-xs transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isRunning ? 'Running...' : 'Execute fetch()'}
            </button>
          </div>
        </div>

        {/* Live URL string preview */}
        <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-mono flex items-center justify-between text-slate-300 overflow-x-auto">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
              GET
            </span>
            <span className="text-emerald-400">
              /skillbridge/api/search_peers.php?subject={encodeURIComponent(subjectQuery)}&amp;department={encodeURIComponent(departmentQuery)}
            </span>
          </div>
          {testLog && (
            <span className="text-slate-500 text-[11px] shrink-0">
              Last executed in {testLog.durationMs}ms
            </span>
          )}
        </div>
      </div>

      {/* Test Result Inspector (if run) */}
      {testResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-bold">
                HTTP 200 OK
              </span>
              <span className="text-slate-400">
                Found <strong className="text-white">{testResult.count}</strong> peer matches
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(JSON.stringify(testResult, null, 2))}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" /> Copy JSON
            </button>
          </div>

          <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-emerald-400/90 overflow-x-auto max-h-64 overflow-y-auto border border-slate-800">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}

      {/* Code Snippets Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-slate-950/80 px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-bold text-white">JavaScript Implementation Patterns</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('fetch-code')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'fetch-code'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              1. Async Fetch()
            </button>
            <button
              onClick={() => setActiveTab('debounce-pattern')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'debounce-pattern'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2. Debounce (300ms)
            </button>
            <button
              onClick={() => setActiveTab('abort-controller')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'abort-controller'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              3. AbortController
            </button>
          </div>
        </div>

        <div className="p-5 relative">
          <button
            onClick={() => copyToClipboard(codeSnippets[activeTab])}
            className="absolute top-8 right-8 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>

          <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed border border-slate-800">
            {codeSnippets[activeTab]}
          </pre>
        </div>
      </div>
    </div>
  );
};
