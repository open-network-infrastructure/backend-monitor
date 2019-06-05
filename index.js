const HealthCheck = require('./healthCheck')
const storage = require('./storage')
const gatewayMonitor = require('./checkGateways')
const httpServiceMonitor = require('./checkHttpServices')
const appMonitor = require('./checkApplications')
const config = require('./config')
const env = require('./.env')

const POLL_INTERVAL_IN_MS = 60 * 3 * 1000

function startConfiguredMonitors() {
  console.log(`Starting all configured monitors`)
  console.log(`${Object.keys(config.gateways).length} gateway monitors, ${Object.keys(config.httpServices).length} HTTP services`)

  // Delay is increased 1s per extra check
  // to space out checks between each other
  let delayInMs = 200;

  for (let eui in config.gateways) {
    const healthCheck = new HealthCheck(POLL_INTERVAL_IN_MS, delayInMs)

    healthCheck.onPollInterval(() => {
      gatewayMonitor.check(eui,
        config.gateways[eui].protocol,
        config.gateways[eui].router,
        storage.writePoints)
    })

    delayInMs += 1000;
  }

  for (let serviceName in config.httpServices) {
    const healthCheck = new HealthCheck(POLL_INTERVAL_IN_MS, delayInMs)

    healthCheck.onPollInterval(() => {
      httpServiceMonitor.check(serviceName,
        config.httpServices[serviceName].url,
        storage.writePoints)
    })

    delayInMs += 1000;
  }

  for (let appId in env.applications) {
    let accessKey = env.applications[appId]
    appMonitor.check(appId, accessKey, storage.writePoints)
  }

}

storage.ensureDatabase().then(() => {
  startConfiguredMonitors()
}).catch(err => {
  console.error('Unable to ensure database exists', err)
})
