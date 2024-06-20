export const nsUtil = {
	taipeiTimeString: (now: Date) => {
		const dateStr = now.toLocaleDateString("zh-TW");
		const timeStr = now.toLocaleTimeString("zh-TW");
		return `${dateStr} ${timeStr}`;
	},
};

export function filterByDateRange(orders, startDate?: string, endDate?: string) {
	if (!startDate || !endDate) {
		return orders
	}

	const dateFormatter = new Intl.DateTimeFormat('zh-TW', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	});

	const filteredOrders = orders.filter(order => {
		// order_time is in format "YYYY-MM-DD HH:MM:SS"
		const orderDate = new Date(order.order_time);
		const year = orderDate.getFullYear();
		const month = String(orderDate.getMonth() + 1).padStart(2, '0');
		const day = String(orderDate.getDate()).padStart(2, '0');
		const fdOrderDate = `${year}-${month}-${day}`;
		// console.log(`ordertime ${order.order_time} orderDate ${fdOrderDate} startDate ${startDate} endDate ${endDate}`);
		return fdOrderDate >= startDate && fdOrderDate <= endDate;
	});

	return filteredOrders;
}
