const https = require('https')
const timer = require('@szmarczak/http-timer').default

function check(serviceName, url, callback) {
  console.log(`Checking HTTP Service: ${serviceName} (${url})`)

  const request = https.get(url)
  const timings = timer(request);

  request.on('response', response => {
    response.on('data', () => { });
    response.on('end', () => {
      callback([{
        measurement: 'http_services',
        tags: { name: serviceName },
        fields: {
          url: url,
          status_code: response.statusCode,
          timing_total: timings.phases.total,
          timing_dns: timings.phases.dns,
          timing_firstbyte: timings.phases.firstByte
        }
      }])
      console.log(`Check completed: ${serviceName}=${response.statusCode}`)
    });
  });
}

module.exports = {
  check
}