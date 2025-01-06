export default async function handler(req, res) {
    const url = req.query.url;
    
    const fetchOptions = {
        method: req.method,
        headers: {
            'Authorization': `Bearer ${process.env.MESHY_API_KEY}`
        }
    };

    if (req.method === 'POST') {
        if (req.headers['content-type']?.includes('multipart/form-data')) {
            // For file uploads, pass through the raw body and headers
            fetchOptions.body = req.body;
            fetchOptions.headers['Content-Type'] = req.headers['content-type'];
        } else {
            // For JSON requests
            fetchOptions.headers['Content-Type'] = 'application/json';
            fetchOptions.headers['Accept'] = 'application/json';
            fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        }
    }

    try {
        console.log('Proxy request to:', url);
        const response = await fetch(url, fetchOptions);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Proxy error:', errorText);
            throw new Error(`API request failed: ${response.status} ${errorText}`);
        }

        const contentType = response.headers.get('content-type');
        res.setHeader('Content-Type', contentType || 'application/json');
        
        if (contentType?.includes('application/json')) {
            const data = await response.json();
            res.json(data);
        } else {
            const buffer = await response.arrayBuffer();
            res.send(Buffer.from(buffer));
        }
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: error.message });
    }
}