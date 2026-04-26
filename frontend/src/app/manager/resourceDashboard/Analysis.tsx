import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Package,
  Building2,
  Microscope,
  Users,
  Dumbbell,
  Library,
  Monitor,
  PieChart,
  Activity,
  AlertCircle,
  CheckCircle,
  Wrench,
  ChevronLeft,
  Download,
} from 'lucide-react';
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import logo from '../../../assets/logo.jpeg';
import './analysis.css';
import { generateReport } from '../../../utils/reportGenerator';

// Raw API response interface (snake_case from backend)
interface ResourceApi {
  id: number;
  resourceCode?: string;
  resource_code?: string;
  name: string;
  type: string;
  targetAudience?: 'STUDENT' | 'LECTURER' | 'BOTH' | string;
  target_audience?: 'STUDENT' | 'LECTURER' | 'BOTH' | string;
  capacity: number;
  location: string;
  description: string;
  availabilityWindows?: string;
  availability_windows?: string;
  status: 'ACTIVE' | 'OUT_OF_SERVICE' | 'MAINTENANCE';
  available?: boolean;
  isAvailable?: boolean;
  imageUrl?: string;
  image_url?: string;
  dailyRate?: number;
  daily_rate?: number;
  createdBy?: string;
  created_by?: string;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

// Normalized Resource interface (camelCase for frontend)
interface Resource {
  id: number;
  resourceCode: string;
  name: string;
  type: string;
  targetAudience: 'STUDENT' | 'LECTURER' | 'BOTH';
  capacity: number;
  location: string;
  description: string;
  availabilityWindows: string;
  status: 'ACTIVE' | 'OUT_OF_SERVICE' | 'MAINTENANCE';
  available: boolean;
  imageUrl?: string;
  dailyRate: number;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ResourceTypeStats {
  type: string;
  count: number;
  active: number;
  maintenance: number;
  outOfService: number;
  available: number;
  totalCapacity: number;
  avgCapacity: number;
}

interface StatusDistribution {
  status: string;
  count: number;
  color: string;
}

interface PieLabelProps {
  name?: string;
  percent?: number;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const API_BASE_URL = 'http://localhost:8081/api/resource-manager';

const formatTypeLabel = (type: string) => type.replace(/_/g, ' ');

const getTypeIcon = (type: string) => {
  const typeLower = type.toLowerCase();
  if (typeLower.includes('lecture') || typeLower.includes('hall')) return <Building2 size={20} />;
  if (typeLower.includes('lab')) return <Microscope size={20} />;
  if (typeLower.includes('meeting')) return <Users size={20} />;
  if (typeLower.includes('discussion')) return <Users size={20} />;
  if (typeLower.includes('sports')) return <Dumbbell size={20} />;
  if (typeLower.includes('equipment')) return <Monitor size={20} />;
  if (typeLower.includes('library')) return <Library size={20} />;
  if (typeLower.includes('auditorium')) return <Building2 size={20} />;
  return <Package size={20} />;
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'ACTIVE': return <CheckCircle size={16} />;
    case 'MAINTENANCE': return <Wrench size={16} />;
    case 'OUT_OF_SERVICE': return <AlertCircle size={16} />;
    default: return <Activity size={16} />;
  }
};

// Normalize function to convert API response to frontend Resource format
const normalizeResource = (resource: ResourceApi): Resource => {
  return {
    id: resource.id,
    resourceCode: resource.resourceCode || resource.resource_code || '',
    name: resource.name || '',
    type: resource.type || 'LECTURE_HALL',
    targetAudience: (resource.targetAudience || resource.target_audience || 'BOTH') as 'STUDENT' | 'LECTURER' | 'BOTH',
    capacity: resource.capacity ?? 0,
    location: resource.location || '',
    description: resource.description || '',
    availabilityWindows: resource.availabilityWindows || resource.availability_windows || '',
    status: resource.status || 'ACTIVE',
    available: resource.available !== undefined ? resource.available : (resource.isAvailable !== undefined ? resource.isAvailable : true),
    imageUrl: resource.imageUrl || resource.image_url || '',
    dailyRate: resource.dailyRate !== undefined ? resource.dailyRate : (resource.daily_rate !== undefined ? resource.daily_rate : 0),
    createdBy: resource.createdBy || resource.created_by || 'resource_manager_1',
    createdAt: resource.createdAt || resource.created_at,
    updatedAt: resource.updatedAt || resource.updated_at,
  };
};

const Analysis: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'overview' | 'types'>('overview');

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const response = await axios.get<ApiResponse<ResourceApi[]>>(`${API_BASE_URL}/resources/all`);
      console.log('API Response:', response.data);
      
      if (response.data.success) {
        const normalizedResources = (response.data.data || []).map(item => normalizeResource(item));
        console.log('Normalized Resources:', normalizedResources);
        setResources(normalizedResources);
      } else {
        setResources([]);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalResources = resources.length;
  const activeResources = resources.filter(r => r.status === 'ACTIVE').length;
  const maintenanceResources = resources.filter(r => r.status === 'MAINTENANCE').length;
  const outOfServiceResources = resources.filter(r => r.status === 'OUT_OF_SERVICE').length;
  const availableResources = resources.filter(r => r.available === true && r.status === 'ACTIVE').length;

  const activeRate = totalResources > 0 ? (activeResources / totalResources * 100).toFixed(1) : '0';
  const availabilityRate = totalResources > 0 ? (availableResources / totalResources * 100).toFixed(1) : '0';

  // Resource type statistics
  const typeStats: ResourceTypeStats[] = [];
  const typeMap = new Map<string, ResourceTypeStats>();

  resources.forEach(resource => {
    const type = resource.type;
    if (!typeMap.has(type)) {
      typeMap.set(type, {
        type,
        count: 0,
        active: 0,
        maintenance: 0,
        outOfService: 0,
        available: 0,
        totalCapacity: 0,
        avgCapacity: 0,
      });
    }

    const stats = typeMap.get(type)!;
    stats.count++;
    if (resource.status === 'ACTIVE') stats.active++;
    if (resource.status === 'MAINTENANCE') stats.maintenance++;
    if (resource.status === 'OUT_OF_SERVICE') stats.outOfService++;
    if (resource.available && resource.status === 'ACTIVE') stats.available++;
    if (resource.capacity) stats.totalCapacity += resource.capacity;
  });

  typeMap.forEach(stats => {
    stats.avgCapacity = stats.count > 0 ? Math.round(stats.totalCapacity / stats.count) : 0;
    typeStats.push(stats);
  });

  typeStats.sort((a, b) => b.count - a.count);

  // Status distribution for pie chart
  const statusDistribution: StatusDistribution[] = [
    { status: 'Active', count: activeResources, color: '#2d7a4a' },
    { status: 'Maintenance', count: maintenanceResources, color: '#3b5a8f' },
    { status: 'Out of Service', count: outOfServiceResources, color: '#002147' },
  ];

  // Type data for pie chart
  const typePieData = typeStats.map(stat => ({
    name: formatTypeLabel(stat.type),
    value: stat.count,
  }));

  // Theme colors for pie chart - ALL BLUE SHADES ONLY
  const BLUE_THEME_COLORS = [
    '#002147', // Dark Navy
    '#0a2e5c', // Navy
    '#143b71', // Deep Blue
    '#1e4786', // Rich Blue
    '#28549b', // Medium Blue
    '#3260b0', // Vibrant Blue
    '#3c6cc5', // Bright Blue
    '#4678da', // Lighter Blue
    '#5084ef', // Light Blue
    '#5a90ff', // Soft Blue
  ];

  // Custom label formatter for pie charts
  const renderPieLabel = ({ name, percent }: PieLabelProps) => {
    if (!name || percent === undefined) return '';
    return `${name}: ${(percent * 100).toFixed(0)}%`;
  };

  // Function to get utilization color based on percentage
  const getUtilizationColor = (utilizationNum: number) => {
    if (utilizationNum === 0) return '#ef4444'; // Red for 0%
    if (utilizationNum > 70) return '#2d7a4a'; // Blue-green for high
    if (utilizationNum > 30) return '#3b5a8f'; // Medium blue for medium
    return '#002147'; // Dark navy for low
  };

  // Generate Report Function - WITHOUT LOGO
  const handleDownloadReport = () => {
    console.log('Generating report with resources:', resources);
    
    // Group resources by type
    const resourcesByType = new Map<string, Resource[]>();
    
    resources.forEach(resource => {
      const type = resource.type;
      if (!resourcesByType.has(type)) {
        resourcesByType.set(type, []);
      }
      resourcesByType.get(type)!.push(resource);
    });

    // Create sections for each resource type
    const sections = Array.from(resourcesByType.keys())
      .sort()
      .map(type => {
        const typeResources = resourcesByType.get(type) || [];
        
        // Define headers based on resource type
        const isEquipment = type === 'EQUIPMENT';
        const headers = isEquipment 
          ? ['Resource Code', 'Name', 'Location', 'Status', 'Availability', 'Description']
          : ['Resource Code', 'Name', 'Location', 'Capacity', 'Status', 'Availability', 'Description'];
        
        // Create rows - resourceCode is now properly populated from normalized data
        const rows = typeResources.map(resource => {
          const statusText = resource.status === 'ACTIVE' ? 'Active' : resource.status === 'MAINTENANCE' ? 'Maintenance' : 'Out of Service';
          const availabilityText = resource.available && resource.status === 'ACTIVE' ? 'Available' : 'Unavailable';
          
          console.log(`Resource ${resource.name}: code = ${resource.resourceCode}`);
          
          if (isEquipment) {
            return [
              resource.resourceCode || '-',
              resource.name || '-',
              resource.location || '-',
              statusText,
              availabilityText,
              resource.description || '-',
            ];
          } else {
            return [
              resource.resourceCode || '-',
              resource.name || '-',
              resource.location || '-',
              resource.capacity?.toString() || '0',
              statusText,
              availabilityText,
              resource.description || '-',
            ];
          }
        });
        
        const activeCount = typeResources.filter(r => r.status === 'ACTIVE').length;
        const availableCount = typeResources.filter(r => r.available && r.status === 'ACTIVE').length;
        
        return {
          title: `${formatTypeLabel(type)} (${typeResources.length} ${typeResources.length === 1 ? 'resource' : 'resources'})`,
          subtitle: `Active: ${activeCount} | Available: ${availableCount} | ${type !== 'EQUIPMENT' ? `Total Capacity: ${typeResources.reduce((sum, r) => sum + (r.capacity || 0), 0).toLocaleString()}` : ''}`,
          headers: headers,
          rows: rows,
          summary: `${typeResources.length} ${typeResources.length === 1 ? 'resource' : 'resources'} in this category`
        };
      });

    // Generate the report WITHOUT LOGO (pass undefined or empty string)
    generateReport({
      title: "Resource Inventory Report",
      subtitle: "Complete Asset and Facility Management Report",
      reportType: "Resource Management Report",
      sections: sections,
      totalRecords: resources.length,
      additionalInfo: {
        totalStudents: resources.length,
        academicYear: new Date().getFullYear().toString(),
        generatedBy: localStorage.getItem('name') || 'Resource Manager'
      },
      logoUrl: undefined  // Remove logo from report header
    });
  };

  return (
    <div className="analysis-dashboard">
      {/* Header */}
      <header className="analysis-header">
        <div className="header-left">
          <div className="brand-block">
            <div className="brand-logo-shell">
              <div className="brand-logo-inner">
                <img
                  src={logo}
                  alt="Northbridge University Logo"
                  className="brand-logo-image"
                />
              </div>
            </div>
            <div>
              <h1 className="brand-title">Northbridge</h1>
              <p className="brand-subtitle">Resource Analytics Dashboard</p>
            </div>
          </div>

          <nav className="header-nav">
            <a 
              className="nav-link" 
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = '/manager/resource/dashboard';
              }}
            >
              Resources
            </a>
            <a 
              className="nav-link nav-link-active" 
              href="#"
              onClick={(e) => {
                e.preventDefault();
              }}
            >
              Analytics
            </a>
          </nav>
        </div>

        <div className="header-right">
          <div className="user-block">
            <div className="user-meta">
              <p className="user-name">{localStorage.getItem('name') || 'Resource Manager'}</p>
              <p className="user-email">
                {localStorage.getItem('email') || 'resource.m@campus.com'}
              </p>
            </div>

            <button
              className="btn-back-dashboard"
              onClick={() => window.location.href = '/manager/resource/dashboard'}
            >
              <ChevronLeft size={16} />
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs with Download Report Button in the same row */}
      <div className="analysis-nav">
        <div className="nav-tabs-left">
          <button
            className={`nav-tab ${selectedView === 'overview' ? 'active' : ''}`}
            onClick={() => setSelectedView('overview')}
          >
            <Activity size={18} />
            Overview
          </button>
          <button
            className={`nav-tab ${selectedView === 'types' ? 'active' : ''}`}
            onClick={() => setSelectedView('types')}
          >
            <PieChart size={18} />
            Resource Types
          </button>
        </div>
        
        <div className="nav-tabs-right">
          <button
            className="btn-download-report"
            onClick={handleDownloadReport}
            disabled={loading || resources.length === 0}
          >
            <Download size={16} />
            Download Report
          </button>
        </div>
      </div>

      <main className="analysis-main">
        {loading ? (
          <div className="loading-wrap">
            <div className="loader"></div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-icon blue">
                  <Package size={24} />
                </div>
                <div className="kpi-content">
                  <p className="kpi-label">Total Resources</p>
                  <p className="kpi-value">{totalResources}</p>
                  <p className="kpi-trend">Across {typeStats.length} categories</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon green">
                  <CheckCircle size={24} />
                </div>
                <div className="kpi-content">
                  <p className="kpi-label">Active Resources</p>
                  <p className="kpi-value">{activeResources}</p>
                  <p className="kpi-trend">{activeRate}% of total</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon emerald">
                  <Activity size={24} />
                </div>
                <div className="kpi-content">
                  <p className="kpi-label">Available Now</p>
                  <p className="kpi-value">{availableResources}</p>
                  <p className="kpi-trend">{availabilityRate}% availability</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon amber">
                  <Wrench size={24} />
                </div>
                <div className="kpi-content">
                  <p className="kpi-label">Maintenance</p>
                  <p className="kpi-value">{maintenanceResources}</p>
                  <p className="kpi-trend">Requires attention</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon red">
                  <AlertCircle size={24} />
                </div>
                <div className="kpi-content">
                  <p className="kpi-label">Out of Service</p>
                  <p className="kpi-value">{outOfServiceResources}</p>
                  <p className="kpi-trend">Temporarily offline</p>
                </div>
              </div>
            </div>

            {/* Overview View */}
            {selectedView === 'overview' && (
              <div className="overview-section">
                <div className="charts-row">
                  <div className="chart-card">
                    <div className="chart-header">
                      <h3 className="chart-title">Resource Status Distribution</h3>
                      <p className="chart-subtitle">Current operational status</p>
                    </div>
                    <div className="chart-container">
                      <ResponsiveContainer width="100%" height={300}>
                        <RePieChart>
                          <Pie
                            data={statusDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="count"
                            nameKey="status"
                            label={renderPieLabel}
                            labelLine={false}
                          >
                            {statusDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend 
                            verticalAlign="bottom" 
                            height={36}
                            formatter={(value, entry) => {
                              return <span style={{ color: '#374151' }}>{value}</span>;
                            }}
                          />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Resource Type Summary Table */}
                <div className="chart-card full-width">
                  <div className="chart-header">
                    <h3 className="chart-title">Resource Type Breakdown</h3>
                    <p className="chart-subtitle">Complete inventory by category</p>
                  </div>
                  <div className="table-responsive">
                    <table className="resource-table">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Total</th>
                          <th>Active</th>
                          <th>Maintenance</th>
                          <th>Out of Service</th>
                          <th>Available</th>
                          <th>Utilization</th>
                        </tr>
                      </thead>
                      <tbody>
                        {typeStats.map((stat) => {
                          const utilization = stat.active > 0 ? (stat.available / stat.active * 100).toFixed(0) : '0';
                          const utilizationNum = parseInt(utilization);
                          return (
                            <tr key={stat.type}>
                              <td className="type-cell">
                                <span className="type-icon">{getTypeIcon(stat.type)}</span>
                                <span className="type-name">{formatTypeLabel(stat.type)}</span>
                              </td>
                              <td className="stat-number">{stat.count}</td>
                              <td className="stat-number success">{stat.active}</td>
                              <td className="stat-number warning">{stat.maintenance}</td>
                              <td className="stat-number danger">{stat.outOfService}</td>
                              <td className="stat-number info">{stat.available}</td>
                              <td>
                                <div className="progress-bar">
                                  <div 
                                    className="progress-fill" 
                                    style={{ 
                                      width: `${utilization}%`, 
                                      backgroundColor: getUtilizationColor(utilizationNum)
                                    }}
                                  />
                                  <span 
                                    className="progress-text"
                                    style={{
                                      color: utilizationNum === 0 ? '#ef4444' : 'white',
                                      textShadow: utilizationNum === 0 ? 'none' : '0 0 2px rgba(0,0,0,0.2)'
                                    }}
                                  >
                                    {utilization}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Resource Types View */}
            {selectedView === 'types' && (
              <div className="types-section">
                <div className="charts-row">
                  <div className="chart-card">
                    <div className="chart-header">
                      <h3 className="chart-title">Resource Type Distribution</h3>
                      <p className="chart-subtitle">Breakdown by category</p>
                    </div>
                    <div className="chart-container">
                      <ResponsiveContainer width="100%" height={350}>
                        <RePieChart>
                          <Pie
                            data={typePieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={120}
                            paddingAngle={2}
                            dataKey="value"
                            nameKey="name"
                            label={renderPieLabel}
                            labelLine={true}
                          >
                            {typePieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={BLUE_THEME_COLORS[index % BLUE_THEME_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Type Details Cards */}
                <div className="types-grid">
                  {typeStats.map((stat, index) => (
                    <div key={stat.type} className="type-detail-card" style={{ borderTopColor: BLUE_THEME_COLORS[index % BLUE_THEME_COLORS.length] }}>
                      <div className="type-detail-header">
                        <div className="type-detail-icon" style={{ backgroundColor: `${BLUE_THEME_COLORS[index % BLUE_THEME_COLORS.length]}15`, color: BLUE_THEME_COLORS[index % BLUE_THEME_COLORS.length] }}>
                          {getTypeIcon(stat.type)}
                        </div>
                        <div>
                          <h4 className="type-detail-name">{formatTypeLabel(stat.type)}</h4>
                          <p className="type-detail-count">{stat.count} {stat.count === 1 ? 'resource' : 'resources'}</p>
                        </div>
                      </div>
                      <div className="type-detail-stats">
                        <div className="stat-item">
                          <span className="stat-label">Active</span>
                          <span className="stat-value success">{stat.active}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Available</span>
                          <span className="stat-value info">{stat.available}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Maintenance</span>
                          <span className="stat-value warning">{stat.maintenance}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Out of Service</span>
                          <span className="stat-value danger">{stat.outOfService}</span>
                        </div>
                      </div>
                      {stat.type !== 'EQUIPMENT' && (
                        <div className="type-detail-footer">
                          <span>Avg Capacity: <strong>{stat.avgCapacity.toLocaleString()}</strong></span>
                          <span>Total Cap: <strong>{stat.totalCapacity.toLocaleString()}</strong></span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="dashboard-footer">
        <div className="footer-left">
          <p className="footer-copy">© 2026 Northbridge University. All Rights Reserved.</p>
        </div>
        <div className="footer-links">
          <a href="#" className="footer-link">Institutional Guidelines</a>
          <a href="#" className="footer-link">Privacy Policy</a>
          <a href="#" className="footer-link">Technical Support</a>
        </div>
      </footer>
    </div>
  );
};

export default Analysis;