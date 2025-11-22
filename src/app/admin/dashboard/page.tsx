'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Users,
  BarChart3,
  Settings,
  Shield,
  LogOut,
  User,
  Key,
  Activity,
  TrendingUp,
  Download,
  Search,
  Calendar,
  Trophy
} from 'lucide-react';

// Settings interfaces for component props
interface SecuritySettings {
  sessionTimeout?: number;
  maxLoginAttempts?: number;
  passwordMinLength?: number;
  lockoutDuration?: number;
  requireTwoFactor?: boolean;
  enableBruteForceProtection?: boolean;
}

interface EmailSettings {
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  fromEmail?: string;
  fromName?: string;
  smtpSecure?: boolean;
  enableNotifications?: boolean;
}

interface NotificationSettings {
  emailOnNewSignup?: boolean;
  emailOnSystemError?: boolean;
  emailDigest?: boolean;
  emailDigestFrequency?: string;
  slackWebhookUrl?: string;
  discordWebhookUrl?: string;
}

interface DatabaseSettings {
  maxPoolSize?: number;
  minPoolSize?: number;
  serverSelectionTimeout?: number;
  socketTimeout?: number;
  slowQueryThreshold?: number;
  enableProfiling?: boolean;
  logSlowQueries?: boolean;
}

interface MaintenanceSettings {
  backupRetention?: number;
  logRetention?: number;
  maintenanceMessage?: string;
  enableMaintenanceMode?: boolean;
  enableBackup?: boolean;
  enableLogsRotation?: boolean;
  enableMetricsCollection?: boolean;
  backupFrequency?: string;
}

interface BetaSettings {
  maxPositions?: number;
  defaultSkillLevel?: string;
  waitingListEnabled?: boolean;
  autoApprovalEnabled?: boolean;
  requirePhone?: boolean;
  enablePositionPriority?: boolean;
}

interface AdvancedSettings {
  apiRateLimitPerMinute?: number;
  cacheTtl?: number;
  enableApiRateLimit?: boolean;
  enableCors?: boolean;
  enableCompression?: boolean;
  cacheEnabled?: boolean;
  enableHealthChecks?: boolean;
}

interface SettingsData {
  security?: SecuritySettings;
  email?: EmailSettings;
  notifications?: NotificationSettings;
  database?: DatabaseSettings;
  maintenance?: MaintenanceSettings;
  beta?: BetaSettings;
  advanced?: AdvancedSettings;
}

interface SecurityComponentProps {
  settings: SecuritySettings;
  onSave: (updates: SettingsData) => Promise<void>;
  isSaving: boolean;
  userRole?: string;
}

interface EmailComponentProps {
  settings: EmailSettings;
  onSave: (updates: SettingsData) => Promise<void>;
  isSaving: boolean;
  userRole?: string;
}

interface NotificationComponentProps {
  settings: NotificationSettings;
  onSave: (updates: SettingsData) => Promise<void>;
  isSaving: boolean;
}

interface DatabaseComponentProps {
  settings: DatabaseSettings;
  onSave: (updates: SettingsData) => Promise<void>;
  isSaving: boolean;
}

interface MaintenanceComponentProps {
  settings: MaintenanceSettings;
  onSave: (updates: SettingsData) => Promise<void>;
  isSaving: boolean;
}

interface BetaComponentProps {
  settings: BetaSettings;
  onSave: (updates: SettingsData) => Promise<void>;
  isSaving: boolean;
}

interface AdvancedComponentProps {
  settings: AdvancedSettings;
  onSave: (updates: SettingsData) => Promise<void>;
  isSaving: boolean;
  userRole?: string;
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  lastLogin?: string;
}

interface DashboardStats {
  totalUsers: number;
  newUsersToday: number;
  conversionRate: number;
  featureRequests: number;
}

interface BetaUser {
  _id: string;
  name: string;
  email: string;
  skillLevel: string;
  featureInterests: string[];
  position: number;
  submittedAt: string;
  useCase: string;
}

interface AnalyticsData {
  dailySignups: Array<{
    date: string;
    count: number;
    cumulative: number;
  }>;
  skillDistribution: Array<{
    name: string;
    value: number;
  }>;
  referralDistribution: Array<{
    name: string;
    value: number;
  }>;
  featureDistribution: Array<{
    name: string;
    value: number;
  }>;
  metrics: {
    totalUsers: number;
    usersToday: number;
    dayOverDayGrowth: number;
    usersThisWeek: number;
    usersThisMonth: number;
  };
}

export default function AdminDashboard() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<BetaUser[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const response = await fetch('/api/admin/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_refresh_token');
        router.push('/admin/login');
        return;
      }

      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/admin/login');
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
    loadDashboardData();
  }, [checkAuth]);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      const [statsRes, usersRes, analyticsRes] = await Promise.all([
        fetch('/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/analytics', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users);
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData.analytics);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refresh_token');
    router.push('/admin/login');
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.useCase.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSkill = !selectedSkill || user.skillLevel === selectedSkill;
    return matchesSearch && matchesSkill;
  });

  const exportData = () => {
    const csvContent = [
      ['Name', 'Email', 'Skill Level', 'Use Case', 'Position', 'Submitted At'],
      ...filteredUsers.map(user => [
        user.name,
        user.email,
        user.skillLevel,
        `"${user.useCase.replace(/"/g, '""')}"`,
        user.position,
        new Date(user.submittedAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dotctl-beta-users-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportAnalytics = (type: string) => {
    if (!analytics) return;

    let csvContent = '';
    let filename = '';

    if (type === 'signups') {
      csvContent = [
        ['Date', 'Signups', 'Cumulative'],
        ...analytics.dailySignups.map(day => [
          day.date,
          day.count.toString(),
          day.cumulative.toString()
        ])
      ].map(row => row.join(',')).join('\n');
      filename = `dotctl-analytics-signups-${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'skills') {
      csvContent = [
        ['Skill Level', 'Count'],
        ...analytics.skillDistribution.map(skill => [
          skill.name,
          skill.value.toString()
        ])
      ].map(row => row.join(',')).join('\n');
      filename = `dotctl-analytics-skills-${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'referrals') {
      csvContent = [
        ['Referral Source', 'Count'],
        ...analytics.referralDistribution.map(ref => [
          ref.name,
          ref.value.toString()
        ])
      ].map(row => row.join(',')).join('\n');
      filename = `dotctl-analytics-referrals-${new Date().toISOString().split('T')[0]}.csv`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Shield className="w-8 h-8 text-purple-400" />
            <div>
              <h1 className="text-xl font-bold">DotCTL Admin</h1>
              <p className="text-sm text-slate-400">Beta Access Management</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user.username}</p>
              <p className="text-xs text-slate-400">{user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-slate-800 border-b border-slate-700 px-6">
        <nav className="flex space-x-6 py-2">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'referrals', label: 'Referrals', icon: Users },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <div className="flex items-center space-x-3">
                  <Users className="w-8 h-8 text-blue-400" />
                  <div>
                    <p className="text-2xl font-bold">{stats.totalUsers}</p>
                    <p className="text-sm text-slate-400">Total Users</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <div className="flex items-center space-x-3">
                  <Activity className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="text-2xl font-bold">{stats.newUsersToday}</p>
                    <p className="text-sm text-slate-400">New Today</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-8 h-8 text-purple-400" />
                  <div>
                    <p className="text-2xl font-bold">{stats.conversionRate}%</p>
                    <p className="text-sm text-slate-400">Conversion Rate</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <div className="flex items-center space-x-3">
                  <Key className="w-8 h-8 text-yellow-400" />
                  <div>
                    <p className="text-2xl font-bold">{stats.featureRequests}</p>
                    <p className="text-sm text-slate-400">Feature Requests</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Users */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Recent Signups</h2>
                <button
                  onClick={() => setActiveTab('users')}
                  className="text-purple-400 hover:text-purple-300 text-sm"
                >
                  View All →
                </button>
              </div>
              <div className="space-y-3">
                {users.slice(0, 5).map(betaUser => (
                  <div key={betaUser._id} className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="font-medium">{betaUser.name}</p>
                        <p className="text-sm text-slate-400">{betaUser.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-400">#{betaUser.position}</p>
                      <p className="text-xs text-slate-500">{new Date(betaUser.submittedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <select
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Skill Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                <button
                  onClick={exportData}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Skill Level</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Position</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {filteredUsers.map(betaUser => (
                      <tr key={betaUser._id} className="hover:bg-slate-700/50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-white">{betaUser.name}</p>
                            <p className="text-sm text-slate-400">{betaUser.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            betaUser.skillLevel === 'advanced' ? 'bg-red-100 text-red-800' :
                            betaUser.skillLevel === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {betaUser.skillLevel}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-white">#{betaUser.position}</td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {new Date(betaUser.submittedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            {/* Advanced Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <div className="flex items-center space-x-3">
                  <Users className="w-8 h-8 text-blue-400" />
                  <div>
                    <p className="text-2xl font-bold">{analytics.metrics.totalUsers}</p>
                    <p className="text-sm text-slate-400">Total Users</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <div className="flex items-center space-x-3">
                  <Activity className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="text-2xl font-bold">{analytics.metrics.usersToday}</p>
                    <p className="text-sm text-slate-400">New Today</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <div className="flex items-center space-x-3">
                  <TrendingUp className={`w-8 h-8 ${analytics.metrics.dayOverDayGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`} />
                  <div>
                    <p className="text-2xl font-bold">{analytics.metrics.dayOverDayGrowth >= 0 ? '+' : ''}{analytics.metrics.dayOverDayGrowth.toFixed(1)}%</p>
                    <p className="text-sm text-slate-400">Day-over-Day</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-8 h-8 text-purple-400" />
                  <div>
                    <p className="text-2xl font-bold">{analytics.metrics.usersThisMonth}</p>
                    <p className="text-sm text-slate-400">This Month</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Signup Trends */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <h3 className="text-xl font-semibold mb-4">User Signup Trends (30 Days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.dailySignups}>
                    <defs>
                      <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      stroke="#94a3b8"
                      fontSize={12}
                      tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#f1f5f9'
                      }}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#8884d8"
                      fillOpacity={1}
                      fill="url(#colorSignups)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Cumulative Users */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <h3 className="text-xl font-semibold mb-4">Cumulative User Growth</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.dailySignups}>
                    <XAxis
                      dataKey="date"
                      stroke="#94a3b8"
                      fontSize={12}
                      tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#f1f5f9'
                      }}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulative"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Skill Distribution */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <h3 className="text-xl font-semibold mb-4">Skill Level Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.skillDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.skillDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={
                          entry.name === 'beginner' ? '#10b981' :
                          entry.name === 'intermediate' ? '#f59e0b' :
                          '#ef4444'
                        } />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#f1f5f9'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Referral Sources */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <h3 className="text-xl font-semibold mb-4">Referral Sources</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.referralDistribution}>
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#f1f5f9'
                      }}
                    />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Feature Interests */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <h3 className="text-xl font-semibold mb-4">Feature Interests</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={analytics.featureDistribution}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis
                      dataKey="name"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      className="text-xs"
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 'dataMax']}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <Radar
                      name="Interest"
                      dataKey="value"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#f1f5f9'
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Export Section */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">Export Analytics Data</h3>
                  <p className="text-sm text-slate-400 mt-1">Download chart data as CSV files</p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => exportAnalytics('signups')}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Signups</span>
                  </button>
                  <button
                    onClick={() => exportAnalytics('skills')}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Skills</span>
                  </button>
                  <button
                    onClick={() => exportAnalytics('referrals')}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Referrals</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'referrals' && (
          <ReferralsPanel />
        )}

        {activeTab === 'settings' && (
          <SettingsPanel />
        )}
      </div>
    </div>
  );
}

function SettingsPanel() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [activeSection, setActiveSection] = useState('security');
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    loadSettings();
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      const response = await fetch('/api/admin/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Failed to check user:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      const response = await fetch('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      } else {
        console.error('Failed to load settings');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (updates: Partial<SettingsData>) => {
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...updates,
          updatedBy: user?.username || 'admin'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        setSaveSuccess('Settings saved successfully!');
        setTimeout(() => setSaveSuccess(''), 3000);
      } else {
        const error = await response.json();
        setSaveError(error.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveError('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const sections = [
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'beta', label: 'Beta Program', icon: Users },
    { id: 'advanced', label: 'Advanced', icon: Cog }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">System Settings</h2>
            <p className="text-slate-400 mt-1">Configure system-wide settings and preferences</p>
          </div>
          {saveSuccess && (
            <div className="text-green-400 text-sm flex items-center">
              <Check className="w-4 h-4 mr-2" />
              {saveSuccess}
            </div>
          )}
          {saveError && (
            <div className="text-red-400 text-sm flex items-center">
              <X className="w-4 h-4 mr-2" />
              {saveError}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <nav className="space-y-2">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeSection === section.id
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <section.icon className="w-4 h-4" />
                  <span>{section.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            {/* Security Settings */}
            {activeSection === 'security' && (
              <SecuritySettings
                settings={settings?.security || {}}
                onSave={saveSettings}
                isSaving={isSaving}
                userRole={user?.role}
              />
            )}

            {/* Email Settings */}
            {activeSection === 'email' && (
              <EmailSettings
                settings={settings?.email || {}}
                onSave={saveSettings}
                isSaving={isSaving}
                userRole={user?.role}
              />
            )}

            {/* Notification Settings */}
            {activeSection === 'notifications' && (
              <NotificationSettings
                settings={settings?.notifications || {}}
                onSave={saveSettings}
                isSaving={isSaving}
              />
            )}

            {/* Database Settings */}
            {activeSection === 'database' && (
              <DatabaseSettings
                settings={settings?.database || {}}
                onSave={saveSettings}
                isSaving={isSaving}
              />
            )}

            {/* Maintenance Settings */}
            {activeSection === 'maintenance' && (
              <MaintenanceSettings
                settings={settings?.maintenance || {}}
                onSave={saveSettings}
                isSaving={isSaving}
              />
            )}

            {/* Beta Program Settings */}
            {activeSection === 'beta' && (
              <BetaSettings
                settings={settings?.beta || {}}
                onSave={saveSettings}
                isSaving={isSaving}
              />
            )}

            {/* Advanced Settings */}
            {activeSection === 'advanced' && (
              <AdvancedSettings
                settings={settings?.advanced || {}}
                onSave={saveSettings}
                isSaving={isSaving}
                userRole={user?.role}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReferralsPanel() {
  const [referralStats, setReferralStats] = useState<{
    totalReferrals: number;
    totalReferralRewards: number;
    activeReferrers: number;
    conversionRate: number;
    topReferrers: Array<{
      _id: string;
      name: string;
      email: string;
      referralCount: number;
      rewardMonths: number;
    }>;
    recentReferrals: Array<{
      referrerName: string;
      referrerEmail: string;
      referredName: string;
      referredEmail: string;
      referredAt: string;
    }>;
    referralTrends: Array<{
      date: string;
      referrals: number;
      cumulative: number;
    }>;
    achievementStats: Array<{
      milestone: string;
      count: number;
      reward: string;
    }>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      const response = await fetch('/api/admin/referral-analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setReferralStats(data.analytics);
      } else {
        console.error('Failed to fetch referral analytics');
        setError('Failed to load referral analytics');
      }
    } catch (err) {
      console.error('Failed to load referral data:', err);
      setError('Failed to load referral analytics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!referralStats) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No referral data available</p>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Referral Analytics</h2>
            <p className="text-slate-400 mt-1">Track your referral program performance</p>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-2xl font-bold">{referralStats.totalReferrals}</p>
              <p className="text-sm text-slate-400">Total Referrals</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-2xl font-bold">{referralStats.totalReferralRewards}</p>
              <p className="text-sm text-slate-400">Total Reward Months</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex items-center space-x-3">
            <Activity className="w-8 h-8 text-purple-400" />
            <div>
              <p className="text-2xl font-bold">{referralStats.activeReferrers}</p>
              <p className="text-sm text-slate-400">Active Referrers</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-8 h-8 text-yellow-400" />
            <div>
              <p className="text-2xl font-bold">{referralStats.conversionRate}%</p>
              <p className="text-sm text-slate-400">Conversion Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Referral Trends */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-xl font-semibold mb-4">Referral Growth (7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={referralStats.referralTrends}>
              <defs>
                <linearGradient id="colorReferrals" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                fontSize={12}
                tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Area
                type="monotone"
                dataKey="referrals"
                stroke="#8884d8"
                fillOpacity={1}
                fill="url(#colorReferrals)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Cumulative Referrals */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-xl font-semibold mb-4">Cumulative Referral Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={referralStats.referralTrends}>
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                fontSize={12}
                tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Line
                type="monotone"
                dataKey="cumulative"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Referrers & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Referrers Leaderboard */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Top Referrers</h3>
            <button
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors"
              onClick={() => {/* Implement export */}}
            >
              Export
            </button>
          </div>
          <div className="space-y-3">
            {referralStats.topReferrers.map((referrer, index) => (
              <div key={referrer._id} className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <User className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="font-medium">{referrer.name}</p>
                    <p className="text-sm text-slate-400">{referrer.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{referrer.referralCount}</p>
                  <p className="text-sm text-slate-400">{referrer.rewardMonths} months</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Referrals */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-xl font-semibold mb-4">Recent Referrals</h3>
          <div className="space-y-3">
            {referralStats.recentReferrals.map((referral, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="font-medium">
                      {referral.referrerName} → {referral.referredName}
                    </p>
                    <p className="text-sm text-slate-400">
                      {referral.referrerEmail}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm text-slate-400">
                  {new Date(referral.referredAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Achievement Stats */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h3 className="text-xl font-semibold mb-4">Achievement Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {referralStats.achievementStats.map((achievement, index) => (
            <div key={index} className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm capitalize">
                    {achievement.milestone.replace('_', ' ')}
                  </p>
                  <p className="text-2xl font-bold text-purple-400">{achievement.count}</p>
                  <p className="text-xs text-slate-400">{achievement.reward}</p>
                </div>
                <Trophy className={`w-8 h-8 ${
                  index === 0 ? 'text-gray-400' :
                  index === 1 ? 'text-blue-400' :
                  index === 2 ? 'text-yellow-400' :
                  'text-purple-400'
                }`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Actions */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Export Referral Data</h3>
            <p className="text-sm text-slate-400 mt-1">Download comprehensive referral analytics</p>
          </div>
          <div className="flex space-x-3">
            <button
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
              onClick={() => {/* Export CSV */}}
            >
              <Download className="w-4 h-4" />
              <span>CSV Export</span>
            </button>
            <button
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
              onClick={() => {/* Generate Report */}}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Import additional icons at the top
import {
  Mail,
  Bell,
  Database,
  Wrench,
  Cog,
  Check,
  X
} from 'lucide-react';

// Individual Settings Components
function SecuritySettings({ settings, onSave, isSaving, userRole }: SecurityComponentProps) {
  const [formData, setFormData] = useState(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ security: formData });
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">Security Settings</h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              value={formData.sessionTimeout || 60}
              onChange={(e) => setFormData({...formData, sessionTimeout: parseInt(e.target.value)})}
              min="5"
              max="1440"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={userRole !== 'super_admin'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Max Login Attempts
            </label>
            <input
              type="number"
              value={formData.maxLoginAttempts || 5}
              onChange={(e) => setFormData({...formData, maxLoginAttempts: parseInt(e.target.value)})}
              min="1"
              max="20"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={userRole !== 'super_admin'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Password Min Length
            </label>
            <input
              type="number"
              value={formData.passwordMinLength || 12}
              onChange={(e) => setFormData({...formData, passwordMinLength: parseInt(e.target.value)})}
              min="8"
              max="128"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={userRole !== 'super_admin'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Lockout Duration (minutes)
            </label>
            <input
              type="number"
              value={formData.lockoutDuration || 30}
              onChange={(e) => setFormData({...formData, lockoutDuration: parseInt(e.target.value)})}
              min="5"
              max="1440"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={userRole !== 'super_admin'}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="requireTwoFactor"
              checked={formData.requireTwoFactor || false}
              onChange={(e) => setFormData({...formData, requireTwoFactor: e.target.checked})}
              className="rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
              disabled={userRole !== 'super_admin'}
            />
            <label htmlFor="requireTwoFactor" className="ml-2 text-sm text-slate-300">
              Require Two-Factor Authentication
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enableBruteForceProtection"
              checked={formData.enableBruteForceProtection || false}
              onChange={(e) => setFormData({...formData, enableBruteForceProtection: e.target.checked})}
              className="rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
              disabled={userRole !== 'super_admin'}
            />
            <label htmlFor="enableBruteForceProtection" className="ml-2 text-sm text-slate-300">
              Enable Brute Force Protection
            </label>
          </div>
        </div>

        {userRole === 'super_admin' && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white rounded-lg transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Security Settings'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

function EmailSettings({ settings, onSave, isSaving, userRole }: EmailComponentProps) {
  const [formData, setFormData] = useState(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ email: formData });
  };

  if (userRole !== 'super_admin') {
    return (
      <div>
        <h3 className="text-xl font-semibold mb-6">Email Settings</h3>
        <p className="text-slate-400">Super admin access required to modify email settings.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">Email Settings</h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              SMTP Host
            </label>
            <input
              type="text"
              value={formData.smtpHost || ''}
              onChange={(e) => setFormData({...formData, smtpHost: e.target.value})}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              SMTP Port
            </label>
            <input
              type="number"
              value={formData.smtpPort || 587}
              onChange={(e) => setFormData({...formData, smtpPort: parseInt(e.target.value)})}
              min="1"
              max="65535"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              SMTP Username
            </label>
            <input
              type="text"
              value={formData.smtpUser || ''}
              onChange={(e) => setFormData({...formData, smtpUser: e.target.value})}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              SMTP Password
            </label>
            <input
              type="password"
              value={formData.smtpPassword || ''}
              onChange={(e) => setFormData({...formData, smtpPassword: e.target.value})}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              From Email
            </label>
            <input
              type="email"
              value={formData.fromEmail || ''}
              onChange={(e) => setFormData({...formData, fromEmail: e.target.value})}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              From Name
            </label>
            <input
              type="text"
              value={formData.fromName || ''}
              onChange={(e) => setFormData({...formData, fromName: e.target.value})}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="smtpSecure"
              checked={formData.smtpSecure || false}
              onChange={(e) => setFormData({...formData, smtpSecure: e.target.checked})}
              className="rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="smtpSecure" className="ml-2 text-sm text-slate-300">
              Use SSL/TLS Encryption
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enableNotifications"
              checked={formData.enableNotifications || false}
              onChange={(e) => setFormData({...formData, enableNotifications: e.target.checked})}
              className="rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="enableNotifications" className="ml-2 text-sm text-slate-300">
              Enable Email Notifications
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white rounded-lg transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Email Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

function NotificationSettings({ settings, onSave, isSaving }: NotificationComponentProps) {
  const [formData, setFormData] = useState(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ notifications: formData });
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">Notification Settings</h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="emailOnNewSignup"
              checked={formData.emailOnNewSignup || false}
              onChange={(e) => setFormData({...formData, emailOnNewSignup: e.target.checked})}
              className="rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="emailOnNewSignup" className="ml-2 text-sm text-slate-300">
              Email on New Signup
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="emailOnSystemError"
              checked={formData.emailOnSystemError || false}
              onChange={(e) => setFormData({...formData, emailOnSystemError: e.target.checked})}
              className="rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="emailOnSystemError" className="ml-2 text-sm text-slate-300">
              Email on System Error
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="emailDigest"
              checked={formData.emailDigest || false}
              onChange={(e) => setFormData({...formData, emailDigest: e.target.checked})}
              className="rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="emailDigest" className="ml-2 text-sm text-slate-300">
              Enable Email Digest
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Email Digest Frequency
          </label>
          <select
            value={formData.emailDigestFrequency || 'daily'}
            onChange={(e) => setFormData({...formData, emailDigestFrequency: e.target.value})}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Slack Webhook URL
          </label>
          <input
            type="url"
            value={formData.slackWebhookUrl || ''}
            onChange={(e) => setFormData({...formData, slackWebhookUrl: e.target.value})}
            placeholder="https://hooks.slack.com/services/..."
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Discord Webhook URL
          </label>
          <input
            type="url"
            value={formData.discordWebhookUrl || ''}
            onChange={(e) => setFormData({...formData, discordWebhookUrl: e.target.value})}
            placeholder="https://discord.com/api/webhooks/..."
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white rounded-lg transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Notification Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

function DatabaseSettings({ settings, onSave, isSaving }: DatabaseComponentProps) {
  const [formData, setFormData] = useState(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ database: formData });
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">Database Settings</h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Max Pool Size
            </label>
            <input
              type="number"
              value={formData.maxPoolSize || 10}
              onChange={(e) => setFormData({...formData, maxPoolSize: parseInt(e.target.value)})}
              min="1"
              max="100"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Min Pool Size
            </label>
            <input
              type="number"
              value={formData.minPoolSize || 2}
              onChange={(e) => setFormData({...formData, minPoolSize: parseInt(e.target.value)})}
              min="0"
              max="50"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Server Selection Timeout (ms)
            </label>
            <input
              type="number"
              value={formData.serverSelectionTimeout || 5000}
              onChange={(e) => setFormData({...formData, serverSelectionTimeout: parseInt(e.target.value)})}
              min="1000"
              max="60000"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Socket Timeout (ms)
            </label>
            <input
              type="number"
              value={formData.socketTimeout || 45000}
              onChange={(e) => setFormData({...formData, socketTimeout: parseInt(e.target.value)})}
              min="5000"
              max="120000"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Slow Query Threshold (ms)
            </label>
            <input
              type="number"
              value={formData.slowQueryThreshold || 100}
              onChange={(e) => setFormData({...formData, slowQueryThreshold: parseInt(e.target.value)})}
              min="1"
              max="60000"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="enableProfiling"
              checked={formData.enableProfiling || false}
              onChange={(e) => setFormData({...formData, enableProfiling: e.target.checked})}
              className="rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="enableProfiling" className="ml-2 text-sm text-slate-300">
              Enable Database Profiling
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="logSlowQueries"
              checked={formData.logSlowQueries || false}
              onChange={(e) => setFormData({...formData, logSlowQueries: e.target.checked})}
              className="rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="logSlowQueries" className="ml-2 text-sm text-slate-300">
              Log Slow Queries
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white rounded-lg transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Database Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

function MaintenanceSettings({ settings, onSave, isSaving }: MaintenanceComponentProps) {
  const [formData, setFormData] = useState(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ maintenance: formData });
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">System Maintenance</h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Backup Retention (days)
            </label>
            <input
              type="number"
              value={formData.backupRetention || 30}
              onChange={(e) => setFormData({...formData, backupRetention: parseInt(e.target.value)})}
              min="1"
              max="365"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Log Retention (days)
            </label>
            <input
              type="number"
              value={formData.logRetention || 7}
              onChange={(e) => setFormData({...formData, logRetention: parseInt(e.target.value)})}
              min="1"
              max="365"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Maintenance Message
          </label>
          <textarea
            value={formData.maintenanceMessage || ''}
            onChange={(e) => setFormData({...formData, maintenanceMessage: e.target.value})}
            rows={3}
            placeholder="Message to display when maintenance mode is enabled"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="enableMaintenanceMode"
              checked={formData.enableMaintenanceMode || false}
              onChange={(e) => setFormData({...formData, enableMaintenanceMode: e.target.checked})}
              className="rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="enableMaintenanceMode" className="ml-2 text-sm text-slate-300">
              Enable Maintenance Mode
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enableBackup"
              checked={formData.enableBackup || false}
              onChange={(e) => setFormData({...formData, enableBackup: e.target.checked})}
              className="rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="enableBackup" className="ml-2 text-sm text-slate-300">
              Enable Automatic Backups
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enableLogsRotation"
              checked={formData.enableLogsRotation || false}
              onChange={(e) => setFormData({...formData, enableLogsRotation: e.target.checked})}
              className="rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="enableLogsRotation" className="ml-2 text-sm text-slate-300">
              Enable Log Rotation
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enableMetricsCollection"
              checked={formData.enableMetricsCollection || false}
              onChange={(e) => setFormData({...formData, enableMetricsCollection: e.target.checked})}
              className="rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="enableMetricsCollection" className="ml-2 text-sm text-slate-300">
              Enable Metrics Collection
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Backup Frequency
          </label>
          <select
            value={formData.backupFrequency || 'weekly'}
            onChange={(e) => setFormData({...formData, backupFrequency: e.target.value})}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white rounded-lg transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Maintenance Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

function BetaSettings({ settings, onSave, isSaving }: BetaComponentProps) {
  const [formData, setFormData] = useState(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ beta: formData });
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">Beta Program Settings</h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Max Positions
            </label>
            <input
              type="number"
              value={formData.maxPositions || 1000}
              onChange={(e) => setFormData({...formData, maxPositions: parseInt(e.target.value)})}
              min="1"
              max="10000"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Default Skill Level
            </label>
            <select
              value={formData.defaultSkillLevel || 'beginner'}
              onChange={(e) => setFormData({...formData, defaultSkillLevel: e.target.value})}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="waitingListEnabled"
              checked={formData.waitingListEnabled || false}
              onChange={(e) => setFormData({...formData, waitingListEnabled: e.target.checked})}
              className="rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="waitingListEnabled" className="ml-2 text-sm text-slate-300">
              Enable Waiting List
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoApprovalEnabled"
              checked={formData.autoApprovalEnabled || false}
              onChange={(e) => setFormData({...formData, autoApprovalEnabled: e.target.checked})}
              className="rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="autoApprovalEnabled" className="ml-2 text-sm text-slate-300">
              Enable Auto Approval
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="requirePhone"
              checked={formData.requirePhone || false}
              onChange={(e) => setFormData({...formData, requirePhone: e.target.checked})}
              className="rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="requirePhone" className="ml-2 text-sm text-slate-300">
              Require Phone Number
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enablePositionPriority"
              checked={formData.enablePositionPriority || false}
              onChange={(e) => setFormData({...formData, enablePositionPriority: e.target.checked})}
              className="rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="enablePositionPriority" className="ml-2 text-sm text-slate-300">
              Enable Position Priority
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white rounded-lg transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Beta Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

function AdvancedSettings({ settings, onSave, isSaving, userRole }: AdvancedComponentProps) {
  const [formData, setFormData] = useState(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ advanced: formData });
  };

  if (userRole !== 'super_admin') {
    return (
      <div>
        <h3 className="text-xl font-semibold mb-6">Advanced Settings</h3>
        <p className="text-slate-400">Super admin access required to modify advanced settings.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">Advanced Settings</h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              API Rate Limit (per minute)
            </label>
            <input
              type="number"
              value={formData.apiRateLimitPerMinute || 100}
              onChange={(e) => setFormData({...formData, apiRateLimitPerMinute: parseInt(e.target.value)})}
              min="10"
              max="10000"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Cache TTL (seconds)
            </label>
            <input
              type="number"
              value={formData.cacheTtl || 3600}
              onChange={(e) => setFormData({...formData, cacheTtl: parseInt(e.target.value)})}
              min="60"
              max="86400"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="enableApiRateLimit"
              checked={formData.enableApiRateLimit || false}
              onChange={(e) => setFormData({...formData, enableApiRateLimit: e.target.checked})}
              className="rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="enableApiRateLimit" className="ml-2 text-sm text-slate-300">
              Enable API Rate Limiting
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enableCors"
              checked={formData.enableCors || false}
              onChange={(e) => setFormData({...formData, enableCors: e.target.checked})}
              className="rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="enableCors" className="ml-2 text-sm text-slate-300">
              Enable CORS
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enableCompression"
              checked={formData.enableCompression || false}
              onChange={(e) => setFormData({...formData, enableCompression: e.target.checked})}
              className="rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="enableCompression" className="ml-2 text-sm text-slate-300">
              Enable Response Compression
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="cacheEnabled"
              checked={formData.cacheEnabled || false}
              onChange={(e) => setFormData({...formData, cacheEnabled: e.target.checked})}
              className="rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="cacheEnabled" className="ml-2 text-sm text-slate-300">
              Enable Caching
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enableHealthChecks"
              checked={formData.enableHealthChecks || false}
              onChange={(e) => setFormData({...formData, enableHealthChecks: e.target.checked})}
              className="rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="enableHealthChecks" className="ml-2 text-sm text-slate-300">
              Enable Health Checks
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white rounded-lg transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Advanced Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
