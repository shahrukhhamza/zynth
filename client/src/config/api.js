const LOCAL_API_URL = 'http://localhost:5000';

function resolveApiUrl() {
	const explicitApiUrl = import.meta.env.VITE_API_URL;
	if (explicitApiUrl) return explicitApiUrl;

	if (typeof window !== 'undefined') {
		const { hostname } = window.location;
		if (hostname === 'localhost' || hostname === '127.0.0.1') {
			return LOCAL_API_URL;
		}

		// Production fallback: use same-origin API when deployed behind one domain.
		return window.location.origin;
	}

	return LOCAL_API_URL;
}

export const API_URL = resolveApiUrl();
