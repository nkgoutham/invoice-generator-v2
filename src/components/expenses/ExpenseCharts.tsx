import { useState, useEffect } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';
import { formatCurrency } from '../../utils/helpers';
import { Expense, ExpenseCategory } from '../../store/expenseStore';
import { Client } from '../../lib/supabase';

interface ExpenseChartsProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
  clients: Client[];
  startDate: Date;
  endDate: Date;
}

const ExpenseCharts: React.FC<ExpenseChartsProps> = ({ 
  expenses, 
  categories,
  clients,
  startDate,
  endDate
}) => {
  const [activeChart, setActiveChart] = useState<'category' | 'client' | 'time'>('category');
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [clientData, setClientData] = useState<any[]>([]);
  const [timeData, setTimeData] = useState<any[]>([]);
  const [currencyType, setCurrencyType] = useState<'INR' | 'USD'>('INR');
  
  // Generate colors for charts
  const generateColors = (count: number) => {
    const baseColors = [
      '#3B82F6', // Blue
      '#10B981', // Emerald
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#8B5CF6', // Purple
      '#EC4899', // Pink
      '#F97316', // Orange
      '#14B8A6', // Teal
      '#6B7280', // Gray
      '#0EA5E9', // Sky
      '#84CC16', // Lime
      '#9333EA', // Violet
      '#F43F5E', // Rose
      '#0891B2', // Cyan
      '#4F46E5', // Indigo
    ];
    
    // If we need more colors than in our base set, generate them
    if (count <= baseColors.length) {
      return baseColors.slice(0, count);
    }
    
    // Generate additional colors by adjusting hue
    const result = [...baseColors];
    const needed = count - baseColors.length;
    
    for (let i = 0; i < needed; i++) {
      const hue = (i * 137) % 360; // Use golden angle approximation for even distribution
      result.push(`hsl(${hue}, 70%, 50%)`);
    }
    
    return result;
  };
  
  // Prepare data for charts
  useEffect(() => {
    if (expenses.length > 0) {
      // Prepare category data
      const categoryTotals: Record<string, { inr: number, usd: number, name: string, color: string }> = {};
      
      // Initialize with all categories (even those with 0 expenses)
      categories.forEach(category => {
        categoryTotals[category.id] = {
          inr: 0,
          usd: 0,
          name: category.name,
          color: category.color
        };
      });
      
      // Add "Uncategorized" for expenses without a category
      categoryTotals['uncategorized'] = {
        inr: 0,
        usd: 0,
        name: 'Uncategorized',
        color: '#6B7280'
      };
      
      // Sum expenses by category
      expenses.forEach(expense => {
        const categoryId = expense.category_id || 'uncategorized';
        
        if (!categoryTotals[categoryId]) {
          // Handle case where category might have been deleted
          categoryTotals[categoryId] = {
            inr: 0,
            usd: 0,
            name: 'Unknown Category',
            color: '#6B7280'
          };
        }
        
        if (expense.currency === 'INR') {
          categoryTotals[categoryId].inr += expense.amount;
        } else {
          categoryTotals[categoryId].usd += expense.amount;
        }
      });
      
      // Convert to array and filter out categories with 0 expenses
      const categoryChartData = Object.values(categoryTotals)
        .filter(cat => cat.inr > 0 || cat.usd > 0)
        .map(cat => ({
          name: cat.name,
          value: currencyType === 'INR' ? cat.inr : cat.usd,
          color: cat.color
        }))
        .sort((a, b) => b.value - a.value);
      
      setCategoryData(categoryChartData);
      
      // Prepare client data
      const clientTotals: Record<string, { inr: number, usd: number, name: string }> = {};
      
      // Initialize with "No Client" for expenses without a client
      clientTotals['none'] = {
        inr: 0,
        usd: 0,
        name: 'No Client'
      };
      
      // Sum expenses by client
      expenses.forEach(expense => {
        const clientId = expense.client_id || 'none';
        
        if (!clientTotals[clientId]) {
          const client = clients.find(c => c.id === clientId);
          clientTotals[clientId] = {
            inr: 0,
            usd: 0,
            name: client ? (client.company_name || client.name) : 'Unknown Client'
          };
        }
        
        if (expense.currency === 'INR') {
          clientTotals[clientId].inr += expense.amount;
        } else {
          clientTotals[clientId].usd += expense.amount;
        }
      });
      
      // Convert to array and filter out clients with 0 expenses
      const clientChartData = Object.entries(clientTotals)
        .filter(([_, data]) => data.inr > 0 || data.usd > 0)
        .map(([id, data], index) => ({
          name: data.name,
          value: currencyType === 'INR' ? data.inr : data.usd,
          id
        }))
        .sort((a, b) => b.value - a.value);
      
      setClientData(clientChartData);
      
      // Prepare time series data
      const timeSeriesData: Record<string, { inr: number, usd: number, date: string }> = {};
      
      // Determine appropriate time grouping based on date range
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      let groupBy: 'day' | 'week' | 'month' = 'day';
      
      if (daysDiff > 90) {
        groupBy = 'month';
      } else if (daysDiff > 30) {
        groupBy = 'week';
      }
      
      // Group expenses by time period
      expenses.forEach(expense => {
        const expenseDate = new Date(expense.date);
        let timeKey: string;
        
        if (groupBy === 'day') {
          timeKey = expense.date; // YYYY-MM-DD
        } else if (groupBy === 'week') {
          // Get the week number
          const weekNumber = Math.ceil((expenseDate.getDate() + new Date(expenseDate.getFullYear(), expenseDate.getMonth(), 1).getDay()) / 7);
          timeKey = `${expenseDate.getFullYear()}-${(expenseDate.getMonth() + 1).toString().padStart(2, '0')}-W${weekNumber}`;
        } else {
          // Month
          timeKey = `${expenseDate.getFullYear()}-${(expenseDate.getMonth() + 1).toString().padStart(2, '0')}`;
        }
        
        if (!timeSeriesData[timeKey]) {
          timeSeriesData[timeKey] = {
            inr: 0,
            usd: 0,
            date: timeKey
          };
        }
        
        if (expense.currency === 'INR') {
          timeSeriesData[timeKey].inr += expense.amount;
        } else {
          timeSeriesData[timeKey].usd += expense.amount;
        }
      });
      
      // Convert to array and sort by date
      const timeChartData = Object.values(timeSeriesData)
        .map(data => ({
          name: formatTimeLabel(data.date, groupBy),
          value: currencyType === 'INR' ? data.inr : data.usd,
          date: data.date
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      setTimeData(timeChartData);
    }
  }, [expenses, categories, clients, currencyType, startDate, endDate]);
  
  // Format time labels based on grouping
  const formatTimeLabel = (dateStr: string, groupBy: 'day' | 'week' | 'month') => {
    if (groupBy === 'day') {
      return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } else if (groupBy === 'week') {
      const [year, month, weekPart] = dateStr.split('-');
      const weekNum = weekPart.substring(1);
      return `${month}/${year} W${weekNum}`;
    } else {
      const [year, month] = dateStr.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    }
  };
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-lg border border-gray-200 rounded-lg">
          <p className="font-medium text-sm">{label}</p>
          <p className="text-sm">
            {formatCurrency(payload[0].value, currencyType)}
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Render the appropriate chart based on active selection
  const renderChart = () => {
    if (activeChart === 'category') {
      return renderCategoryChart();
    } else if (activeChart === 'client') {
      return renderClientChart();
    } else {
      return renderTimeChart();
    }
  };
  
  // Render category breakdown chart
  const renderCategoryChart = () => {
    if (categoryData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No data available for the selected filters</p>
        </div>
      );
    }
    
    const colors = categoryData.map(item => item.color);
    
    return (
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };
  
  // Render client breakdown chart
  const renderClientChart = () => {
    if (clientData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No data available for the selected filters</p>
        </div>
      );
    }
    
    const colors = generateColors(clientData.length);
    
    return (
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={clientData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" tickFormatter={(value) => formatCurrency(value, currencyType)} />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={100}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill="#3B82F6">
              {clientData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };
  
  // Render time series chart
  const renderTimeChart = () => {
    if (timeData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No data available for the selected filters</p>
        </div>
      );
    }
    
    return (
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={timeData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => formatCurrency(value, currencyType, true)} />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#3B82F6" 
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };
  
  return (
    <div>
      {/* Chart Type Selector */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveChart('category')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            activeChart === 'category'
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          By Category
        </button>
        <button
          onClick={() => setActiveChart('client')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            activeChart === 'client'
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          By Client
        </button>
        <button
          onClick={() => setActiveChart('time')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            activeChart === 'time'
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Over Time
        </button>
        
        <div className="ml-auto">
          <div className="flex items-center space-x-2 border border-gray-300 rounded-md">
            <button
              onClick={() => setCurrencyType('INR')}
              className={`px-3 py-1.5 text-sm font-medium rounded-l-md ${
                currencyType === 'INR'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              ₹ INR
            </button>
            <button
              onClick={() => setCurrencyType('USD')}
              className={`px-3 py-1.5 text-sm font-medium rounded-r-md ${
                currencyType === 'USD'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              $ USD
            </button>
          </div>
        </div>
      </div>
      
      {/* Chart */}
      {renderChart()}
    </div>
  );
};

export default ExpenseCharts;