function toCamelCase(str: string): string {
	return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

export function convertSnakeToCamel(obj: any): any {
	console.log('DEBUG converter: called with:', typeof obj, Array.isArray(obj) ? 'array' : 'object');
	
	if (obj === null || obj === undefined) return obj;
	
	if (Array.isArray(obj)) {
		return obj.map(convertSnakeToCamel);
	}
	
	if (typeof obj !== 'object') {
		return obj;
	}
	
	const converted: any = {};
	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			const camelKey = toCamelCase(key);
			converted[camelKey] = convertSnakeToCamel(obj[key]);
		}
	}
	return converted;
}
