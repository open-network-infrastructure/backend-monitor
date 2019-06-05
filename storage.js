const DATABASE_NAME = 'backend-monitor'

const Influx = require('influx')
const db = new Influx.InfluxDB({
  host: 'localhost',
  database: DATABASE_NAME,
  schema: [
    {
      measurement: 'gateway_status',
      fields: {
        last_seen_timestamp: Influx.FieldType.INTEGER,
        last_seen_offset: Influx.FieldType.INTEGER,
        rx_counter: Influx.FieldType.INTEGER,
        tx_counter: Influx.FieldType.INTEGER,
        region: Influx.FieldType.STRING,
        protocol: Influx.FieldType.STRING
      },
      tags: [
        'gateway_eui'
      ]
    },
    {
      measurement: 'http_services',
      fields: {
        url: Influx.FieldType.STRING,
        status_code: Influx.FieldType.INTEGER,
        timing_total: Influx.FieldType.INTEGER,
        timing_dns: Influx.FieldType.INTEGER,
        timing_firstbyte: Influx.FieldType.INTEGER
      },
      tags: [
        'name'
      ]
    },
    {
      measurement: 'applications',
      fields: {
        device_counter: Influx.FieldType.INTEGER,
        ch_router_gw: Influx.FieldType.BOOLEAN
      },
      tags: [
        'app_id',
        'dev_id'
      ]
    },
  ]
});

async function ensureDatabase() {
  const names = await db.getDatabaseNames();
  if (!names.includes(DATABASE_NAME)) {
    return db.createDatabase(DATABASE_NAME);
  }
}

function writePoints(points) {
  db.writePoints(points).catch(err => {
    console.error(`Error saving data to InfluxDB! ${err.stack}`)
  })
}

module.exports = {
  ensureDatabase,
  writePoints
}