export default async function handler(req, res) {
 const url = req.query.url;
 
 const fetchOptions = {
   method: req.method,
   headers: {
     'Authorization': `Bearer ${process.env.MESHY_API_KEY}`,
     'Accept': 'model/gltf-binary'
   }
 };

 if (req.method === 'POST') {
   fetchOptions.headers['Content-Type'] = 'application/json';
   fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
 }

 try {
   const response = await fetch(url, fetchOptions);
   const contentType = response.headers.get('content-type');
   
   res.setHeader('Content-Type', contentType || 'model/gltf-binary');
   
   if (contentType?.includes('application/json')) {
     const data = await response.json();
     res.json(data);
   } else {
     const buffer = await response.arrayBuffer();
     res.send(Buffer.from(buffer));
   }
 } catch (error) {
   res.status(500).json({ error: error.message });
 }
}