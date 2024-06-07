const nsUtil = {
	taipeiTimeString: (now: Date) => {
		const dateStr = now.toLocaleDateString("zh-TW");
		const timeStr = now.toLocaleTimeString("zh-TW");
		return `${dateStr} ${timeStr}`;
	},
};
export default nsUtil;
