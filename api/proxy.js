export default async function handler(req, res) {
    const url = req.query.url;
    
    // Start with headers from the original request
    const headers = { ...req.headers };
    delete headers.host; // Remove host header as it should not be forwarded
    
    const fetchOptions = {
        method: req.method,
        headers: headers
    };

    // Use the Authorization header from the request instead of hardcoding
    if (req.headers.authorization) {
        fetchOptions.headers.authorization = req.headers.authorization;
    }

    if (req.method === 'POST') {
        if (headers['content-type']?.includes('multipart/form-data')) {
            // For file uploads, pass through the raw body and headers
            fetchOptions.body = req.body;
        } else {
            // For JSON requests, ensure proper content type
            fetchOptions.headers['content-type'] = 'application/json';
            fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        }
    }

    try {
        console.log('Proxy request to:', url);
        console.log('Fetch options:', {
            method: fetchOptions.method,
            headers: fetchOptions.headers,
            bodyPreview: fetchOptions.body ? JSON.parse(fetchOptions.body) : null
        });

        const response = await fetch(url, fetchOptions);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Proxy error response:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });
            return res.status(response.status).json({
                error: 'API request failed',
                status: response.status,
                message: errorText
            });
        }

        const contentType = response.headers.get('content-type');
        res.setHeader('Content-Type', contentType || 'application/json');
        
        if (contentType?.includes('application/json')) {
            const data = await response.json();
            console.log('Successful JSON response:', data);
            res.json(data);
        } else {
            const buffer = await response.arrayBuffer();
            res.send(Buffer.from(buffer));
        }
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ 
            error: 'Proxy request failed',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}