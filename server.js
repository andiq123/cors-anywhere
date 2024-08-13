const CronJob = require('cron').CronJob;
// Listen on a specific host via the HOST environment variable
const host = process.env.HOST || '0.0.0.0';
// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 8080;

const originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
const originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST);
const parseEnvList = (env) => {
  if (!env) {
    return [];
  }
  return env.split(',');
};

// Set up rate-limiting to avoid abuse of the public CORS Anywhere server.
const checkRateLimit = require('./lib/rate-limit')(
  process.env.CORSANYWHERE_RATELIMIT
);

const job = CronJob.from({
  cronTime: '*/10 * * * *',
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
    originBlacklist: originBlacklist,
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
  .listen(port, host, function () {
    process.env.CORSANYWHERE_WHITELIST;
    console.log('Running CORS Anywhere on ' + host + ':' + port);
  });
