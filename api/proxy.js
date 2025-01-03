export default async function handler(req, res) {
  const url = req.query.url;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${process.env.MESHY_API_KEY}`
    }
  });
  const data = await response.blob();
  const contentType = response.headers.get('content-type');
  res.setHeader('Content-Type', contentType);
  res.send(data);
}