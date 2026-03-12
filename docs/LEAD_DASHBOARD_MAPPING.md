# Lead Analytics Dashboard Mapping

This document maps the analytics API response to the dashboard metrics shown in your reference image.

## Dashboard Metrics Mapping

### Row 1: Call Status Metrics
| Dashboard Label | API Field | Description |
|----------------|-----------|-------------|
| Call Not Answered | `callMetrics.callNotAnswered` | 18835 |
| Number not Reachable | `callMetrics.numberNotReachable` | 1126 |
| Deal Done | `callMetrics.dealDone` | 2889 |
| Call Back | `callMetrics.callBack` | 2787 |
| Interested | `callMetrics.interested` | 1928 |
| Number not Connected | `callMetrics.numberNotConnected` | 2129 |
| Order Enquiry | `callMetrics.orderEnquiry` | 167 |
| Not Interested | `callMetrics.notInterested` | 1 |
| Switch off | `callMetrics.switchOff` | 230 |

### Row 2: Follow-up & Activity Metrics
| Dashboard Label | API Field | Description |
|----------------|-----------|-------------|
| Followup Missed | `followUpMetrics.followupMissed` | 243 |
| Untouched Leads | `followUpMetrics.untouchedLeads` | 591 |
| Sale done for Month | `followUpMetrics.salesDoneThisMonth` | 133 |
| Closed Leads | `followUpMetrics.closedLeads` | 15250 |
| Missed Call | `callMetrics.missedCalls` | 872 |
| Total Leads | `overview.totalLeads` | 45768 |
| Followup for Today | `followUpMetrics.followupForToday` | 0 |
| Followup Done Today | `followUpMetrics.followupDoneToday` | 0 |

## Additional Metrics Available

### Overview Section
```javascript
{
  totalLeads: 45768,
  newLeads: 1126,
  contactedLeads: 15250,
  assignedLeads: 12000,
  qualifiedLeads: 5000,
  convertedLeads: 2889,
  lostLeads: 872,
  conversionRate: "6.31%",
  avgResponseTime: "2.5 hours"
}
```

### Revenue Metrics
```javascript
{
  totalExpectedRevenue: 5000000,
  convertedRevenue: 2500000,
  potentialRevenue: 2500000,
  averageDealSize: "86538.46"
}
```

### Team Performance
```javascript
{
  topPerformers: [
    {
      userId: "...",
      userName: "John Doe",
      totalLeads: 500,
      convertedLeads: 50,
      conversionRate: "10.00",
      totalValue: 500000
    }
  ],
  totalAssigned: 35000,
  unassignedLeads: 10768
}
```

### Source Breakdown
```javascript
{
  website: 15000,
  newsletter: 5000,
  popup: 3000,
  referral: 2000,
  manual: 10000,
  IVR: 8000,
  facebook_lead_ads: 2768
}
```

## Frontend Component Example

```jsx
import React, { useEffect, useState } from 'react';

const LeadAnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/crm/leads/analytics');
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!analytics) return <div>No data available</div>;

  return (
    <div className="analytics-dashboard">
      {/* Row 1: Call Status Metrics */}
      <div className="metrics-row">
        <MetricCard 
          label="Call Not Answered" 
          value={analytics.callMetrics.callNotAnswered} 
          color="red"
        />
        <MetricCard 
          label="Number not Reachable" 
          value={analytics.callMetrics.numberNotReachable} 
          color="gray"
        />
        <MetricCard 
          label="Deal Done" 
          value={analytics.callMetrics.dealDone} 
          color="green"
        />
        <MetricCard 
          label="Call Back" 
          value={analytics.callMetrics.callBack} 
          color="yellow"
        />
        <MetricCard 
          label="Interested" 
          value={analytics.callMetrics.interested} 
          color="blue"
        />
        <MetricCard 
          label="Number not Connected" 
          value={analytics.callMetrics.numberNotConnected} 
          color="gray"
        />
        <MetricCard 
          label="Order Enquiry" 
          value={analytics.callMetrics.orderEnquiry} 
          color="purple"
        />
        <MetricCard 
          label="Not Interested" 
          value={analytics.callMetrics.notInterested} 
          color="red"
        />
        <MetricCard 
          label="Switch off" 
          value={analytics.callMetrics.switchOff} 
          color="gray"
        />
      </div>

      {/* Row 2: Follow-up Metrics */}
      <div className="metrics-row">
        <MetricCard 
          label="Followup Missed" 
          value={analytics.followUpMetrics.followupMissed} 
          color="orange"
        />
        <MetricCard 
          label="Untouched Leads" 
          value={analytics.followUpMetrics.untouchedLeads} 
          color="gray"
        />
        <MetricCard 
          label="Sale done for Month" 
          value={analytics.followUpMetrics.salesDoneThisMonth} 
          color="green"
        />
        <MetricCard 
          label="Closed Leads" 
          value={analytics.followUpMetrics.closedLeads} 
          color="gray"
        />
        <MetricCard 
          label="Missed Call" 
          value={analytics.callMetrics.missedCalls} 
          color="red"
        />
        <MetricCard 
          label="Total Leads" 
          value={analytics.overview.totalLeads} 
          color="blue"
        />
        <MetricCard 
          label="Followup for Today" 
          value={analytics.followUpMetrics.followupForToday} 
          color="yellow"
        />
        <MetricCard 
          label="Followup Done Today" 
          value={analytics.followUpMetrics.followupDoneToday} 
          color="green"
        />
      </div>

      {/* Additional sections */}
      <div className="overview-section">
        <h2>Overview</h2>
        <p>Conversion Rate: {analytics.overview.conversionRate}</p>
        <p>Avg Response Time: {analytics.overview.avgResponseTime}</p>
      </div>

      <div className="revenue-section">
        <h2>Revenue</h2>
        <p>Total Expected: ${analytics.revenueMetrics.totalExpectedRevenue.toLocaleString()}</p>
        <p>Converted: ${analytics.revenueMetrics.convertedRevenue.toLocaleString()}</p>
        <p>Average Deal Size: ${analytics.revenueMetrics.averageDealSize}</p>
      </div>

      <div className="team-section">
        <h2>Top Performers</h2>
        {analytics.teamPerformance.topPerformers.map(performer => (
          <div key={performer.userId}>
            <p>{performer.userName}: {performer.convertedLeads} conversions ({performer.conversionRate}%)</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, color }) => (
  <div className={`metric-card metric-${color}`}>
    <div className="metric-label">{label}</div>
    <div className="metric-value">{value.toLocaleString()}</div>
  </div>
);

export default LeadAnalyticsDashboard;
```

## CSS Example

```css
.analytics-dashboard {
  padding: 20px;
}

.metrics-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.metric-card {
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}

.metric-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
}

/* Color variants */
.metric-red { background-color: #ffebee; color: #c62828; }
.metric-green { background-color: #e8f5e9; color: #2e7d32; }
.metric-blue { background-color: #e3f2fd; color: #1565c0; }
.metric-yellow { background-color: #fff9c4; color: #f57f17; }
.metric-orange { background-color: #ffe0b2; color: #e65100; }
.metric-purple { background-color: #f3e5f5; color: #6a1b9a; }
.metric-gray { background-color: #f5f5f5; color: #424242; }
```

## API Usage with Filters

```javascript
// Get analytics for current month
const currentMonth = async () => {
  const startDate = new Date();
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);
  
  const response = await fetch(
    `/api/crm/leads/analytics?startDate=${startDate.toISOString()}`
  );
  return response.json();
};

// Get analytics for specific user
const userAnalytics = async (userId) => {
  const response = await fetch(
    `/api/crm/leads/analytics?assignedTo=${userId}`
  );
  return response.json();
};

// Get analytics for date range
const dateRangeAnalytics = async (start, end) => {
  const response = await fetch(
    `/api/crm/leads/analytics?startDate=${start}&endDate=${end}`
  );
  return response.json();
};
```
