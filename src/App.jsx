import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './Login';
import { 
  Users, 
  MessageSquare, 
  Activity, 
  Globe, 
  Clock, 
  Monitor, 
  Smartphone,
  LayoutDashboard
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { format } from 'date-fns';

const API_URL = '/api';

function Dashboard() {
  const [stats, setStats] = useState({
    totalVisitors: 0,
    totalMessages: 0,
    recentVisitors: [],
    recentMessages: [],
    visitorsLast7Days: []
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API_URL}/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setStats(response.data.data);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem('adminToken');
          navigate('/login');
        } else {
          console.error('Backend not reachable:', error);
          setError('Failed to fetch data from backend.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="p-6 bg-red-50 text-red-600 rounded-xl border border-red-100">
          <p className="font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Sidebar / Header area */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-primary-600 p-2 rounded-lg">
                <LayoutDashboard className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-bold text-slate-900">Portfolio Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-500">
                Live Status: <span className="inline-block w-2 h-2 bg-green-500 rounded-full ml-1"></span> Active
              </div>
              <button 
                onClick={() => { localStorage.removeItem('adminToken'); navigate('/login'); }}
                className="text-sm font-medium text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Visitors" 
            value={stats.totalVisitors} 
            icon={<Users className="w-6 h-6 text-primary-600" />}
            trend="+12% from last week"
          />
          <StatCard 
            title="Total Messages" 
            value={stats.totalMessages} 
            icon={<MessageSquare className="w-6 h-6 text-primary-600" />}
            trend="3 unread"
          />
          <StatCard 
            title="Active Sessions" 
            value="12" 
            icon={<Activity className="w-6 h-6 text-primary-600" />}
            trend="Right now"
          />
          <StatCard 
            title="Top Device" 
            value="Mobile" 
            icon={<Smartphone className="w-6 h-6 text-primary-600" />}
            trend="68% of users"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Visitor Traffic (Last 7 Days)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.visitorsLast7Days}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
             <h3 className="text-lg font-semibold text-slate-900 mb-6">Recent Messages</h3>
             <div className="space-y-4">
                {stats.recentMessages.length === 0 ? (
                  <p className="text-slate-500">No messages yet.</p>
                ) : (
                  stats.recentMessages.slice(0, 3).map((msg, i) => (
                    <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-slate-900">{msg.name}</span>
                        <span className="text-xs text-slate-500">{format(new Date(msg.timestamp), 'MMM d')}</span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">{msg.message}</p>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>

        {/* Detailed Audit Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-900">Recent Visitor Audit</h3>
            <button className="text-sm font-medium text-primary-600 hover:text-primary-700">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm">
                  <th className="px-6 py-3 font-medium">IP Address</th>
                  <th className="px-6 py-3 font-medium">System / Browser</th>
                  <th className="px-6 py-3 font-medium">Device</th>
                  <th className="px-6 py-3 font-medium">Page</th>
                  <th className="px-6 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recentVisitors.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-4 text-center text-slate-500">No visitors logged yet.</td></tr>
                ) : (
                  stats.recentVisitors.map((v, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors text-sm">
                      <td className="px-6 py-4 font-mono text-slate-600">{v.ipAddress}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{v.os || 'Unknown OS'}</span>
                          <span className="text-xs text-slate-500">{v.browser || 'Unknown Browser'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          {v.device?.toLowerCase().includes('mobile') ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                          {v.device || 'Desktop'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                         <span className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">{v.pageVisited || '/'}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        {format(new Date(v.timestamp), 'MMM d, h:mm a')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, trend }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-start justify-between group hover:border-primary-200 transition-colors">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h4 className="text-3xl font-bold text-slate-900">{value}</h4>
        {trend && <p className="text-xs text-slate-400 mt-2">{trend}</p>}
      </div>
      <div className="p-3 bg-primary-50 rounded-xl group-hover:bg-primary-100 transition-colors">
        {icon}
      </div>
    </div>
  );
}

// Private Route Wrapper
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <BrowserRouter basename="/admin">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
