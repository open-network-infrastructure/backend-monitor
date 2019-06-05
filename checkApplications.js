const { data } = require('ttn');
const config = require('./config')

// This is not a comprehensive list of all CH gateways
// Only a filter of known gateways to ensure the app check
// is meaningful with respect to availability of the swiss backend in particular.
const chRouterGateways = Object.entries(config.gateways).filter((item, _) => item[1].router === 'ch').map(item => item[0])

async function check(appID, accessKey, uplinkHandler) {
  console.log(`Starting monitor for appID ${appID}`)

  const client = await data(appID, accessKey)
  client.on('uplink', (devID, payload) => {
    const receivedByChGW = payload.metadata.gateways
      .map(g => g.gtw_id)
      .some(rg => chRouterGateways.includes(rg));

    console.log(`Received message on app ${appID} by CH router gateway=${receivedByChGW}`)

    points = [{
      measurement: 'applications',
      tags: {
        dev_id: devID,
        app_id: appID
      },
      fields: {
        device_counter: payload.counter,
        ch_router_gw: receivedByChGW
      }
    }]
    uplinkHandler(points)
  })
}

module.exports = {
  check
}
