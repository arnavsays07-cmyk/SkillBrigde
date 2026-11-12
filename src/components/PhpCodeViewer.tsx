import React, { useState } from 'react';
import { PHP_PROJECT_FILES, PhpFileRecord } from '../data/phpCodeFiles';
import {
  Folder,
  FileCode,
  Copy,
  Check,
  Download,
  Database,
  ShieldCheck,
  Globe,
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';

interface PhpCodeViewerProps {
  initialFile?: string;
}

export const PhpCodeViewer: React.FC<PhpCodeViewerProps> = ({ initialFile }) => {
  const [selectedFile, setSelectedFile] = useState<PhpFileRecord>(() => {
    if (initialFile) {
      const match = PHP_PROJECT_FILES.find(f => f.filename === initialFile || f.path.includes(initialFile));
      if (match) return match;
    }
    return PHP_PROJECT_FILES[0];
  });

  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (file: PhpFileRecord) => {
    const blob = new Blob([file.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadAllAsTextBundle = () => {
    let combined = `/**\n * SKILLBRIDGE FULL PHP PROJECT BUNDLE\n * Generated for local Apache/Nginx + MySQL deployment\n */\n\n`;
    PHP_PROJECT_FILES.forEach(f => {
      combined += `\n/* ==================== FILE: ${f.path} ==================== */\n\n`;
      combined += f.code + `\n\n`;
    });
    const blob = new Blob([combined], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'skillbridge_full_codebase.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const categoryIcons: Record<string, any> = {
    database: Database,
    config: ShieldCheck,
    api: Globe,
    student: Layers,
    auth: Lock,
    frontend: FileCode
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5" />
              Complete Production PHP/MySQL Codebase
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            PHP Architecture Source Files
          </h2>
          <p className="text-slate-400 text-sm max-w-2xl">
            Inspect, copy, or download every standalone PHP, SQL, and JavaScript file. Fully verified for
            PHP 8.2+, MySQL 8.0, and Apache/Nginx web servers.
          </p>
        </div>

        <button
          onClick={downloadAllAsTextBundle}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/20 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>Export All Files (.txt)</span>
        </button>
      </div>

      {/* Main Split Layout: File Sidebar + Code View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Sidebar: Files List */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Project Structure
            </span>
            <span className="text-xs text-indigo-400 font-mono">
              {PHP_PROJECT_FILES.length} Files
            </span>
          </div>

          <div className="space-y-1">
            {PHP_PROJECT_FILES.map(file => {
              const Icon = categoryIcons[file.category] || FileCode;
              const isSelected = selectedFile.path === file.path;

              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition flex items-center justify-between group ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                    <div className="truncate">
                      <div className="font-semibold truncate">{file.filename}</div>
                      <div className={`text-[10px] font-mono truncate ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                        {file.path}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${
                    isSelected
                      ? 'bg-indigo-700 text-white'
                      : 'bg-slate-950 text-slate-500 border border-slate-800'
                  }`}>
                    {file.category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Code Content Viewer */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          {/* File Header */}
          <div className="bg-slate-950/90 px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <span className="font-mono text-sm font-bold text-white">
                  {selectedFile.path}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedFile.description}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadFile(selectedFile)}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
                title="Download this file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>

              <button
                onClick={copyCode}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
          </div>

          {/* Code Body with Line Numbers */}
          <div className="p-4 bg-slate-950 overflow-x-auto flex-1 max-h-[650px] overflow-y-auto">
            <pre className="text-xs font-mono text-slate-200 leading-relaxed">
              {selectedFile.code.split('\n').map((line, i) => (
                <div key={i} className="table-row hover:bg-slate-900/50">
                  <span className="table-cell select-none text-slate-600 text-right pr-4 text-[11px] w-10">
                    {i + 1}
                  </span>
                  <span className="table-cell whitespace-pre">
                    {line}
                  </span>
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
