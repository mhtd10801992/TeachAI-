import React, { useState, useEffect } from 'react';
import API from '../api/api.js';

const SystemStatus = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatus();
    // Refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await API.get('/ai/status');
      setStatus(response.data.status);
      setError(null);
    } catch (err) {
      setError('Failed to fetch system status');
      console.error('Status fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return '#10b981'; // green
      case 'failed': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running': return '✅';
      case 'failed': return '❌';
      default: return '⏳';
    }
  };

  if (loading && !status) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        margin: '20px 0'
      }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          🔄 Loading system status...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#fef2f2',
        borderRadius: '8px',
        border: '1px solid #fecaca',
        margin: '20px 0'
      }}>
        <div style={{ color: '#dc2626' }}>
          ❌ {error}
          <button
            onClick={fetchStatus}
            style={{
              marginLeft: '10px',
              padding: '4px 8px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      margin: '20px 0'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: 0, color: '#1e293b' }}>🔧 System Status Dashboard</h3>
        <div style={{ fontSize: '12px', color: '#64748b' }}>
          Last updated: {status?.timestamp ? new Date(status.timestamp).toLocaleTimeString() : 'Never'}
          <button
            onClick={fetchStatus}
            style={{
              marginLeft: '10px',
              padding: '4px 8px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Services Status */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>🔗 Core Services</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
          {status?.services && Object.entries(status.services).map(([service, info]) => (
            <div key={service} style={{
              padding: '12px',
              backgroundColor: 'white',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '18px' }}>{getStatusIcon(info.status)}</span>
              <div>
                <div style={{
                  fontWeight: 'bold',
                  color: '#111827',
                  textTransform: 'capitalize'
                }}>
                  {service.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: getStatusColor(info.status)
                }}>
                  {info.message}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activities Status */}
      <div>
        <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>⚙️ System Activities</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
          {status?.activities?.map((activity, index) => (
            <div key={index} style={{
              padding: '12px',
              backgroundColor: 'white',
              borderRadius: '6px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px'
              }}>
                <span style={{ fontSize: '16px' }}>{getStatusIcon(activity.status)}</span>
                <span style={{
                  fontWeight: 'bold',
                  color: '#111827'
                }}>
                  {activity.name}
                </span>
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                marginLeft: '24px'
              }}>
                {activity.message}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overall Status Summary */}
      <div style={{
        marginTop: '20px',
        padding: '12px',
        backgroundColor: '#f0f9ff',
        borderRadius: '6px',
        border: '1px solid #bae6fd'
      }}>
        <div style={{ fontWeight: 'bold', color: '#0369a1', marginBottom: '4px' }}>
          📊 System Health Summary
        </div>
        <div style={{ fontSize: '14px', color: '#0369a1' }}>
          {(() => {
            const services = status?.services || {};
            const totalServices = Object.keys(services).length;
            const runningServices = Object.values(services).filter(s => s.status === 'running').length;
            const activities = status?.activities || [];
            const runningActivities = activities.filter(a => a.status === 'running').length;

            return `${runningServices}/${totalServices} services running • ${runningActivities}/${activities.length} activities operational`;
          })()}
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;