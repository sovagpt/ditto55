export default async function handler(req, res) {
  const url = req.query.url;
  
  const fetchOptions = {
    method: req.method,
    headers: {
      'Authorization': `Bearer ${process.env.MESHY_API_KEY}`
    }
  };

  if (req.method === 'POST') {
    fetchOptions.body = req.body;
    fetchOptions.headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, fetchOptions);
  const contentType = response.headers.get('content-type');
  res.setHeader('Content-Type', contentType);

  if (contentType.includes('application/json')) {
    const data = await response.json();
    res.json(data);
  } else {
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  }
}