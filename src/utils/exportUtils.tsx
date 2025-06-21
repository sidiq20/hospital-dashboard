import { ExportData } from '@/types';
import { ExportConfig } from '@/components/reports/ExportDialog';

// Generate CSV content
export const generateCSV = (data: ExportData, config: ExportConfig): string => {
  let csvContent = '';
  
  if (config.sections.overview) {
    csvContent += 'HOSPITAL OVERVIEW\n';
    csvContent += `Export Date,${data.exportDate.toISOString()}\n`;
    csvContent += `Date Range,${data.dateRange.start.toLocaleDateString()} - ${data.dateRange.end.toLocaleDateString()}\n`;
    csvContent += `Total Patients,${data.stats.totalPatients}\n`;
    csvContent += `Active Patients,${data.stats.admittedPatients}\n`;
    csvContent += `Total Wards,${data.stats.totalWards}\n`;
    csvContent += `Procedures Pending,${data.stats.proceduresPending}\n`;
    csvContent += `Procedures Completed,${data.stats.proceduresCompleted}\n\n`;
  }

  if (config.sections.patients && data.patients.length > 0) {
    csvContent += 'PATIENTS\n';
    csvContent += 'ID,Name,Age,Gender,Phone,Status,Admission Date,Diagnosis,Procedure,Procedure Status\n';
    
    data.patients.forEach(patient => {
      csvContent += `${patient.id},${patient.name},${patient.age},${patient.gender},${patient.phone},${patient.status},${patient.admissionDate.toLocaleDateString()},"${patient.diagnosis}","${patient.procedure || ''}",${patient.procedureStatus || ''}\n`;
    });
    csvContent += '\n';
  }

  if (config.sections.wards && data.wards.length > 0) {
    csvContent += 'WARDS\n';
    csvContent += 'ID,Name,Department,Type\n';
    
    data.wards.forEach(ward => {
      csvContent += `${ward.id},${ward.name},${ward.department},${ward.wardType}\n`;
    });
    csvContent += '\n';
  }

  if (config.sections.procedures) {
    csvContent += 'PROCEDURE ANALYTICS\n';
    csvContent += `Current Waiting List,${data.procedureAnalytics.currentWaitingList}\n`;
    csvContent += `Average Wait Time,${data.procedureAnalytics.averageWaitTime} days\n`;
    csvContent += `Pending Procedures,${data.procedureAnalytics.proceduresByStatus.pending}\n`;
    csvContent += `Reviewed Procedures,${data.procedureAnalytics.proceduresByStatus.reviewed}\n`;
    csvContent += `Completed Procedures,${data.procedureAnalytics.proceduresByStatus.completed}\n\n`;
    
    csvContent += 'WEEKLY COMPLETION RATES\n';
    csvContent += 'Week,Completed,Total,Rate\n';
    data.procedureAnalytics.weeklyCompletionRate.forEach(week => {
      csvContent += `${week.week},${week.completed},${week.total},${week.rate.toFixed(1)}%\n`;
    });
  }

  return csvContent;
};

// Generate JSON content
export const generateJSON = (data: ExportData, config: ExportConfig): string => {
  const exportData: any = {
    exportInfo: {
      exportDate: data.exportDate,
      dateRange: data.dateRange,
      format: 'json',
      sections: config.sections
    }
  };

  if (config.sections.overview) {
    exportData.overview = data.stats;
  }

  if (config.sections.patients) {
    exportData.patients = data.patients;
  }

  if (config.sections.wards) {
    exportData.wards = data.wards;
  }

  if (config.sections.procedures) {
    exportData.procedureAnalytics = data.procedureAnalytics;
  }

  return JSON.stringify(exportData, null, 2);
};

// Generate Excel-compatible CSV (with better formatting)
export const generateExcelCSV = (data: ExportData, config: ExportConfig): string => {
  let content = generateCSV(data, config);
  
  // Add BOM for proper Excel UTF-8 handling
  return '\ufeff' + content;
};

// Generate PDF content (HTML that can be converted to PDF)
export const generatePDFHTML = (data: ExportData, config: ExportConfig): string => {
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Hospital Report - ${data.dateRange.start.toLocaleDateString()} to ${data.dateRange.end.toLocaleDateString()}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #3b82f6; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
        th { background-color: #f3f4f6; font-weight: bold; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
        .stat-label { color: #64748b; font-size: 14px; }
        .page-break { page-break-before: always; }
        @media print { .page-break { page-break-before: always; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>MediCare Hospital Management Report</h1>
        <p><strong>Report Period:</strong> ${data.dateRange.start.toLocaleDateString()} - ${data.dateRange.end.toLocaleDateString()}</p>
        <p><strong>Generated:</strong> ${data.exportDate.toLocaleString()}</p>
      </div>
  `;

  if (config.sections.overview) {
    html += `
      <div class="section">
        <h2>Hospital Overview</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${data.stats.totalPatients}</div>
            <div class="stat-label">Total Patients</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.stats.admittedPatients}</div>
            <div class="stat-label">Active Patients</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.stats.totalWards}</div>
            <div class="stat-label">Total Wards</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.stats.proceduresPending}</div>
            <div class="stat-label">Pending Procedures</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.stats.proceduresCompleted}</div>
            <div class="stat-label">Completed Procedures</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.stats.proceduresCompletedThisWeek}</div>
            <div class="stat-label">Completed This Week</div>
          </div>
        </div>
      </div>
    `;
  }

  if (config.sections.patients && data.patients.length > 0) {
    html += `
      <div class="section page-break">
        <h2>Patient Records (${data.patients.length} patients)</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Status</th>
              <th>Admission Date</th>
              <th>Diagnosis</th>
              <th>Procedure</th>
              <th>Procedure Status</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    data.patients.forEach(patient => {
      html += `
        <tr>
          <td>${patient.name}</td>
          <td>${patient.age}</td>
          <td>${patient.gender}</td>
          <td>${patient.status}</td>
          <td>${patient.admissionDate.toLocaleDateString()}</td>
          <td>${patient.diagnosis}</td>
          <td>${patient.procedure || '-'}</td>
          <td>${patient.procedureStatus || '-'}</td>
        </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
      </div>
    `;
  }

  if (config.sections.wards && data.wards.length > 0) {
    html += `
      <div class="section">
        <h2>Ward Information</h2>
        <table>
          <thead>
            <tr>
              <th>Ward Name</th>
              <th>Department</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    data.wards.forEach(ward => {
      html += `
        <tr>
          <td>${ward.name}</td>
          <td>${ward.department}</td>
          <td>${ward.wardType}</td>
        </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
      </div>
    `;
  }

  if (config.sections.procedures) {
    html += `
      <div class="section">
        <h2>Procedure Analytics</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${data.procedureAnalytics.currentWaitingList}</div>
            <div class="stat-label">Current Waiting List</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.procedureAnalytics.averageWaitTime}</div>
            <div class="stat-label">Average Wait Time (days)</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.procedureAnalytics.proceduresByStatus.pending}</div>
            <div class="stat-label">Pending</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.procedureAnalytics.proceduresByStatus.reviewed}</div>
            <div class="stat-label">Reviewed</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.procedureAnalytics.proceduresByStatus.completed}</div>
            <div class="stat-label">Completed</div>
          </div>
        </div>
        
        <h3>Weekly Completion Rates</h3>
        <table>
          <thead>
            <tr>
              <th>Week</th>
              <th>Completed</th>
              <th>Total</th>
              <th>Completion Rate</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    data.procedureAnalytics.weeklyCompletionRate.forEach(week => {
      html += `
        <tr>
          <td>${week.week}</td>
          <td>${week.completed}</td>
          <td>${week.total}</td>
          <td>${week.rate.toFixed(1)}%</td>
        </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
      </div>
    `;
  }

  html += `
    </body>
    </html>
  `;

  return html;
};

// Download file utility
export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Generate filename based on config
export const generateFilename = (config: ExportConfig): string => {
  const date = new Date().toISOString().split('T')[0];
  const range = config.dateRange.type;
  return `hospital-report-${range}-${date}`;
};