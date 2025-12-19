import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../utils/dataService';
import './Login.css';

function Login() {
  const [empCode, setEmpCode] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showMobileCredentials, setShowMobileCredentials] = useState(false);
  const { login } = useAuth();
  // Available departments
  const departments = ['Technology', 'Education', 'Finance', 'Associates', 'Intern', 'HR', 'Sales', 'Marketing', 'Admin', 'Manager'];

  // Department mapping based on first 2 characters of employee code
  const getDepartmentFromCode = (code) => {
    if (!code || code.length < 2) return '';
    const upperCode = code.toUpperCase();

    // Special priority check for 3-letter prefixes
    if (upperCode.startsWith('MGR')) return 'Associates';

    const prefix = upperCode.substring(0, 2);

    const departmentMap = {
      'TE': 'Technology',
      'ED': 'Education',
      'FI': 'Finance',
      'AS': 'Associates',
      'TC': 'Technology',
      'EC': 'Education',
      'FC': 'Finance',
      'AC': 'Associates',
      'EN': 'Technology',
      'MK': 'Marketing',   // Marketing
      'DM': 'Marketing',   // Marketing (Digital Marketing)
      'SL': 'Sales',       // Sales
      'HR': 'HR',
      'IN': 'Intern',
      'OP': 'Technology',
      'IT': 'Technology',
      'AD': 'Admin',       // Admin -> Admin
      'MG': 'Manager',     // Manager -> Manager
      'EM': 'Technology',
      'MA': 'Marketing',   // Marketing alternative
      'SA': 'Sales',       // Sales alternative
      'OT': 'Technology',
      'DI': 'Technology'
    };

    return departmentMap[prefix] || '';
  };
  const [loadingCredentials, setLoadingCredentials] = useState(true);
  const [employeesByRole, setEmployeesByRole] = useState({
    employee: [],
    manager: [],
    hr: [],
    superadmin: [],
  });

  // Fetch employees on mount
  React.useEffect(() => {
    const loadEmployees = async () => {
      setLoadingCredentials(true);
      try {
        // Fetch from DB if possible
        const all = await dataService.fetchAllEmployeesFromDB();

        // Filter for active users only
        // Consider 'active', 'rejoined', 'Active', or empty status as active
        const active = (all || []).filter(emp =>
          !emp.status ||
          emp.status.toLowerCase() === 'active' ||
          emp.status.toLowerCase() === 'rejoined'
        );

        setEmployeesByRole({
          employee: active.filter(emp => emp.role === 'employee'),
          manager: active.filter(emp => emp.role === 'manager'),
          hr: active.filter(emp => emp.role === 'hr'),
          superadmin: active.filter(emp => emp.role === 'superadmin'),
        });
      } catch (err) {
        console.error('Failed to load demo credentials:', err);
      } finally {
        setLoadingCredentials(false);
      }
    };

    loadEmployees();
  }, [setLoadingCredentials, setEmployeesByRole]);

  // Auto-fill department when employee code changes
  const handleEmpCodeChange = (e) => {
    const code = e.target.value.toUpperCase();
    setEmpCode(code);
    const autoDepartment = getDepartmentFromCode(code);
    if (autoDepartment) {
      setDepartment(autoDepartment);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!empCode.trim()) {
      setError('Please enter your Employee Code');
      return;
    }

    if (!department.trim()) {
      setError('Please enter your Department');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    // Authenticate using employee code, department, and password
    const employee = await dataService.authenticateEmployeeByCode(empCode.trim(), department.trim(), password);

    if (!employee) {
      setError('Invalid Employee Code, Department, or Password. Please try again.');
      return;
    }

    login(employee);
  };

  const roleConfig = {
    employee: { icon: '👤', label: 'Employees', color: '#3b82f6' },
    manager: { icon: '👔', label: 'Manager', color: '#8b5cf6' },
    hr: { icon: '💼', label: 'HR', color: '#ec4899' },
    superadmin: { icon: '⚡', label: 'Super Admin', color: '#f59e0b' },
  };


  return (
    <div className="login-container">
      <div className="login-grid">
        {/* Mobile Toggle Button for Credentials */}
        <button
          className={`credentials-toggle-btn ${showMobileCredentials ? 'active' : ''}`}
          onClick={() => setShowMobileCredentials(!showMobileCredentials)}
          title="Show Demo Credentials"
        >
          {showMobileCredentials ? '✕' : '🔑'}
        </button>

        <div className={`credentials-card ${showMobileCredentials ? 'show-mobile' : ''}`}>
          <div className="credentials-header">
            <h2 className="demo-title">🔑 Demo Credentials</h2>
            <p className="demo-subtitle">Use any of these accounts to login</p>
          </div>

          <div className="demo-accounts">
            {loadingCredentials ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading credentials...</p>
              </div>
            ) : Object.keys(employeesByRole).every(role => employeesByRole[role].length === 0) ? (
              <div className="empty-state">
                <p>No active accounts found.</p>
              </div>
            ) : (
              Object.entries(employeesByRole).map(([role, employees]) => {
                if (employees.length === 0) return null;
                const config = roleConfig[role];
                return (
                  <div key={role} className="role-section">
                    <div className="role-header" style={{ borderLeftColor: config.color }}>
                      <span className="role-icon">{config.icon}</span>
                      <span className="role-label">{config.label}</span>
                      <span className="role-count">{employees.length}</span>
                    </div>
                    <div className="employees-list">
                      {employees.map(emp => (
                        <div key={emp.id} className="demo-account">
                          <div className="employee-info">
                            <strong className="employee-name">{emp.name}</strong>
                            <span className="employee-id">{emp.id}</span>
                          </div>
                          <div className="credentials-row">
                            <div className="credential-item">
                              <span className="credential-label">Code:</span>
                              <code className="credential-value">{emp.id}</code>
                            </div>
                            <div className="credential-item">
                              <span className="credential-label">Dept:</span>
                              <code className="credential-value">{emp.department}</code>
                            </div>
                            <div className="credential-item">
                              <span className="credential-label">Pass:</span>
                              <code className="credential-value">{emp.password}</code>
                            </div>
                          </div>
                          {emp.department && (
                            <div className="employee-meta">
                              <span className="meta-badge">{emp.department}</span>
                              {emp.designation && <span className="meta-badge">{emp.designation}</span>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="security-badge">🔒 Secure Authentication System</div>
        </div>
        <div className="login-right">
          <div className="login-card">
            <div className="login-header">
              <div className="login-logo">📋</div>
              <h1 className="login-title">Durkkas ERP</h1>
              <p className="login-subtitle">Leave & Permission Management System</p>
            </div>

            <div className="login-body">
              <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                  <label htmlFor="empCode" className="form-label">
                    Employee Code *
                  </label>
                  <input
                    type="text"
                    id="empCode"
                    className="form-input"
                    value={empCode}
                    onChange={handleEmpCodeChange}
                    placeholder="Enter Employee Code (e.g., EMP001, MGR001)"
                    autoFocus
                    style={{ textTransform: 'uppercase' }}
                  />
                  <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Department will be auto-filled based on code prefix
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="department" className="form-label">
                    Department *
                  </label>
                  <select
                    id="department"
                    className="form-input"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    style={{
                      background: department ? '#f0f9ff' : '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Auto-filled from Employee Code (can be changed if needed)
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    Password *
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      className="form-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                {error && <div className="form-error">{error}</div>}

                <button type="submit" className="btn btn-primary login-btn">
                  Sign In
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
