class Scheduler {
  bufferMaxSecond     = 0
  totalPostponeSecond = 0
  timerId             = null
  moduleConfig        = null

  constructor ( option ) {
    this.moduleConfig = option.moduleConfig;

    this.bufferMaxSecond
      = option.bufferMaxSecond || this.moduleConfig.bufferMaxSecond;
  }

  schedule( task ) {
    clearTimeout( this.timerId );

    if ( this.totalPostponeSecond >= this.bufferMaxSecond ) {
      this.totalPostponeSecond = 0;

      task && task();
    } else {
      this.timerId = setTimeout( () => {
        this.totalPostponeSecond = 0;

        task && task();
      }, 1000 );

      this.totalPostponeSecond++;
    }
  }
}

module.exports = Scheduler;
