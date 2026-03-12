import DashboardService from '../services/dashboardService';

class DashboardController {
  constructor(dashboardService) {
    this.dashboardService = dashboardService;
  }

  async getDashboardData(request, conn) {
    console.log('Controller received get dashboard data request');
    try {
      const dashboardData = await this.dashboardService.getDashboardMetrics(conn);
      return {
        success: true,
        message: 'Dashboard data fetched successfully',
        data: dashboardData
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }
}

export default DashboardController;