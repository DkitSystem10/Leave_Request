import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../utils/dataService';
import RequestList from './RequestList';
import Reports from './Reports';
import RequestForm from './RequestForm';
import LeaveCalendar from './LeaveCalendar';
import './ManagerDashboard.css';

const SidebarItem = ({ active, icon, label, onClick, color }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const theme = {
    blue: { bg: '#eff6ff', text: '#2563eb', iconBg: '#3b82f6' },
    purple: { bg: '#f5f3ff', text: '#7c3aed', iconBg: '#8b5cf6' }
  }[color] || { bg: '#eff6ff', text: '#2563eb', iconBg: '#3b82f6' };

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => { setIsPressed(false); setIsHovered(false); }}
      onMouseEnter={() => setIsHovered(true)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        padding: '12px 16px',
        border: 'none',
        background: active ? theme.bg : (isHovered ? theme.bg : 'transparent'),
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.1s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isPressed ? 'scale(0.95)' : (isHovered ? 'scale(1.02)' : 'scale(1)'),
        color: theme.text,
        fontWeight: active ? '700' : '600',
        fontSize: '15px'
      }}
    >
      <div style={{
        width: '32px', height: '32px', borderRadius: '8px',
        background: theme.iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
        boxShadow: active ? `0 4px 12px ${theme.iconBg}40` : 'none'
      }}>
        {React.cloneElement(icon, { stroke: 'white' })}
      </div>
      {label}
    </button>
  );
};

function ManagerDashboard() {
  const { user, logout } = useAuth();
  const [view, setView] = useState('welcome');
  const [activeTab, setActiveTab] = useState('all-requests');
  const [requests, setRequests] = useState([]); // Pending requests for manager
  const [allRequestsList, setAllRequestsList] = useState([]); // All requests for Total view
  const [myRequests, setMyRequests] = useState([]); // Manager's own requests
  const [newApprovedCount, setNewApprovedCount] = useState(0);
  const [newPendingCount, setNewPendingCount] = useState(0);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });
  const [holidayAnnouncement, setHolidayAnnouncement] = useState(null);
  
  // Today's Report State
  const [todayStats, setTodayStats] = useState({
    totalEmployees: 0,
    present: 0,
    onLeave: 0,
    absent: 0,
    onPermission: 0
  });
  const [departmentStats, setDepartmentStats] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [departmentEmployees, setDepartmentEmployees] = useState({
    present: [],
    absent: [],
    onLeave: [],
    onPermission: []
  });
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    loadRequests();
    checkAnnouncements();
    fetchTodayReport(); // Load today's report data on dashboard load
  }, []);

  useEffect(() => {
    if (view === 'welcome' || view === 'today-report' || activeTab === 'today-report') {
      fetchTodayReport();
    }
  }, [view, activeTab]);

  const fetchTodayReport = async () => {
    try {
      setReportLoading(true);
      
      console.log('=== DEBUG: Fetching Today Report ===');
      
      // 1. Check if dataService is working
      console.log('DataService available:', typeof dataService);
      
      // 2. Force fetch from database
      console.log('Step 1: Fetching employees from DB...');
      await dataService.fetchAllEmployeesFromDB();
      const allEmployees = dataService.getAllEmployees();
      console.log('Step 1 Result - Employees:', allEmployees);
      console.log('Step 1 Result - Employee count:', allEmployees?.length || 0);
      
      if (!allEmployees || allEmployees.length === 0) {
        console.error('No employees found in database!');
        setTodayStats({
          totalEmployees: 0,
          present: 0,
          onLeave: 0,
          absent: 0,
          onPermission: 0
        });
        return;
      }
      
      // 3. Get all requests
      console.log('Step 2: Fetching requests from DB...');
      const allRequests = await dataService.getAllRequests();
      console.log('Step 2 Result - Requests:', allRequests);
      console.log('Step 2 Result - Request count:', allRequests?.length || 0);
      
      // 4. Check today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      console.log('Step 3 - Today date:', todayStr);
      
      // 5. Filter employees (exclude managers) - FIXED LOGIC WITH ROLE-BASED FILTERING
      const employeeList = (allEmployees || []).filter(emp => {
        const isActive = emp.status === 'Active' || emp.status === 'active';
        const isNotInactive = emp.status !== 'inactive' && emp.status !== 'Inactive';
        
        // Role-based filtering logic:
        // - Interns should appear in department selection
        // - DI should appear in Technology selection  
        // - Marketing team should appear in DM selection
        // - Associates should appear in MGR selection
        // - HR should appear in HR department
        const shouldInclude = 
          (emp.role === 'intern' || emp.role === 'Intern') || // Interns in departments
          (emp.role === 'di' || emp.role === 'DI') || // DI in Technology
          (emp.role === 'dm' || emp.role === 'DM') || // Marketing team in DM
          (emp.role === 'associate' || emp.role === 'Associate') || // Associates in MGR
          (emp.role === 'hr' || emp.role === 'HR') || // HR in HR department
          (emp.role === 'employee' || emp.role === 'Employee'); // Regular employees
        
        return isActive && isNotInactive && shouldInclude;
      });
      console.log('Step 4 - Filtered employees:', employeeList.length);
      console.log('Employee roles found:', employeeList.map(e => ({name: e.name, role: e.role, department: e.department})));
      
      if (employeeList.length === 0) {
        console.warn('No active employees found after filtering!');
        console.log('All employees:', (allEmployees || []).map(e => ({id: e.id, name: e.name, status: e.status, role: e.role})));
      }
      
      // 6. Filter today's requests - SIMPLIFIED LOGIC
      const todayRequests = (allRequests || []).filter(req => {
        if (req.status !== 'approved') return false;
        
        // Try multiple date field formats
        const requestDate = req.startDate || req.start_date || req.fromDate || req.date;
        if (!requestDate) return false;
        
        // Check if request date is today
        const reqDate = new Date(requestDate);
        reqDate.setHours(0, 0, 0, 0);
        
        return reqDate.getTime() === today.getTime();
      });
      console.log('Step 5 - Today requests:', todayRequests.length);
      console.log('Today request details:', todayRequests.map(r => ({
        id: r.id,
        employeeId: r.employeeId || r.employee_id,
        type: r.type,
        date: r.startDate || r.start_date || r.fromDate
      })));
      
      // 7. Calculate counts - SIMPLIFIED
      let presentCount = 0;
      let onLeaveCount = 0;
      let permissionCount = 0;
      
      const employeeStatusList = employeeList.map(emp => {
        console.log('Processing employee:', emp.name, 'ID:', emp.id);
        
        const empRequest = todayRequests.find(req => {
          const matches = (req.employeeId || req.employee_id) === emp.id;
          if (matches) {
            console.log('Found request for', emp.name, ':', req.type);
          }
          return matches;
        });

        let status = 'present';
        if (empRequest) {
          if (empRequest.type === 'leave' || empRequest.type === 'halfday') {
            status = 'leave';
            onLeaveCount++;
            console.log('Employee ON LEAVE:', emp.name);
          } else if (empRequest.type === 'permission') {
            status = 'permission';
            permissionCount++;
            console.log('Employee ON PERMISSION:', emp.name);
          }
        } else {
          presentCount++;
          console.log('Employee PRESENT:', emp.name);
        }

        return {
          ...emp,
          todayStatus: status,
          request: empRequest,
          leaveType: empRequest?.type,
          leaveReason: empRequest?.reason,
          permissionReason: empRequest?.reason
        };
      });
      
      const overallStats = {
        totalEmployees: employeeList.length,
        present: presentCount,
        onLeave: onLeaveCount,
        absent: 0, // Will be 0 for now
        onPermission: permissionCount
      };
      
      console.log('Step 6 - Final stats:', overallStats);
      setTodayStats(overallStats);
      
      // 7. Calculate department-wise statistics using same logic
      const departments = [...new Set(employeeList.map(emp => emp.department).filter(Boolean))];
      const deptStats = departments.map(dept => {
        const deptEmployees = employeeList.filter(emp => emp.department === dept);
        
        const deptPresent = deptEmployees.filter(emp => emp.todayStatus === 'present');
        const deptOnLeave = deptEmployees.filter(emp => emp.todayStatus === 'leave');
        const deptOnPermission = deptEmployees.filter(emp => emp.todayStatus === 'permission');
        const deptAbsent = deptEmployees.filter(emp => emp.todayStatus === 'absent');
        
        return {
          department: dept,
          total: deptEmployees.length,
          present: deptPresent.length,
          onLeave: deptOnLeave.length,
          absent: deptAbsent.length,
          onPermission: deptOnPermission.length,
          presentEmployees: deptPresent,
          absentEmployees: deptAbsent,
          leaveEmployees: deptOnLeave,
          permissionEmployees: deptOnPermission
        };
      });
      
      setDepartmentStats(deptStats);
      
      // 8. Set department employees for display
      setDepartmentEmployees({
        present: employeeStatusList.filter(e => e.todayStatus === 'present'),
        absent: employeeStatusList.filter(e => e.todayStatus === 'absent'),
        onLeave: employeeStatusList.filter(e => e.todayStatus === 'leave'),
        onPermission: employeeStatusList.filter(e => e.todayStatus === 'permission')
      });
    } catch (error) {
      console.error('Error fetching today report:', error);
    } finally {
      setReportLoading(false);
    }
  };

  const handleDepartmentClick = (dept) => {
    setSelectedDepartment(dept);
    const deptData = departmentStats.find(d => d.department === dept);
    if (deptData) {
      setDepartmentEmployees({
        present: deptData.presentEmployees,
        absent: deptData.absentEmployees,
        onLeave: deptData.leaveEmployees,
        onPermission: deptData.permissionEmployees
      });
    }
  };

  const loadRequests = async () => {
    // 1. Requests pending for manager's approval
    const managerRequests = await dataService.getRequestsByManager(user.id);
    setRequests(managerRequests);

    // 2. Manager's OWN requests (to check for approvals from HR)
    const ownRequests = await dataService.getRequestsByEmployee(user.id);
    const requestsArray = Array.isArray(ownRequests) ? ownRequests : [];
    setMyRequests(requestsArray);

    // 3. Fetch all requests for Total Requests view and stats
    const allRequests = await dataService.getAllRequests();
    const now = new Date();
    const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    const todaysRequests = allRequests.filter(r => {
      const rDate = r.created_at || r.requested_at || r.startDate;
      return rDate && rDate.includes(todayStr);
    });
    setAllRequestsList(todaysRequests);

    // Calculate new pending requests (Team requests to approve)
    const lastViewedTime = localStorage.getItem(`lastViewedPending_${user.id}`);

    if (lastViewedTime) {
      const newPending = managerRequests.filter(r => {
        const requestTime = r.created_at || r.startDate;
        return requestTime && new Date(requestTime) > new Date(lastViewedTime);
      });
      setNewPendingCount(newPending.length);
    } else {
      setNewPendingCount(managerRequests.length);
    }

    // Calculate new approved requests (Manager's own requests approved by HR)
    const lastViewedApproved = localStorage.getItem(`lastViewedApproved_${user.id}`);
    const approvedRequests = requestsArray.filter(r => r.status === 'approved');

    if (lastViewedApproved) {
      const newApprovals = approvedRequests.filter(r => {
        // Check any approval timestamp
        const approvalTime = r.managerApproval?.approved_at || r.hrApproval?.approved_at || r.superAdminApproval?.approved_at;
        return approvalTime && new Date(approvalTime) > new Date(lastViewedApproved);
      });
      setNewApprovedCount(newApprovals.length);
    } else {
      setNewApprovedCount(approvedRequests.length);
    }

    setStats({
      pending: managerRequests.length,
      approved: allRequests.filter(r => r.status === 'approved').length,
      rejected: allRequests.filter(r => r.status === 'rejected').length,
      total: todaysRequests.length
    });
  };

  const handlePendingClick = () => {
    // Mark both as viewed
    const now = new Date().toISOString();
    localStorage.setItem(`lastViewedPending_${user.id}`, now);
    localStorage.setItem(`lastViewedApproved_${user.id}`, now);
    setNewPendingCount(0);
    setNewApprovedCount(0);
    setActiveTab('approve-requests');
  };

  const handleAction = async (requestId, action, reason) => {
    if (action === 'approve') {
      await dataService.approveRequest(requestId, 'manager', user.id);
    } else if (action === 'reject') {
      const finalReason = (reason && reason.trim()) || prompt('Please provide a reason for rejection:');
      if (finalReason) {
        await dataService.rejectRequest(requestId, 'manager', user.id, finalReason.trim());
      }
    }
    await loadRequests();
  };

  const handleApplyLeaveClick = () => {
    setActiveTab('apply-leave');
  };

  const handleRequestSubmitted = () => {
    setActiveTab('all-requests'); // Or back to apply-leave? User flow usually implies going back to list or staying.
    loadRequests();
  };

  const checkAnnouncements = async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const announcement = await dataService.getAnnouncementForDate(tomorrowStr);
    if (announcement) {
      setHolidayAnnouncement(announcement);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
      {/* SIDEBAR */}
      <div style={{
        width: '280px',
        background: 'white',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 50,
        boxShadow: '4px 0 24px rgba(0,0,0,0.02)'
      }}>
        {/* LOGO */}
        <div style={{ padding: '32px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.5px' }}>
            <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
            </div>
            <span style={{ background: 'linear-gradient(90deg, #1e293b, #334155)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Leave Hub</span>
          </h2>
        </div>

        <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SidebarItem
            active={view === 'welcome'}
            label="Home"
            onClick={() => setView('welcome')}
            color="blue"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>}
          />
          <SidebarItem
            active={view === 'leave-management'}
            label="Leave Management"
            onClick={() => setView('leave-management')}
            color="purple"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>}
          />
        </div>

        {/* USER PROFILE BOTTOM */}
        <div style={{ marginTop: 'auto', padding: '24px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold', color: '#64748b' }}>
              {user.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{user.name}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>{user.role === 'manager' ? 'Manager' : user.role}</div>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #e2e8f0',
              background: 'white',
              borderRadius: '8px',
              color: '#64748b',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fee2e2'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Sign Out
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, marginLeft: '280px', display: 'flex', flexDirection: 'column', minHeight: '100vh', width: 'calc(100% - 280px)' }}>

        {view === 'welcome' ? (
          // WELCOME SCREEN
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'white', padding: '40px' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '24px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '32px',
              boxShadow: '0 20px 40px -10px rgba(124, 58, 237, 0.4)'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
            </div>
            <h1 style={{ fontSize: '42px', fontWeight: '800', color: '#1e293b', marginBottom: '16px', textAlign: 'center', letterSpacing: '-1px' }}>
              Welcome back, {user.name.split(' ')[0]}!
            </h1>
            
            {/* TODAY'S STATUS SECTION ON HOME PAGE */}
            <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div>
                    <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>Today's Status</h2>
                    <p style={{ fontSize: '14px', color: '#64748b' }}>Employee attendance and leave status for {new Date().toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={fetchTodayReport}
                    disabled={reportLoading}
                    style={{
                      padding: '8px 16px',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: reportLoading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: reportLoading ? 0.6 : 1
                    }}
                  >
                    {reportLoading ? 'Loading...' : 'Refresh'}
                  </button>
                </div>

                {/* Overall Status Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ background: 'white', borderRadius: '14px', padding: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Present</div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669' }}>{todayStats.present}</div>
                  </div>

                  <div style={{ background: 'white', borderRadius: '14px', padding: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11H3v10h6V11z"></path><path d="M21 11h-6v10h6V11z"></path></svg>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>On Leave</div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#d97706' }}>{todayStats.onLeave}</div>
                  </div>

                  <div style={{ background: 'white', borderRadius: '14px', padding: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Absent</div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#dc2626' }}>{todayStats.absent}</div>
                  </div>

                  <div style={{ background: 'white', borderRadius: '14px', padding: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>On Permission</div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#2563eb' }}>{todayStats.onPermission}</div>
                  </div>
                </div>

                {/* Department-wise Statistics */}
                <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Department-wise Status</h3>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '13px', borderBottom: '1px solid #e5e7eb' }}>Department</th>
                          <th style={{ padding: '10px', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '13px', borderBottom: '1px solid #e5e7eb' }}>Total</th>
                          <th style={{ padding: '10px', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '13px', borderBottom: '1px solid #e5e7eb' }}>Present</th>
                          <th style={{ padding: '10px', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '13px', borderBottom: '1px solid #e5e7eb' }}>On Leave</th>
                          <th style={{ padding: '10px', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '13px', borderBottom: '1px solid #e5e7eb' }}>Absent</th>
                          <th style={{ padding: '10px', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '13px', borderBottom: '1px solid #e5e7eb' }}>On Permission</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departmentStats.map((dept, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '10px', fontWeight: '600', color: '#1e293b', fontSize: '13px' }}>{dept.department}</td>
                            <td style={{ padding: '10px', textAlign: 'center', fontSize: '13px' }}>{dept.total}</td>
                            <td style={{ padding: '10px', textAlign: 'center', color: '#059669', fontWeight: '600', fontSize: '13px' }}>{dept.present}</td>
                            <td style={{ padding: '10px', textAlign: 'center', color: '#d97706', fontWeight: '600', fontSize: '13px' }}>{dept.onLeave}</td>
                            <td style={{ padding: '10px', textAlign: 'center', color: '#dc2626', fontWeight: '600', fontSize: '13px' }}>{dept.absent}</td>
                            <td style={{ padding: '10px', textAlign: 'center', color: '#2563eb', fontWeight: '600', fontSize: '13px' }}>{dept.onPermission}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Employee Details Section */}
                <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  {/* Present Employees */}
                  <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', background: '#f0fdf4' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#059669' }}>
                        Present Employees ({departmentEmployees.present.length})
                      </h3>
                    </div>
                    <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                      {departmentEmployees.present.length > 0 ? (
                        departmentEmployees.present.map((emp, index) => (
                          <div key={index} style={{ padding: '12px 16px', borderBottom: '1px solid #f9fafb', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: '#059669' }}>
                              {emp.name ? emp.name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{emp.name || 'Unknown'}</div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>{emp.email || 'No email'}</div>
                              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{emp.department || 'No department'}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                          No present employees today
                        </div>
                      )}
                    </div>
                  </div>

                  {/* On Leave Employees */}
                  <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', background: '#fffbeb' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#d97706' }}>
                        On Leave ({departmentEmployees.onLeave.length})
                      </h3>
                    </div>
                    <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                      {departmentEmployees.onLeave.length > 0 ? (
                        departmentEmployees.onLeave.map((emp, index) => (
                          <div key={index} style={{ padding: '12px 16px', borderBottom: '1px solid #f9fafb' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: '#d97706' }}>
                                {emp.name ? emp.name.charAt(0).toUpperCase() : '?'}
                              </div>
                              <div>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{emp.name || 'Unknown'}</div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>{emp.email || 'No email'}</div>
                              </div>
                            </div>
                            <div style={{ marginLeft: '44px' }}>
                              <span style={{ padding: '4px 8px', background: '#fef3c7', color: '#92400e', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                                {emp.leaveType || emp.type || 'Leave'}
                              </span>
                              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{emp.leaveReason || emp.reason || 'No reason provided'}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                          No employees on leave today
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Absent Employees */}
                  <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', background: '#fef2f2' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#dc2626' }}>
                        Absent ({departmentEmployees.absent.length})
                      </h3>
                    </div>
                    <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                      {departmentEmployees.absent.length > 0 ? (
                        departmentEmployees.absent.map((emp, index) => (
                          <div key={index} style={{ padding: '12px 16px', borderBottom: '1px solid #f9fafb', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: '#dc2626' }}>
                              {emp.name ? emp.name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{emp.name || 'Unknown'}</div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>{emp.email || 'No email'}</div>
                              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{emp.department || 'No department'}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                          No absent employees today
                        </div>
                      )}
                    </div>
                  </div>

                  {/* On Permission Employees */}
                  <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', background: '#eff6ff' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#2563eb' }}>
                        On Permission ({departmentEmployees.onPermission.length})
                      </h3>
                    </div>
                    <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                      {departmentEmployees.onPermission.length > 0 ? (
                        departmentEmployees.onPermission.map((emp, index) => (
                          <div key={index} style={{ padding: '12px 16px', borderBottom: '1px solid #f9fafb' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: '#2563eb' }}>
                                {emp.name ? emp.name.charAt(0).toUpperCase() : '?'}
                              </div>
                              <div>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{emp.name || 'Unknown'}</div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>{emp.email || 'No email'}</div>
                              </div>
                            </div>
                            <div style={{ marginLeft: '44px' }}>
                              <span style={{ padding: '4px 8px', background: '#dbeafe', color: '#1e40af', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                                Permission
                              </span>
                              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{emp.permissionReason || emp.reason || 'No reason provided'}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                          No employees on permission today
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setView('leave-management')}
              style={{
                padding: '16px 40px',
                background: '#0f172a',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 20px 40px -12px rgba(15, 23, 42, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(15, 23, 42, 0.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 20px 40px -12px rgba(15, 23, 42, 0.3)'; }}
            >
              Go to Dashboard
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
          </div>
        ) : (
          // DASHBOARD CONTENT
          <div style={{ padding: '40px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
            {/* HEADER */}
            <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', letterSpacing: '-1px', marginBottom: '8px' }}>Leave Management</h1>
                <p style={{ fontSize: '16px', color: '#64748b' }}>Manage your team's leaves and your own requests.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ padding: '10px 16px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', fontWeight: '500', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                  Manager Access
                </div>
              </div>
            </div>

            {/* HOLIDAY ANNOUNCEMENT */}
            {holidayAnnouncement && (
              <div style={{
                marginBottom: '32px',
                padding: '24px',
                background: 'linear-gradient(135deg, #FF512F 0%, #DD2476 100%)',
                borderRadius: '20px',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                boxShadow: '0 10px 30px -5px rgba(221, 36, 118, 0.4)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span>✨</span> Tomorrow is Holiday! <span>✨</span>
                </h2>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: '500', opacity: 0.9 }}>
                  {holidayAnnouncement.message}
                </p>
              </div>
            )}

            {/* 4 STATS CARDS IN A ROW */}
            <div className="stats-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>

              {/* Card 1: Today Leave Requests */}
              <div
                onClick={async () => {
                  setActiveTab('all-requests');
                  await loadRequests();
                }}
                style={{
                  background: 'white', borderRadius: '20px', padding: '24px', cursor: 'pointer',
                  boxShadow: activeTab === 'all-requests' ? '0 10px 25px -5px rgba(99, 102, 241, 0.15)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  border: activeTab === 'all-requests' ? '2px solid #8b5cf6' : '1px solid #e2e8f0',
                  transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center'
                }}
              >
                <div style={{
                  width: '56px', height: '56px', borderRadius: '16px',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '16px',
                  boxShadow: '0 8px 16px -4px rgba(6, 182, 212, 0.3)'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>Today Leave Requests</div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b' }}>{stats.total}</div>
              </div>

              {/* Card 2: Apply Leave */}
              <div
                onClick={handleApplyLeaveClick}
                style={{
                  background: 'white', borderRadius: '20px', padding: '24px', cursor: 'pointer',
                  boxShadow: activeTab === 'apply-leave' ? '0 10px 25px -5px rgba(245, 158, 11, 0.15)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  border: activeTab === 'apply-leave' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                  transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <div style={{
                  width: '56px', height: '56px', borderRadius: '16px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
                  boxShadow: '0 8px 16px -4px rgba(245, 158, 11, 0.3)'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>Apply Leave</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#94a3b8' }}>Create Request</div>
              </div>

              {/* Card 3: Approve Requests */}
              <div
                onClick={handlePendingClick}
                style={{
                  background: 'white', borderRadius: '20px', padding: '24px', cursor: 'pointer',
                  boxShadow: activeTab === 'approve-requests' ? '0 10px 25px -5px rgba(139, 92, 246, 0.15)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  border: activeTab === 'approve-requests' ? '2px solid #8b5cf6' : '1px solid #e2e8f0',
                  transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  position: 'relative'
                }}
              >
                {/* Badge 1: New Pending */}
                {newPendingCount > 0 && (
                  <div style={{ position: 'absolute', top: '16px', right: '16px', background: '#ef4444', color: 'white', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    {newPendingCount}
                  </div>
                )}
                {/* Badge 2: New Approved */}
                {newApprovedCount > 0 && (
                  <div style={{ position: 'absolute', top: '16px', right: newPendingCount > 0 ? '48px' : '16px', background: '#10b981', color: 'white', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    ✓
                  </div>
                )}

                <div style={{
                  width: '56px', height: '56px', borderRadius: '16px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
                  boxShadow: '0 8px 16px -4px rgba(139, 92, 246, 0.3)'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>Approve Requests</div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b' }}>{stats.pending}</div>
              </div>

              {/* Card 4: Today's Report */}
              <div
                onClick={() => setActiveTab('today-report')}
                style={{
                  background: 'white', borderRadius: '20px', padding: '24px', cursor: 'pointer',
                  boxShadow: activeTab === 'today-report' ? '0 10px 25px -5px rgba(59, 130, 246, 0.15)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  border: activeTab === 'today-report' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                  transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <div style={{
                  width: '56px', height: '56px', borderRadius: '16px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
                  boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.3)'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11H3v10h6V11z"></path><path d="M21 11h-6v10h6V11z"></path><path d="M15 3H9v6h6V3z"></path><path d="M9 3H3v6h6V3z"></path><path d="M21 3h-6v6h6V3z"></path></svg>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>Today's Report</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#94a3b8' }}>View Attendance</div>
              </div>

            </div>

            {/* CARD CONTENT */}
            <div className="card" style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
              {activeTab === 'all-requests' && (
                <div className="requests-section">
                  <div className="card-header" style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Today's Leave Requests</h3>
                  </div>
                  <RequestList
                    requests={allRequestsList}
                    userRole="manager"
                    onAction={handleAction}
                  />
                </div>
              )}

              {activeTab === 'today-report' && (
                <div style={{ padding: '32px' }}>
                  <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>Today's Employee Report</h3>
                    <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>Department-wise attendance and leave status for {new Date().toLocaleDateString()}</p>
                  </div>
                  
                  <button
                    onClick={fetchTodayReport}
                    disabled={reportLoading}
                    style={{
                      padding: '12px 24px',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: reportLoading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: reportLoading ? 0.6 : 1,
                      marginBottom: '24px'
                    }}
                  >
                    {reportLoading ? 'Loading...' : 'Refresh Report'}
                  </button>

                  {/* Overall Statistics */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>Total Employees</div>
                      <div style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b' }}>{todayStats.totalEmployees}</div>
                    </div>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>Present Today</div>
                      <div style={{ fontSize: '32px', fontWeight: '800', color: '#059669' }}>{todayStats.present}</div>
                    </div>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>On Leave</div>
                      <div style={{ fontSize: '32px', fontWeight: '800', color: '#d97706' }}>{todayStats.onLeave}</div>
                    </div>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>Absent</div>
                      <div style={{ fontSize: '32px', fontWeight: '800', color: '#dc2626' }}>{todayStats.absent}</div>
                    </div>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>On Permission</div>
                      <div style={{ fontSize: '32px', fontWeight: '800', color: '#2563eb' }}>{todayStats.onPermission}</div>
                    </div>
                  </div>

                  {/* Department-wise Table */}
                  <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Department-wise Report</h3>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc' }}>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px', borderBottom: '1px solid #e5e7eb' }}>Department</th>
                            <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '14px', borderBottom: '1px solid #e5e7eb' }}>Total</th>
                            <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '14px', borderBottom: '1px solid #e5e7eb' }}>Present</th>
                            <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '14px', borderBottom: '1px solid #e5e7eb' }}>On Leave</th>
                            <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '14px', borderBottom: '1px solid #e5e7eb' }}>Absent</th>
                            <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '14px', borderBottom: '1px solid #e5e7eb' }}>On Permission</th>
                            <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '14px', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {departmentStats.map((dept, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              <td style={{ padding: '16px', fontWeight: '600', color: '#1e293b' }}>{dept.department}</td>
                              <td style={{ padding: '16px', textAlign: 'center' }}>{dept.total}</td>
                              <td style={{ padding: '16px', textAlign: 'center', color: '#059669', fontWeight: '600' }}>{dept.present}</td>
                              <td style={{ padding: '16px', textAlign: 'center', color: '#d97706', fontWeight: '600' }}>{dept.onLeave}</td>
                              <td style={{ padding: '16px', textAlign: 'center', color: '#dc2626', fontWeight: '600' }}>{dept.absent}</td>
                              <td style={{ padding: '16px', textAlign: 'center', color: '#2563eb', fontWeight: '600' }}>{dept.onPermission}</td>
                              <td style={{ padding: '16px', textAlign: 'center' }}>
                                <button
                                  onClick={() => handleDepartmentClick(dept.department)}
                                  style={{
                                    padding: '8px 16px',
                                    background: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Department Details */}
                  {selectedDepartment && (
                    <div style={{ marginTop: '32px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                        <button
                          onClick={() => setSelectedDepartment(null)}
                          style={{
                            padding: '8px 16px',
                            background: '#f3f4f6',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                          Back to Overview
                        </button>
                        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
                          {selectedDepartment} - Detailed Report
                        </h2>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                        {/* Present Employees */}
                        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
                          <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', background: '#f0fdf4' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#059669' }}>
                              Present Employees ({departmentEmployees.present.length})
                            </h3>
                          </div>
                          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {departmentEmployees.present.map((emp, index) => (
                              <div key={index} style={{ padding: '12px 20px', borderBottom: '1px solid #f9fafb', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: '#059669' }}>
                                  {emp.name.charAt(0)}
                                </div>
                                <div>
                                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{emp.name}</div>
                                  <div style={{ fontSize: '12px', color: '#64748b' }}>{emp.email}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* On Leave Employees */}
                        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
                          <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', background: '#fffbeb' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#d97706' }}>
                              On Leave ({departmentEmployees.onLeave.length})
                            </h3>
                          </div>
                          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {departmentEmployees.onLeave.map((emp, index) => (
                              <div key={index} style={{ padding: '12px 20px', borderBottom: '1px solid #f9fafb' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: '#d97706' }}>
                                    {emp.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{emp.name}</div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>{emp.email}</div>
                                  </div>
                                </div>
                                <div style={{ marginLeft: '44px' }}>
                                  <span style={{ padding: '4px 8px', background: '#fef3c7', color: '#92400e', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                                    {emp.leaveType}
                                  </span>
                                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{emp.leaveReason}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Absent Employees */}
                        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
                          <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', background: '#fef2f2' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#dc2626' }}>
                              Absent ({departmentEmployees.absent.length})
                            </h3>
                          </div>
                          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {departmentEmployees.absent.map((emp, index) => (
                              <div key={index} style={{ padding: '12px 20px', borderBottom: '1px solid #f9fafb', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: '#dc2626' }}>
                                  {emp.name.charAt(0)}
                                </div>
                                <div>
                                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{emp.name}</div>
                                  <div style={{ fontSize: '12px', color: '#64748b' }}>{emp.email}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* On Permission Employees */}
                        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
                          <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', background: '#eff6ff' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#2563eb' }}>
                              On Permission ({departmentEmployees.onPermission.length})
                            </h3>
                          </div>
                          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {departmentEmployees.onPermission.map((emp, index) => (
                              <div key={index} style={{ padding: '12px 20px', borderBottom: '1px solid #f9fafb' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: '#2563eb' }}>
                                    {emp.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{emp.name}</div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>{emp.email}</div>
                                  </div>
                                </div>
                                <div style={{ marginLeft: '44px' }}>
                                  <span style={{ padding: '4px 8px', background: '#dbeafe', color: '#1e40af', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                                    Permission
                                  </span>
                                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{emp.permissionReason}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'apply-leave' && (
                <div style={{ padding: '32px' }}>
                  <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>Manager Leave Application</h3>
                    <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>Submit a leave request for yourself.</p>
                  </div>
                  <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <RequestForm
                      user={user}
                      onRequestSubmitted={handleRequestSubmitted}
                      requestType="leave"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'approve-requests' && (
                <div className="requests-section">
                  <div className="card-header" style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>My Approved Leaves ({myRequests.filter(r => r.status === 'approved').length})</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>Your leave requests approved by HR/Super Admin</p>
                  </div>
                  <RequestList
                    requests={myRequests.filter(r => r.status === 'approved')}
                    userRole="employee"
                  />
                </div>
              )}

              {activeTab === 'calendar' && (
                <div style={{ padding: '32px' }}>
                  <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>Monthly Leave Calendar</h3>
                  <LeaveCalendar user={user} scope="team" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManagerDashboard;
