const fetch = require('node-fetch')

const NOC_API_URL = 'http://noc.thethingsnetwork.org:8085/api/v2/gateways/'
const GATEWAY_GREEN_THRESHOLD_IN_SECONDS = 60 * 3


async function queryGatewayData(gatewayEui) {
  const response = await fetch(NOC_API_URL + gatewayEui)
  const json = await response.json()
  return json
}

async function check(eui, protocol, region, callback) {
  console.log(`Checking gateway: ${eui} (${region})`)

  const result = await queryGatewayData(eui)
  const lastSeen = parseInt(result.time / 1000000)
  const seenSecondsAgo = (Date.now() - lastSeen) / 1000

  const state = seenSecondsAgo < GATEWAY_GREEN_THRESHOLD_IN_SECONDS ? 'OK' : 'GONE';
  console.log(`Gateway ${eui}=${state}`)

  callback([
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

module.exports = {
  check
}