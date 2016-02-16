import Ember from 'ember';

export default Ember.Service.extend({
  now: null,
  hour: null,
  currentOffset: 0,
  useRemoteTimestamp: false,
  remoteSyncFrequency: 60,
  timestampEndpoint: null,
  timestampProperty: null,
  
  init: function() {
    this._loadConfigAndStartTimers();
  },

  _loadConfigAndStartTimers: function() {
    var config = this.container.lookupFactory('config:environment')['ticktockOptions'];

    if (config && config.remoteSyncFrequency) {
      Ember.set(this, 'remoteSyncFrequency', config.remoteSyncFrequency);
    }

    if (config && config.timestampEndpoint) {
      Ember.set(this, 'timestampEndpoint', config.timestampEndpoint);
    }

    if (config && config.timestampProperty) {
      Ember.set(this, 'timestampProperty', config.timestampProperty);
    }

    if (config && config.useRemoteTimestamp) {
      Ember.set(this, 'useRemoteTimestamp', config.useRemoteTimestamp);
      this._setServerTime();
    }

    this._setCurrentTime();
  },
  
  _syncServerLoop: function() {
    var frequency = Ember.get(this, 'remoteSyncFrequency');
    Ember.run.later(this, this._setServerTime, (frequency * 1000));
  },
  
  _syncLocalLoop: function() {
    Ember.run.later(this, this._setCurrentTime, 1000);
    Ember.run.later(this, this._setCurrentHour, 3600);
  },
  
  _setServerTime: function() {
    var _this = this;

    Ember.$.ajax(_this.timestampEndpoint, {
      type: 'GET',
      success: function(data) {
        var currentServerTime = data[_this.timestampProperty];
        var currentLocalTime  = moment().unix();
        var serverTime        = parseInt(currentServerTime);
        var serverOffset      = serverTime - parseInt(currentLocalTime);

        Ember.set(_this, 'currentOffset', serverOffset);
      }
    });

    this._syncServerLoop();
  },
  
  _setCurrentTime: function() {
    var now = moment().unix();
    
    if (Ember.get(this, 'useRemoteTimestamp')) {
      now += Ember.get(this, 'currentOffset');
    }

    now = moment.unix(now);
    Ember.set(this, 'now', now);

    this._syncLocalLoop();
  }
  
  _setCurrentHour: function() {
    var hour = moment('HH').unix();
    
    if (Ember.get(this, 'useRemoteTimestamp')) {
      hour += Ember.get(this, 'currentOffset');
    }

    hour = moment.unix(hour);
    Ember.set(this, 'hour', hour);

    this._syncLocalLoop();
  }
});
