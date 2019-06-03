const EventEmitter = require('events')

class HealthCheck extends EventEmitter {
  constructor(pollInterval = 100, initialDelay = 200) {
    super();
    this.pollInterval = pollInterval;
    this.onPollInterval(this.poll);
    setTimeout(() => {
      this.emit('poll');
    }, initialDelay)
  }

  poll() {
    setTimeout(() => {
      this.emit('poll')
    }, this.pollInterval);
  }

  onPollInterval(cb) {
    this.on('poll', cb);
  }
}

module.exports = HealthCheck
