import data from '../data/iptv_ready'
import preprocessed from '../data/preprocessed'
import { intersection, cloneDeep } from 'lodash'
import {DAYS_IN_MSEC, HOURS_IN_MSEC, MINUTES_IN_MSEC} from "../consts/timeConsts";

export const loadData = () => {
  return data;
};

const computeStatsUntilTimestamp = (data, baseStats, timestamp) => {
  let index = baseStats.dataIndex + 1;
  const stats = cloneDeep(baseStats);

  // todo: can be for cycle
  while (index < data.length && data[index].timestamp < timestamp) {
    // channel switch
    const item = data[index];
    const prev = stats.hosts[item.host];

    stats.hosts[item.host] = item['igmp_ip'];

    // get it out of channel if it was watching it during this time
    if (prev) {
      stats.channels[prev] = stats.channels[prev].filter(host => host !== item.host);

      // delete channels with no viewers
      if (!stats.channels[prev].length) {
        delete stats.channels[prev]
      }
    }

    // remove turned off channels
    if (item['igmp_ip'] === '0.0.0.0') {
      delete stats.hosts[item.host];
    }

    // add it to channels
    if (!stats.channels[item['igmp_ip']]) {
      stats.channels[item['igmp_ip']] = [item.host]
    } else {
      stats.channels[item['igmp_ip']].push(item.host)
    }

    index++;
  }

  // we have processed the data up until this index & timestamp
  stats.dataIndex = index - 1;
  stats.timestamp = data[stats.dataIndex].timestamp;

  if (stats.channels['0.0.0.0']) {
    delete stats.channels['0.0.0.0'];
  }

  return stats
};

export const prepareStats = (data) => {
  const start = new Date().getTime();

  let step = HOURS_IN_MSEC;
  let lastTimestamp = data[0].timestamp;
  let ret = [{ timestamp: lastTimestamp, hosts: {}, channels: {}, dataIndex: 0 }];

  let nextTimestamp = data[0].timestamp + step;
  let endTimestamp = data[data.length - 1].timestamp;

  // TODO: this potentially cuts off some data
  // TODO: can be a for cycle
  while (nextTimestamp < endTimestamp) {
    ret.push(computeStatsUntilTimestamp(data, ret[ret.length - 1], nextTimestamp));
    nextTimestamp += step;
  }

  const end = new Date().getTime();
  console.log(`STATS: Seconds elapsed for data processing: ${(end - start) / 1000}`);
  return ret;
};

const getStepFromTimespan = (timespan) => {
  if (timespan < HOURS_IN_MSEC) {
    return MINUTES_IN_MSEC * 5;
  }

  if (timespan < 2 * DAYS_IN_MSEC) {
    return HOURS_IN_MSEC;
  }

  if (timespan < 6 * DAYS_IN_MSEC) {
    return 6 * HOURS_IN_MSEC;
  }

  return DAYS_IN_MSEC;
};

export const getStringTimeAxisRepresentations = (d, timespan) => {
    if (timespan < 24 * HOURS_IN_MSEC) {
      return `${d.getHours()}:${!d.getMinutes() ? '00' : d.getMinutes()}`
    }

    return `${d.getDate()}. ${d.getMonth()}.${d.getHours()}:00`
  };

export const getSingleChannelViewerCountOverDay = (precomputed, timestamps, channel, from, to) => {
  const step = getStepFromTimespan(to - from);
  const stats = [];

  for(let timestamp = from.valueOf(); timestamp <= to.valueOf() ; timestamp += step) {
    const timestampStats = computeTimestampStats(precomputed, timestamps, timestamp);

    stats.push({
      date: timestampStats.timestamp,
      count: timestampStats.channels[channel]
        ? timestampStats.channels[channel].length
        : 0
    });
  }

  return stats
};

const computeViewerSwitch = (prev=[], curr=[]) => {
  const stableViewers = intersection(prev, curr); // which viewers stayed watching the channel
  return {to: curr.length - stableViewers.length, from: prev.length - stableViewers.length}
};

export const getSingleChannelViewSwitchStatistics = (data, timestamps, ip, from, to) => {
  const step = getStepFromTimespan(to - from);
  const stats = [];

  let timestamp = from.valueOf();
  let prev = computeTimestampStats(data, timestamps, timestamp);

  for(; timestamp <= to.valueOf() ; timestamp += step) {
    const now = computeTimestampStats(data, timestamps, timestamp + step);

    const switchData = computeViewerSwitch(prev.channels[ip], now.channels[ip]);

    stats.push({
      timestamp: timestamp + step,
      changedTo: switchData.to,
      changedFrom: switchData.from,
    });

    prev = now;
  }

  return stats
};

export const getSingleTimestampCurrentViewersStatistics = (data, selectedHosts, selectedChannels, {gt, lt}) => {
  const selectedHostsIps = Object.keys(selectedHosts);

  return Object.keys(data.channels)
    .filter(channel => selectedChannels.includes(channel))
    .map(channel => ({
      channel: channel,
      count: data.channels[channel].length,
      isWatchedBySelected: data.channels[channel].some(host => selectedHostsIps.includes(ipToLocation(host))),
      watchedBy: data.channels[channel]
        .map(host => ipToLocation(host))
        .reduce((acc, val) => {
          if (!acc[val]) {
            acc[val] = 0
          }

          acc[val]++;
          return acc;
        }, {})
    }))
    .filter(channel => channel.count !== 0 && (gt === undefined || channel.count > gt) && (lt === undefined || channel.count < lt))
};


export const getSingleTimestampViewSwitchStatistics = (prev, curr, selectedHosts, selectedChannels, {gt, lt}) => {
  const selectedHostsIps = Object.keys(selectedHosts);

  return Object.keys(curr.channels)
    .filter(channel => selectedChannels.includes(channel))
    .map(channel => ({
      channel: channel,
      count: prev && prev.channels[channel]
        ? prev.channels[channel].length - curr.channels[channel].length
        : curr.channels[channel].length,
      isWatchedBySelected: curr.channels[channel].some(host => selectedHostsIps.includes(ipToLocation(host))),
      watchedBy: curr.channels[channel]
        .map(host => ipToLocation(host))
        .reduce((acc, val) => {
          if (!acc[val]) {
            acc[val] = 0
          }

          acc[val]++;
          return acc;
        }, {})
    }))
    .filter(channel => channel.count !== 0 && (gt === undefined || channel.count > gt) && (lt === undefined || channel.count < lt))
};

const ipToLocation = (ip) => ip.split(".").slice(0, 3).join('.');

export const aggregateLocationViewership = (data, locations, showInactiveLocations) => {
  let base = {};

  if (showInactiveLocations) {
    locations.forEach(loc => base[loc] = 0);
  }

  const counter = Object.keys(data.hosts).reduce((acc, host) => {
    const location = ipToLocation(host);


    if (acc[location]) {
      acc[location]++
    } else {
      acc[location] = 1
    }

    return acc
  }, base);

  return Object.keys(counter).map(key => ({ location: key, count: counter[key] }));
};

const getClosestComputedTimestamp = (data, timestamp) => {
  let i = 0;

  for ( ; i < data.length; i++) {
    if (data[i].timestamp > timestamp)
      break
  }

  return data[i ? i - 1 : i]
};

export const computeTimestampStats = (data, timestamps, t) => {
  return computeStatsUntilTimestamp(timestamps, getClosestComputedTimestamp(data, t), t);
};

export const objectValuesToString = (obj) => Object.values(obj).join(" ");

export const extractAllChannelIps = (data) => {
  return data.reduce((acc, d) => {
    Object.keys(d.channels).forEach(channel => {
      !acc.includes(channel) && acc.push(channel);
    });

    return acc
  }, [])
};

export const extractAllLocationIps = (data) => {
  return data.reduce((acc, d) => {
    Object.keys(d.hosts).forEach(host => {
      !acc.includes(ipToLocation(host)) && acc.push(ipToLocation(host));
    });

    return acc
  }, [])
};
