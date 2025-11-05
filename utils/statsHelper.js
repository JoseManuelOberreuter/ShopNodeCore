// utils/statsHelper.js
// Helper functions for calculating statistics

/**
 * Calculate order statistics for a given period
 * @param {Array} orders - Array of order objects
 * @param {string} period - Period identifier (7d, 30d, 90d, 1y)
 * @returns {object} - Statistics object with summary and breakdowns
 */
export const calculateOrderStats = (orders, period = '30d') => {
  // Filter orders by period if needed (assuming orders are already filtered)
  // The filtering by date should be done before calling this function
  
  const totalOrders = orders.length;
  const paidOrders = orders.filter(order => order.payment_status === 'paid');
  const totalRevenue = paidOrders.reduce((sum, order) => sum + order.total_amount, 0);
  
  // Calculate average order value
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  // Calculate conversion rate (paid orders / total orders)
  const conversionRate = totalOrders > 0 ? (paidOrders.length / totalOrders) * 100 : 0;
  
  // Count orders by status
  const ordersByStatus = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});
  
  // Count orders by payment status
  const ordersByPaymentStatus = orders.reduce((acc, order) => {
    acc[order.payment_status] = (acc[order.payment_status] || 0) + 1;
    return acc;
  }, {});
  
  return {
    period,
    summary: {
      totalOrders,
      totalRevenue,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100
    },
    ordersByStatus,
    ordersByPaymentStatus
  };
};

/**
 * Calculate date range for a given period
 * @param {string} period - Period identifier (7d, 30d, 90d, 1y)
 * @returns {{start: Date, end: Date}} - Start and end dates
 */
export const calculateDateRange = (period) => {
  const now = new Date();
  let startDate;
  
  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  
  return {
    start: startDate,
    end: now
  };
};

