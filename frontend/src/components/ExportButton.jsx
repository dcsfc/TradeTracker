import { useState } from 'react';

const ExportButton = ({ trades, stats }) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = () => {
    setIsExporting(true);
    
    const csvHeaders = [
      'Symbol', 'Entry Price', 'Exit Price', 'Position Type', 'PnL', 'ROI', 'RR',
      'Position Size', 'Leverage', 'Fees', 'Exchange', 'Date', 'Notes'
    ];
    
    const csvData = trades.map(trade => [
      trade.symbol,
      trade.entryPrice || '',
      trade.exitPrice || '',
      trade.positionType,
      trade.pnl || '',
      trade.roi || '',
      trade.rr || '',
      trade.positionSize || '',
      trade.leverage || '',
      trade.fees || '',
      trade.exchange || '',
      trade.date,
      trade.notes || ''
    ]);
    
    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `trades_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => setIsExporting(false), 1000);
  };

  const exportToPDF = () => {
    setIsExporting(true);
    
    // Simple PDF generation using browser print
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Trading Report - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .stats { display: flex; justify-content: space-around; margin-bottom: 30px; }
            .stat-box { text-align: center; padding: 10px; border: 1px solid #ccc; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .positive { color: green; }
            .negative { color: red; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Trading Performance Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="stats">
            <div class="stat-box">
              <h3>Total Trades</h3>
              <p>${stats.total_trades}</p>
            </div>
            <div class="stat-box">
              <h3>Win Rate</h3>
              <p>${stats.win_rate.toFixed(1)}%</p>
            </div>
            <div class="stat-box">
              <h3>Total PnL</h3>
              <p class="${stats.today_pnl >= 0 ? 'positive' : 'negative'}">$${stats.today_pnl.toFixed(2)}</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Entry</th>
                <th>Exit</th>
                <th>Type</th>
                <th>PnL</th>
                <th>ROI</th>
                <th>Date</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${trades.map(trade => `
                <tr>
                  <td>${trade.symbol}</td>
                  <td>${trade.entryPrice || ''}</td>
                  <td>${trade.exitPrice || ''}</td>
                  <td>${trade.positionType}</td>
                  <td class="${(trade.pnl || 0) >= 0 ? 'positive' : 'negative'}">$${(trade.pnl || 0).toFixed(2)}</td>
                  <td>${(trade.roi || 0).toFixed(2)}%</td>
                  <td>${trade.date}</td>
                  <td>${trade.notes || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
    
    setTimeout(() => setIsExporting(false), 1000);
  };

  return (
    <div className="flex space-x-3">
      <button
        onClick={exportToCSV}
        disabled={isExporting}
        className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-all duration-300 disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
        <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
      </button>
      
      <button
        onClick={exportToPDF}
        disabled={isExporting}
        className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all duration-300 disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
        <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
      </button>
    </div>
  );
};

export default ExportButton;
