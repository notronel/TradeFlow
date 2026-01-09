import React, { useState } from 'react';
import { TradovateConfig, Trade } from '../types';
import { TradovateService } from '../services/tradovateService';
import { Settings, RefreshCw, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

interface Props {
  onSync: (trades: Trade[]) => number;
}

const Integrations: React.FC<Props> = ({ onSync }) => {
  const [config, setConfig] = useState<TradovateConfig>(() => {
    const saved = localStorage.getItem('tradovate_config');
    return saved ? JSON.parse(saved) : {
      apiKey: '',
      apiSecret: '',
      username: '',
      password: '',
      isDemo: true
    };
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [syncCount, setSyncCount] = useState(0);

  const saveConfig = (newConfig: TradovateConfig) => {
    setConfig(newConfig);
    localStorage.setItem('tradovate_config', JSON.stringify(newConfig));
  };

  const handleSync = async () => {
    if (!config.apiKey || !config.username) {
      alert("Please enter your Tradovate API credentials first.");
      return;
    }

    setIsSyncing(true);
    setStatus('IDLE');
    
    try {
      const service = new TradovateService(config);
      const fetchedTrades = await service.fetchFills();
      const count = onSync(fetchedTrades);
      setSyncCount(count);
      setStatus('SUCCESS');
    } catch (err) {
      console.error(err);
      setStatus('ERROR');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-white">Platform Integrations</h2>
        <p className="text-white">Connect your brokerage or manage API connectivity.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Platform Connectors */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tradovate Card */}
          <div className="bg-gray-700 border border-gray-600 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-[#F6A623]/20 rounded-xl flex items-center justify-center border border-[#F6A623]/20">
                  <span className="text-[#F6A623] font-bold text-xl">T</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Tradovate</h3>
                  <p className="text-sm text-white">Futures & Options API</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                config.apiKey ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/20' : 'bg-gray-600 text-white'
              }`}>
                {config.apiKey ? 'Connected' : 'Not Configured'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-white mb-1 uppercase font-semibold">API Key</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 outline-none focus:ring-1 focus:ring-[#F6A623] text-white placeholder-gray-500"
                    value={config.apiKey}
                    onChange={(e) => saveConfig({...config, apiKey: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs text-white mb-1 uppercase font-semibold">API Secret</label>
                  <input 
                    type="password" 
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 outline-none focus:ring-1 focus:ring-[#F6A623] text-white placeholder-gray-500"
                    value={config.apiSecret}
                    onChange={(e) => saveConfig({...config, apiSecret: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-white mb-1 uppercase font-semibold">Username</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 outline-none focus:ring-1 focus:ring-[#F6A623] text-white placeholder-gray-500"
                    value={config.username}
                    onChange={(e) => saveConfig({...config, username: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs text-white mb-1 uppercase font-semibold">Password</label>
                  <input 
                    type="password" 
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 outline-none focus:ring-1 focus:ring-[#F6A623] text-white placeholder-gray-500"
                    value={config.password}
                    onChange={(e) => saveConfig({...config, password: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-600">
              <div className="flex items-center space-x-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={config.isDemo}
                    onChange={(e) => saveConfig({...config, isDemo: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  <span className="ml-3 text-sm font-medium text-white">Demo Mode</span>
                </label>
              </div>

              <button 
                onClick={handleSync}
                disabled={isSyncing}
                className="bg-[#F6A623] hover:bg-[#e0951a] text-white px-6 py-2 rounded-lg font-bold flex items-center transition-all disabled:opacity-50 shadow-md"
              >
                {isSyncing ? <RefreshCw className="animate-spin mr-2" size={18} /> : <RefreshCw className="mr-2" size={18} />}
                Sync Fills
              </button>
            </div>
          </div>

          {status === 'SUCCESS' && (
            <div className="bg-emerald-900/20 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center space-x-3 animate-in slide-in-from-top-2">
              <CheckCircle2 size={20} />
              <span>Successfully synced {syncCount} new trades!</span>
            </div>
          )}
        </div>

        {/* Right Column: Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-gray-700 border border-gray-600 rounded-2xl p-6">
            <h4 className="font-bold flex items-center mb-4 text-white">
              <ShieldCheck className="text-emerald-300 mr-2" size={18} />
              Privacy & Security
            </h4>
            <p className="text-sm text-white leading-relaxed">
              We value your data privacy. All API credentials and imported CSV files are processed entirely in your browser. 
              <br/><br/>
              <b>No data</b> is ever uploaded to a central server, ensuring your strategy remains proprietary.
            </p>
          </div>

          <div className="bg-gray-700 border border-gray-600 rounded-2xl p-6">
            <h4 className="font-bold text-white mb-2">Platform Sync</h4>
            <p className="text-sm text-white leading-relaxed mb-4">
              Direct brokerage sync allows for near real-time execution tracking without manual input.
            </p>
            <ul className="text-sm text-white space-y-2 list-disc pl-4">
              <li>Secure API connectivity.</li>
              <li>Auto-mapping of symbols.</li>
              <li>Fee and commission detection.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Integrations;