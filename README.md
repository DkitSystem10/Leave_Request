# LeaveHub - Leave & Permission Management System

LeaveHub is a comprehensive web-based Leave and Permission Management System built with React, HTML, and CSS. It provides a streamlined workflow for managing employee leave and permission requests with role-based access control, smart conflict validation, and comprehensive reporting.

## Features

### Core Functionality
- **Employee Code-based Login**: Quick access using Employee Code
- **Leave & Permission Requests**: Submit full-day leave or time-based permission requests
- **Auto-fill Employee Details**: Automatic population of employee information
- **Alternative Employee Assignment**: Mandatory assignment with smart conflict detection
- **Conflict Validation**: Prevents submission if alternative employee has conflicting requests

### Approval Workflow
- **Multi-level Approval**: Employee → Manager → HR → Super Admin
- **Role-based Dashboards**: Customized views for each user role
- **Real-time Status Tracking**: Monitor request status at each approval stage

### Reporting & Analytics
- **Leave Summary**: Track all leave requests
- **Permission Summary**: Monitor permission requests
- **Monthly Reports**: Month-wise breakdown of requests
- **Department-wise Analysis**: Department-level statistics
- **Custom Date Range Reports**: Flexible reporting options

### User Roles

1. **Employee**
   - Submit leave/permission requests
   - View request history and status
   - Auto-filled employee details

2. **Manager**
   - Review department requests
   - Approve/reject requests
   - Department-level reports

3. **HR**
   - Organization-wide request management
   - Approve/reject after manager approval
   - Comprehensive reports and analytics

4. **Super Admin**
   - Full system control
   - All requests management
   - System-wide reports and analytics

## Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## Demo Accounts

Use these Employee Codes to test different roles:

- **Employee**: `EMP001`, `EMP002`, `EMP003`, `EMP004`
- **Manager**: `MGR001`, `MGR002`, `MGR003`
- **HR**: `HR001`
- **Super Admin**: `ADMIN001`

## Usage

### For Employees

1. Login with your Employee Code
2. Navigate to "New Request" tab
3. Select request type (Leave or Permission)
4. Fill in the required details:
   - Start date (and end date for leave)
   - Start time and end time (for permission)
   - Reason
   - Alternative employee
5. Submit the request

### For Managers

1. Login with Manager Employee Code
2. View pending requests from your department
3. Review request details
4. Approve or reject with reason

### For HR

1. Login with HR Employee Code
2. View all organization requests
3. Review manager-approved requests
4. Generate reports and analytics

### For Super Admin

1. Login with Super Admin Employee Code
2. Access all system features
3. Manage all requests
4. View comprehensive reports

## Technology Stack

- **React 18.2.0**: UI framework
- **React Router DOM 6.20.0**: Routing
- **HTML5 & CSS3**: Structure and styling
- **LocalStorage**: Data persistence

## Project Structure

```
LeaveRequest/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Login.js
│   │   ├── EmployeeDashboard.js
│   │   ├── ManagerDashboard.js
│   │   ├── HRDashboard.js
│   │   ├── SuperAdminDashboard.js
│   │   ├── RequestForm.js
│   │   ├── RequestList.js
│   │   └── Reports.js
│   ├── context/
│   │   └── AuthContext.js
│   ├── utils/
│   │   └── dataService.js
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── package.json
└── README.md
```

## Key Features Explained

### Conflict Detection
The system automatically checks if the selected alternative employee has any conflicting leave or permission requests on the same date/time. If a conflict is detected, the submission is blocked with a clear warning message.

### Approval Hierarchy
1. Employee submits request
2. Manager reviews and approves/rejects
3. HR reviews manager-approved requests
4. Super Admin gives final approval
5. Request status updated accordingly

### Data Persistence
All data is stored in browser localStorage, making it persistent across sessions. In a production environment, this would be replaced with a backend API and database.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

- Backend API integration
- Database storage
- Email notifications
- Calendar integration
- Mobile app
- Advanced analytics dashboard
- Export reports to PDF/Excel

## License

This project is open source and available for use and modification.

## Support

For issues or questions, please refer to the project documentation or contact the development team.

