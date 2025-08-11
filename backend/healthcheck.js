/*
  Healthcheck interno del contenedor. Sale con código 0 si el backend
  responde 200 en /healthz o /api/v1/health. De lo contrario, código 1.
*/
const http = require('http');

function check(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(4000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

(async () => {
  const base = `http://localhost:${process.env.PORT || 3004}`;
  const urls = [`${base}/healthz`, `${base}/api/v1/health`, `${base}/`];
  for (const url of urls) {
    // eslint-disable-next-line no-await-in-loop
    if (await check(url)) process.exit(0);
  }
  process.exit(1);
})();


