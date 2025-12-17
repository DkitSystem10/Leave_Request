import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../utils/dataService';
import RequestForm from './RequestForm';
import RequestList from './RequestList';
import MonthlyAttendanceReport from './MonthlyAttendanceReport';
import LeaveCalendar from './LeaveCalendar';
import './EmployeeDashboard.css';

function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const [activeMenu, setActiveMenu] = useState('request-form');
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    if (user?.id) {
      loadRequests();
      checkForNewNotifications();
      // Check for notifications every 5 seconds
      const interval = setInterval(() => {
        checkForNewNotifications();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadRequests = async () => {
    const userRequests = await dataService.getRequestsByEmployee(user.id);

    // Ensure userRequests is an array
    const requestsArray = Array.isArray(userRequests) ? userRequests : [];

    setRequests(requestsArray);

    setStats({
      total: requestsArray.length,
      pending: requestsArray.filter(r => r.status === 'pending').length,
      approved: requestsArray.filter(r => r.status === 'approved').length,
      rejected: requestsArray.filter(r => r.status === 'rejected').length
    });
  };

  const checkForNewNotifications = () => {
    const userNotifications = dataService.getNotifications(user.id);
    setNotifications(userNotifications);
  };

  const handleRequestSubmitted = () => {
    loadRequests();
    setActiveMenu('leave-request');
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.read).length;
  };

  const markAsRead = () => {
    notifications.forEach(n => {
      if (!n.read) {
        dataService.markNotificationAsRead(user.id, n.id);
      }
    });
    checkForNewNotifications();
    setShowNotifications(false);
  };

  const unreadCount = getUnreadCount();

  return (
    <div className="dashboard">
      <div className="dashboard-header-new">
        <div className="header-left">
          <h1 className="dashboard-title">Welcome, {user.name}</h1>
          <p className="dashboard-subtitle">Employee Dashboard</p>
        </div>
        <div className="header-right">
          <div className="notification-container">
            <button
              className="notification-btn"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <span className="notification-icon">🔔</span>
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>
            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <h3>Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAsRead} className="mark-read-btn">Mark all as read</button>
                  )}
                </div>
                <div className="notification-list">
                  {notifications.length === 0 ? (
                    <div className="no-notifications">No notifications</div>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} className={`notification-item ${notif.read ? 'read' : 'unread'}`}>
                        <div className="notification-message">{notif.message}</div>
                        <div className="notification-time">
                          {new Date(notif.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="stats-cards" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        padding: '0 20px',
        marginBottom: '20px'
      }}>
        {/* Total Requests */}
        <div className="stat-card" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)',
          transition: 'transform 0.2s',
          cursor: 'pointer'
        }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', opacity: 0.9, fontWeight: 600 }}>Total Requests</h3>
            <span style={{ fontSize: '24px' }}>📊</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold' }}>
            {requests.length}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '8px' }}>All time</div>
        </div>

        {/* Leave Requests */}
        <div className="stat-card" style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 8px 16px rgba(245, 87, 108, 0.3)',
          transition: 'transform 0.2s',
          cursor: 'pointer'
        }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', opacity: 0.9, fontWeight: 600 }}>Leave Requests</h3>
            <span style={{ fontSize: '24px' }}>🏖️</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold' }}>
            {requests.filter(r => r.type === 'leave' || r.type === 'halfday').length}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '8px' }}>
            Full & Half day
          </div>
        </div>

        {/* Permission Requests */}
        <div className="stat-card" style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          color: 'white',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 8px 16px rgba(79, 172, 254, 0.3)',
          transition: 'transform 0.2s',
          cursor: 'pointer'
        }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', opacity: 0.9, fontWeight: 600 }}>Permission Requests</h3>
            <span style={{ fontSize: '24px' }}>⏰</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold' }}>
            {requests.filter(r => r.type === 'permission').length}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '8px' }}>Time-based</div>
        </div>

        {/* Pending */}
        <div className="stat-card" style={{
          background: 'linear-gradient(135deg, #ffc837 0%, #ff8008 100%)',
          color: 'white',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 8px 16px rgba(255, 200, 55, 0.3)',
          transition: 'transform 0.2s',
          cursor: 'pointer'
        }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', opacity: 0.9, fontWeight: 600 }}>Pending Approval</h3>
            <span style={{ fontSize: '24px' }}>⏳</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold' }}>
            {requests.filter(r => r.status === 'pending').length}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '8px' }}>Awaiting review</div>
        </div>

        {/* Approved */}
        <div className="stat-card" style={{
          background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
          color: 'white',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 8px 16px rgba(56, 239, 125, 0.3)',
          transition: 'transform 0.2s',
          cursor: 'pointer'
        }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', opacity: 0.9, fontWeight: 600 }}>Approved</h3>
            <span style={{ fontSize: '24px' }}>✅</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold' }}>
            {requests.filter(r => r.status === 'approved').length}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '8px' }}>All approvals</div>
        </div>

        {/* Rejected */}
        <div className="stat-card" style={{
          background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
          color: 'white',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 8px 16px rgba(235, 51, 73, 0.3)',
          transition: 'transform 0.2s',
          cursor: 'pointer'
        }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', opacity: 0.9, fontWeight: 600 }}>Rejected</h3>
            <span style={{ fontSize: '24px' }}>❌</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold' }}>
            {requests.filter(r => r.status === 'rejected').length}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '8px' }}>Not approved</div>
        </div>
      </div>

      <div className="dashboard-menu">
        <button
          className={`menu-item ${activeMenu === 'leave-request' ? 'active' : ''}`}
          onClick={() => setActiveMenu('leave-request')}
        >
          Leave Request
        </button>
        <button
          className={`menu-item ${activeMenu === 'permission-request' ? 'active' : ''}`}
          onClick={() => setActiveMenu('permission-request')}
        >
          Permission Request
        </button>
        <button
          className={`menu-item ${activeMenu === 'attendance-report' ? 'active' : ''}`}
          onClick={() => setActiveMenu('attendance-report')}
        >
          Monthly Attendance Report
        </button>
        <button
          className={`menu-item ${activeMenu === 'leave-calendar' ? 'active' : ''}`}
          onClick={() => setActiveMenu('leave-calendar')}
        >
          This Month Leave Calendar
        </button>
      </div>

      <div className="dashboard-content">
        {activeMenu === 'leave-request' && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Leave Request</h2>
            </div>
            <RequestForm user={user} onRequestSubmitted={handleRequestSubmitted} requestType="leave" />
            <div style={{ marginTop: '32px' }}>
              <h3 style={{ marginBottom: '16px' }}>My Leave Requests</h3>
              <RequestList
                requests={requests.filter(r => r.type === 'leave')}
                userRole="employee"
              />
            </div>
          </div>
        )}

        {activeMenu === 'permission-request' && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Permission Request</h2>
            </div>
            <RequestForm user={user} onRequestSubmitted={handleRequestSubmitted} requestType="permission" />
            <div style={{ marginTop: '32px' }}>
              <h3 style={{ marginBottom: '16px' }}>My Permission Requests</h3>
              <RequestList
                requests={requests.filter(r => r.type === 'permission')}
                userRole="employee"
              />
            </div>
          </div>
        )}

        {activeMenu === 'attendance-report' && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Monthly Attendance Report</h2>
            </div>
            <MonthlyAttendanceReport user={user} />
          </div>
        )}

        {activeMenu === 'leave-calendar' && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">This Month Leave Calendar</h2>
            </div>
            <LeaveCalendar user={user} />
          </div>
        )}

        {activeMenu === 'summary' && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Monthly Leave & Permission Summary</h2>
            </div>
            <MonthlyAttendanceReport user={user} />
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeDashboard;
