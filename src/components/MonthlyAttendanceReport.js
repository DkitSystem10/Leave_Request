import React, { useState, useEffect } from 'react';
import { dataService } from '../utils/dataService';
import './MonthlyAttendanceReport.css';

function MonthlyAttendanceReport({ user }) {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (user?.id) {
      generateReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year, user?.id]);

  const generateReport = async () => {
    const requests = await dataService.getMonthlySummary(year, month);
    const userRequests = requests.filter(req => (req.employee_id || req.employeeId) === user.id);
    
    const summaryData = {
      totalDays: 0,
      leaveDays: 0,
      permissionHours: 0,
      approved: 0,
      pending: 0,
      rejected: 0
    };

    userRequests.forEach(req => {
      const reqType = req.type;
      const startDate = req.start_date || req.startDate;
      const endDate = req.end_date || req.endDate;
      const startTime = req.start_time || req.startTime;
      const endTime = req.end_time || req.endTime;
      const reqStatus = req.status;
      
      if (reqType === 'leave') {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        summaryData.leaveDays += days;
        summaryData.totalDays += days;
      } else if (reqType === 'permission') {
        if (startTime && endTime) {
          const start = new Date(`2000-01-01T${startTime}`);
          const end = new Date(`2000-01-01T${endTime}`);
          const hours = (end - start) / (1000 * 60 * 60);
          summaryData.permissionHours += hours;
        }
      }
      
      if (reqStatus === 'approved') summaryData.approved++;
      if (reqStatus === 'pending') summaryData.pending++;
      if (reqStatus === 'rejected') summaryData.rejected++;
    });

    setReportData(userRequests);
    setSummary(summaryData);
  };

  const getMonthName = (monthNum) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthNum - 1];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="attendance-report">
      <div className="report-filters">
        <div className="form-group">
          <label className="form-label">Month</label>
          <select
            className="form-select"
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
              <option key={m} value={m}>{getMonthName(m)}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Year</label>
          <input
            type="number"
            className="form-input"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            min="2020"
            max="2030"
          />
        </div>
      </div>

      {summary && (
        <div className="report-summary">
          <h3>Summary for {getMonthName(month)} {year}</h3>
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-label">Total Leave Days</div>
              <div className="summary-value">{summary.leaveDays}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Permission Hours</div>
              <div className="summary-value">{summary.permissionHours.toFixed(1)}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Approved Requests</div>
              <div className="summary-value" style={{ color: '#28a745' }}>{summary.approved}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Pending Requests</div>
              <div className="summary-value" style={{ color: '#ffc107' }}>{summary.pending}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Rejected Requests</div>
              <div className="summary-value" style={{ color: '#dc3545' }}>{summary.rejected}</div>
            </div>
          </div>
        </div>
      )}

      <div className="report-table">
        <h3>Request Details</h3>
        {reportData.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <p>No requests found for {getMonthName(month)} {year}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map(req => {
                  const reqType = req.type;
                  const startDate = req.start_date || req.startDate;
                  const endDate = req.end_date || req.endDate;
                  const startTime = req.start_time || req.startTime;
                  const endTime = req.end_time || req.endTime;
                  const reqStatus = req.status;
                  
                  return (
                  <tr key={req.id}>
                    <td>{req.id}</td>
                    <td>
                      <span className="badge" style={{ 
                        background: reqType === 'leave' ? '#e3f2fd' : '#fff3e0',
                        color: reqType === 'leave' ? '#1976d2' : '#f57c00'
                      }}>
                        {reqType}
                      </span>
                    </td>
                    <td>
                      {reqType === 'leave' ? (
                        <div>
                          {formatDate(startDate)}
                          {endDate !== startDate && (
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              to {formatDate(endDate)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          {formatDate(startDate)}
                          {startTime && endTime && (
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {startTime} - {endTime}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      {reqType === 'leave' ? (
                        (() => {
                          const start = new Date(startDate);
                          const end = new Date(endDate);
                          const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                          return `${days} day${days > 1 ? 's' : ''}`;
                        })()
                      ) : (
                        startTime && endTime ? (
                          (() => {
                            const start = new Date(`2000-01-01T${startTime}`);
                            const end = new Date(`2000-01-01T${endTime}`);
                            const hours = (end - start) / (1000 * 60 * 60);
                            return `${hours.toFixed(1)} hours`;
                          })()
                        ) : '-'
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${reqStatus}`}>{reqStatus}</span>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default MonthlyAttendanceReport;

