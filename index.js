const HealthCheck = require('./healthCheck')
const config = require('./config')
const storage = require('./storage')
const fetch = require('node-fetch')
const https = require('https')
const timer = require('@szmarczak/http-timer').default

const NOC_API_URL = 'http://noc.thethingsnetwork.org:8085/api/v2/gateways/'
const POLL_INTERVAL_IN_MS = 60 * 3 * 1000
const GATEWAY_GREEN_THRESHOLD_IN_SECONDS = 60 * 3

async function queryGatewayData(gatewayEui) {
  const response = await fetch(NOC_API_URL + gatewayEui)
  const json = await response.json()
  return json
}

async function monitorGateway(eui, protocol, region) {
  console.log(`Checking gateway: ${eui} (${region})`)

  const result = await queryGatewayData(eui)
  const lastSeen = parseInt(result.time / 1000000)
  const seenSecondsAgo = (Date.now() - lastSeen) / 1000

  const state = seenSecondsAgo < GATEWAY_GREEN_THRESHOLD_IN_SECONDS ? 'OK' : 'GONE'; 
  console.log(`Gateway ${eui}=${state}`)

  storage.writePoints([
    {
      measurement: 'gateway_status',
      fields: {
        last_seen_timestamp: lastSeen,
        last_seen_offset: seenSecondsAgo,
        rx_counter: result.rx_ok,
        tx_counter: result.tx_in,
        region: region,
        protocol: protocol
      },
      tags: {
        gateway_eui: eui
      }
    }
  ])
}

function monitorHttpService(serviceName, url) {
  console.log(`Checking HTTP Service: ${serviceName} (${url})`)

  const request = https.get(url)
  const timings = timer(request);

  request.on('response', response => {
    response.on('data', () => { });
    response.on('end', () => {
      storage.writePoints([{
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

function startConfiguredMonitors() {
  console.log(`Starting all configured monitors`)
  console.log(`${Object.keys(config.gateways).length} gateway monitors, ${Object.keys(config.httpServices).length} HTTP services`)

  // Delay is increased 1s per extra check
  // to space out checks between each other
  let delayInMs = 200;

  for (let eui in config.gateways) {
    const healthCheck = new HealthCheck(POLL_INTERVAL_IN_MS, delayInMs)

    healthCheck.onPollInterval(() => {
      monitorGateway(eui, config.gateways[eui].protocol, config.gateways[eui].router);
    })

    delayInMs += 1000;
  }

  for (let serviceName in config.httpServices) {
    const healthCheck = new HealthCheck(POLL_INTERVAL_IN_MS, delayInMs)

    healthCheck.onPollInterval(() => {
      monitorHttpService(serviceName, config.httpServices[serviceName].url);
    })

    delayInMs += 1000;
  }

}

storage.ensureDatabase().then(() => {
  startConfiguredMonitors()
}).catch(err => {
  console.error('Unable to ensure database exists', err)
})
