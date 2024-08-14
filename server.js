const host = process.env.HOST || '0.0.0.0';

var port = process.env.PORT || 8080;
const parseEnvList = (env) => {
  if (!env) {
    return [];
  }
  const data = env.split(',');
  console.log(data);
  return data;
};

const originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST);

const checkRateLimit = require('./lib/rate-limit')(
  process.env.CORSANYWHERE_RATELIMIT
);

const CronJob = require('cron').CronJob;
const job = CronJob.from({
  cronTime: '*/30 * * * *',
  onTick: async () => {
    await fetch(process.env.BACK_API + '/api/wake');
  },
  start: true,
  timeZone: 'America/Los_Angeles',
});

job.start();

const cors_proxy = require('./lib/cors-anywhere');
cors_proxy
  .createServer({
    originWhitelist: originWhitelist,
    checkRateLimit: checkRateLimit,
    removeHeaders: [
      'cookie',
      'cookie2',
      'x-request-start',
      'x-request-id',
      'via',
      'connect-time',
      'total-route-time',
    ],
    redirectSameOrigin: true,
    httpProxyOptions: {
      xfwd: false,
    },
  })
  .listen(port, host, () => {
    console.log('Running CORS Anywhere on ' + host + ':' + port);
  });
