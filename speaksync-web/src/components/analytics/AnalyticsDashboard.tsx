'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon,
  ClockIcon,
  SpeakerWaveIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ShareIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface AnalyticsData {
  totalSessions: number;
  totalPracticeTime: number;
  averageWPM: number;
  improvementTrend: number;
  fillerWordTrend: number;
  recentSessions: Array<{
    date: string;
    wpm: number;
    fillerWords: number;
    adherence: number;
    duration: number;
  }>;
  weeklyStats: Array<{
    week: string;
    sessions: number;
    practiceTime: number;
  }>;
  performanceMetrics: {
    consistency: number;
    accuracy: number;
    fluency: number;
  };
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
  onFilterChange?: (filters: { timeRange: string }) => void;
  onExport?: () => void;
}

export default function AnalyticsDashboard({ 
  data, 
  onFilterChange, 
  onExport 
}: AnalyticsDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('wpm');

  const timeRangeOptions = [
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: '90d', label: '90 days' },
    { value: '1y', label: '1 year' },
  ];

  const metricOptions = [
    { value: 'wpm', label: 'Words Per Minute', color: '#6366f1' },
    { value: 'fillerWords', label: 'Filler Words', color: '#ef4444' },
    { value: 'adherence', label: 'Script Adherence', color: '#10b981' },
    { value: 'duration', label: 'Session Duration', color: '#f59e0b' },
  ];

  const formatTime = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatTrend = (value: number) => {
    const isPositive = value > 0;
    const Icon = isPositive ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    
    return (
      <div className={`flex items-center ${color}`}>
        <Icon className="h-4 w-4 mr-1" />
        <span>{Math.abs(value).toFixed(1)}%</span>
      </div>
    );
  };

  const chartData = useMemo(() => {
    return data.recentSessions.map((session, index) => ({
      session: `S${index + 1}`,
      date: session.date,
      wpm: session.wpm,
      fillerWords: session.fillerWords,
      adherence: session.adherence,
      duration: session.duration / 60000, // Convert to minutes
    }));
  }, [data.recentSessions]);

  const pieData = [
    { name: 'Consistency', value: data.performanceMetrics.consistency, color: '#6366f1' },
    { name: 'Accuracy', value: data.performanceMetrics.accuracy, color: '#10b981' },
    { name: 'Fluency', value: data.performanceMetrics.fluency, color: '#f59e0b' },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your speaking performance and improvement</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Time Range Filter */}
          <select
            value={selectedTimeRange}
            onChange={(e) => {
              setSelectedTimeRange(e.target.value);
              onFilterChange?.({ timeRange: e.target.value });
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {timeRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            onClick={onExport}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ShareIcon className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Sessions</p>
              <p className="text-3xl font-bold text-gray-900">{data.totalSessions}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Practice Time</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatTime(data.totalPracticeTime)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <ClockIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Average WPM</p>
              <p className="text-3xl font-bold text-gray-900">{data.averageWPM.toFixed(0)}</p>
              {formatTrend(data.improvementTrend)}
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <SpeakerWaveIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Filler Words</p>
              <p className="text-3xl font-bold text-gray-900">Improving</p>
              {formatTrend(-data.fillerWordTrend)}
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <DocumentTextIcon className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Trend Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Performance Trend</h3>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              {metricOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="session" 
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Line
                type="monotone"
                dataKey={selectedMetric}
                stroke={metricOptions.find(m => m.value === selectedMetric)?.color}
                strokeWidth={3}
                dot={{ fill: metricOptions.find(m => m.value === selectedMetric)?.color, r: 6 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Performance Metrics Pie Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Performance Scores</h3>
          
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Score']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-4 space-y-3">
            {pieData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-700">{item.name}</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {item.value.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Weekly Activity Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Weekly Activity</h3>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.weeklyStats}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="week" 
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Bar 
              dataKey="sessions" 
              fill="#6366f1" 
              radius={[4, 4, 0, 0]}
              name="Sessions"
            />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Recent Sessions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Recent Sessions</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  WPM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Filler Words
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Adherence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.recentSessions.slice(0, 10).map((session, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {new Date(session.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {session.wpm.toFixed(0)} WPM
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTime(session.duration)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      session.fillerWords <= 3 ? 'bg-green-100 text-green-800' : 
                      session.fillerWords <= 6 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {session.fillerWords}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      session.adherence >= 80 ? 'bg-green-100 text-green-800' : 
                      session.adherence >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {session.adherence.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 flex items-center">
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
