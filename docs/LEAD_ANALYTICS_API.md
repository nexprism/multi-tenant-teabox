# Lead Analytics API Documentation

## Endpoint
`GET /api/crm/leads/analytics`

## Description
Provides comprehensive analytics and metrics for lead management, including call status, follow-ups, conversions, revenue tracking, and team performance.

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | ISO Date String | No | Filter leads created after this date |
| `endDate` | ISO Date String | No | Filter leads created before this date |
| `assignedTo` | ObjectId | No | Filter by assigned user ID |

## Example Request
```javascript
// Get all-time analytics
GET /api/crm/leads/analytics

// Get analytics for a specific date range
GET /api/crm/leads/analytics?startDate=2024-01-01&endDate=2024-12-31

// Get analytics for a specific user
GET /api/crm/leads/analytics?assignedTo=507f1f77bcf86cd799439011

// Combined filters
GET /api/crm/leads/analytics?startDate=2024-01-01&assignedTo=507f1f77bcf86cd799439011
```

## Response Structure

### Success Response (200)
```json
{
  "success": true,
  "message": "Lead analytics fetched successfully",
  "data": {
    "overview": {
      "totalLeads": 45768,
      "newLeads": 1126,
      "contactedLeads": 15250,
      "assignedLeads": 12000,
      "qualifiedLeads": 5000,
      "convertedLeads": 2889,
      "lostLeads": 872,
      "conversionRate": "6.31%",
      "avgResponseTime": "2.5 hours"
    },
    "callMetrics": {
      "callNotAnswered": 18835,
      "numberNotReachable": 1126,
      "dealDone": 2889,
      "callBack": 2787,
      "interested": 1928,
      "numberNotConnected": 2129,
      "orderEnquiry": 167,
      "notInterested": 1,
      "switchOff": 230,
      "missedCalls": 872
    },
    "followUpMetrics": {
      "followupMissed": 243,
      "untouchedLeads": 591,
      "followupForToday": 0,
      "followupDoneToday": 0,
      "salesDoneThisMonth": 133,
      "closedLeads": 15250
    },
    "revenueMetrics": {
      "totalExpectedRevenue": 5000000,
      "convertedRevenue": 2500000,
      "potentialRevenue": 2500000,
      "averageDealSize": "86538.46"
    },
    "sourceBreakdown": {
      "website": 15000,
      "newsletter": 5000,
      "popup": 3000,
      "referral": 2000,
      "manual": 10000,
      "IVR": 8000,
      "facebook_lead_ads": 2768
    },
    "teamPerformance": {
      "topPerformers": [
        {
          "userId": "507f1f77bcf86cd799439011",
          "userName": "John Doe",
          "totalLeads": 500,
          "convertedLeads": 50,
          "conversionRate": "10.00",
          "totalValue": 500000
        }
      ],
      "totalAssigned": 35000,
      "unassignedLeads": 10768
    },
    "statusDistribution": {
      "new": 1126,
      "contacted": 15250,
      "assigned": 12000,
      "qualified": 5000,
      "converted": 2889,
      "lost": 872
    },
    "timeMetrics": {
      "today": {
        "followUps": 0,
        "contacted": 0
      },
      "thisMonth": {
        "conversions": 133
      }
    }
  }
}
```

### Error Response (500)
```json
{
  "success": false,
  "message": "Error message here"
}
```

## Metrics Explanation

### Overview Metrics
- **totalLeads**: Total number of leads in the system
- **newLeads**: Leads with status 'new'
- **contactedLeads**: Leads with status 'contacted'
- **assignedLeads**: Leads with status 'assigned'
- **qualifiedLeads**: Leads with status 'qualified'
- **convertedLeads**: Leads that have been converted to customers
- **lostLeads**: Leads marked as lost
- **conversionRate**: Percentage of leads converted (convertedLeads / totalLeads * 100)
- **avgResponseTime**: Average time between lead creation and first contact

### Call Metrics
Maps to the `lastCallStatus` field in the Lead model:
- **callNotAnswered**: Calls that weren't answered
- **numberNotReachable**: Phone numbers that couldn't be reached
- **dealDone**: Successfully converted leads
- **callBack**: Leads requesting a callback
- **interested**: Leads showing interest
- **numberNotConnected**: Numbers that didn't connect
- **orderEnquiry**: Leads with order inquiries
- **notInterested**: Leads not interested
- **switchOff**: Phone switched off
- **missedCalls**: Missed call attempts

### Follow-up Metrics
- **followupMissed**: Leads with overdue follow-ups
- **untouchedLeads**: New leads that haven't been contacted
- **followupForToday**: Scheduled follow-ups for today
- **followupDoneToday**: Follow-ups completed today
- **salesDoneThisMonth**: Conversions in the current month
- **closedLeads**: Leads marked as lost

### Revenue Metrics
- **totalExpectedRevenue**: Sum of all expectedPrice values
- **convertedRevenue**: Sum of expectedPrice for converted leads
- **potentialRevenue**: Expected revenue from non-converted leads
- **averageDealSize**: Average value of converted deals

### Source Breakdown
Distribution of leads by source:
- website
- newsletter
- popup
- referral
- manual
- IVR
- facebook_lead_ads
- other

### Team Performance
- **topPerformers**: Top 10 users by conversion count
  - userId: User's ObjectId
  - userName: User's full name
  - totalLeads: Total leads assigned
  - convertedLeads: Number of conversions
  - conversionRate: Conversion percentage
  - totalValue: Total revenue generated
- **totalAssigned**: Total leads assigned to users
- **unassignedLeads**: Leads not assigned to anyone

### Status Distribution
Count of leads by status (new, contacted, assigned, qualified, converted, lost)

### Time Metrics
- **today.followUps**: Follow-ups scheduled for today
- **today.contacted**: Leads contacted today
- **thisMonth.conversions**: Conversions this month

## Usage Example

```javascript
// Frontend React/Next.js example
const fetchLeadAnalytics = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);
  
  const response = await fetch(`/api/crm/leads/analytics?${params.toString()}`);
  const data = await response.json();
  
  if (data.success) {
    return data.data;
  } else {
    throw new Error(data.message);
  }
};

// Usage
const analytics = await fetchLeadAnalytics({
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});

console.log('Total Leads:', analytics.overview.totalLeads);
console.log('Conversion Rate:', analytics.overview.conversionRate);
console.log('Top Performer:', analytics.teamPerformance.topPerformers[0]);
```

## Notes
- All date filters use the `createdAt` field of leads
- Response times are calculated in hours
- Conversion rate is returned as a percentage string
- Top performers are sorted by conversion count (descending)
- Unassigned leads are calculated as total leads minus assigned leads
- The API uses parallel queries for optimal performance
