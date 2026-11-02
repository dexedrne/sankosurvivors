// Link-preview probe: link-preview crawlers (Telegram, Discord, Twitter, Facebook) get the same page, and we log that
// they came, so a missing preview can be traced to "never asked" or "asked and got this".
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'));
module.exports = (req, res) => {
  console.log('PREVIEW-CRAWLER', JSON.stringify({ ua: req.headers['user-agent'], ip: req.headers['x-forwarded-for'], url: req.url, accept: req.headers.accept, enc: req.headers['accept-encoding'] }));
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.end(html);
};
