const PRODUCTION_API_URL = 'https://ai-dashboard-production-c844.up.railway.app';

function resolveApiUrl() {
	const explicitApiUrl = import.meta.env.VITE_API_URL;
	if (explicitApiUrl) return explicitApiUrl;

	if (typeof window !== 'undefined') {
		const { hostname } = window.location;
		if (hostname === 'localhost' || hostname === '127.0.0.1') {
			return 'http://localhost:5000';
		}
	}

	return PRODUCTION_API_URL;
}

export const API_URL = resolveApiUrl();
