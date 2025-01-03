export default async function handler(req, res) {
  const url = req.query.url;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${process.env.MESHY_API_KEY}`,
      'Accept': 'model/gltf-binary'
    }
  });
  const arrayBuffer = await response.arrayBuffer();
  res.setHeader('Content-Type', 'model/gltf-binary');
  res.send(Buffer.from(arrayBuffer));
}