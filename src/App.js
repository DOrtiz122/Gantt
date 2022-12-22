import React, { 
  useState, 
  useEffect,
  useMemo, 
  useRef } from 'react';

// Highcharts packages
// import Highcharts from 'highcharts';
import Highcharts, { offset } from 'highcharts/highcharts-gantt';
import HighchartsReact from 'highcharts-react-official';

// Sigma packages
import { client, useConfig, useElementColumns, useElementData } from "@sigmacomputing/plugin";

// configure this for sigma
client.config.configureEditorPanel([
  { name: "source", type: "element" },
  { name: "work orders", type: "column", source: "source", allowMultiple: false },
  { name: "operations", type: "column", source: "source", allowMultiple: false },
  { name: "operation start dates", type: "column", source: "source", allowMultiple: false },
  { name: "operation end dates", type: "column", source: "source", allowMultiple: false },
]);

// Set to 00:00:00:000 today
var today = new Date(),
    day = 1000 * 60 * 60 * 24,
    dateFormat = Highcharts.dateFormat,
    series,
    cars;

today = today.getTime();



// cars array of objects
cars = [{
  model: 'Nissan Leaf',
  current: 0,
  deals: [{
      rentedTo: 'Lisa Star',
      from: today - 1 * day,
      to: today + 2 * day
  }, {
      rentedTo: 'Shane Long',
      from: today - 30 * day,
      to: today - 2 * day
  }, {
      rentedTo: 'Jack Coleman',
      from: today + 5 * day,
      to: today + 6 * day
  }]
}, {
  model: 'Jaguar E-type',
  current: 0,
  deals: [{
      rentedTo: 'Martin Hammond',
      from: today - 2 * day,
      to: today + 1 * day
  }, {
      rentedTo: 'Linda Jackson',
      from: today - 2 * day,
      to: today + 1 * day
  }, {
      rentedTo: 'Robert Sailor',
      from: today + 2 * day,
      to: today + 6 * day
  }]
}];

// Parse car data into series.
series = cars.map(function (car, i) {
  var data = car.deals.map(function (deal) {
      return {
          id: 'deal-' + i,
          rentedTo: deal.rentedTo,
          start: deal.from,
          end: deal.to,
          y: i,
          name: deal.rentedTo
      };
  });
  return {
      name: car.model,
      data: data,
      current: car.deals[car.current]
  };
});


const sigmaObjectBuilder = (wos, ops, starts, ends) => {
  // sort all of the input arrays the same way

  // wos, ops, starts, ends are all ARRAYS from the

  // loop through any of these by length, push to a temp array an objeect of wo, op, start, end
  let list = [];
  for (let i = 0; i < wos.length; i++) {
    list.push({
      start: starts[i],
      end: ends[i],
      wono: wos[i],
      op: ops[i]
    })
  }

  // sort it based on start time
  list.sort((a, b) => a.start - b.start);

  // separate and assign these values back to their original arrays
  for (let i = 0; i < list.length; i++) {
    starts[i] = list[i].start;
    ends[i] = list[i].end;
    wos[i] = list[i].wono;
    ops[i] = list[i].op;
  }

  // obj = { wono, operation, start_time, end_time}. each being an array.
  let obj = {
    wono: wos,
    operation: ops,
    start_time: starts,
    end_time: ends 
  }

  return obj;
}

const sigmaSeriesBuilder = (wos, ops, starts, ends) => {
  
  // first, get the object built and sorted properly
  const obj = sigmaObjectBuilder(wos, ops, starts, ends);
  console.log('OBJECT OBJECT OBJECT', obj);

  // second, create the series array from this

  let arr = [];

  let i = 0;
  let wono_count = 0;

  // declare prev_wono outside
  let prev_wono;
  let newObj;
  
  while (i < obj.wono.length) {

    // base case for the first wono
    if (!prev_wono) {
      prev_wono = obj.wono[i];
      newObj = {
        name: prev_wono,
        data: [],
      }

      // Parent Object in the array
      newObj.data.push({
        name: prev_wono,
        id: 'wono-' + wono_count.toString(),
        pointWidth: 3,
        start: obj.start_time[0],
        end: obj.end_time.at(-1)
      })
    }
    
    let curr_wono = obj.wono[i];
    // if prev wono and curr_wono are different,
    // we are at a new wono
    if (prev_wono !== curr_wono) {
      wono_count++;
      arr.push(newObj);
      newObj = {
        name: curr_wono,
        data: [],
      }
      // reset prev_wono
      prev_wono = curr_wono;

      // Add the parent object to newObj data array
      newObj.data.push({
        name: curr_wono,
        id: 'wono-' + wono_count.toString(),
        pointWidth: 3,
      })
    } else {
      // we are in the same wono still
      // so we want to add to the data key
      let dataObj = {
        parent: 'wono-' + wono_count.toString(),
        name: obj.operation[i],
        start: obj.start_time[i],
        end: obj.end_time[i],
      }
      // add the new data object to the array
      newObj.data.push(dataObj);
      i++;
    }
  }

  // push last newObj to the arr
  arr.push(newObj)

  console.log(arr);
  return arr;
}

const getGanttPayload = (config, sigmaData) => {
  // this is where I will actually do the bulk of the app
  const source = config.source;
  const key_work_orders = config['work orders'];
  const key_operations = config['operations'];
  const key_ops_start = config['operation start dates'];
  const key_ops_end = config['operation end dates'];

  if (!source || !key_work_orders || !key_operations || !key_ops_start || !key_ops_end || Object.keys(sigmaData).length === 0) return null;
  
  const series = sigmaSeriesBuilder(sigmaData[key_work_orders], sigmaData[key_operations], sigmaData[key_ops_start], sigmaData[key_ops_end]);

  if (series) {
    var newOptions = {
      series: series,
      tooltip: {
        pointFormat: '<span>Operation: {point.name}</span><br/><span>From: {point.start:%b %e, %I:%M %P}</span><br/><span>To: {point.end:%b %e, %I:%M %P}</span>'
      },
      navigator: {
        enabled: true,
      },
      scrollbar: {
        enabled: true
      },
      rangeSelector: {
        enabled: true,
      },
      yAxis: {
        type: 'treegrid',
        uniqueNames: true,
        staticScale: 35,
      },
    }

    // setOptions(newOptions);
    return newOptions;
  }

  return series;
}

// Function to check if the config file returned back data
const allDimensions = (config) => { 
  if (!config['operations'] || !config['work orders'] || !config['operation start dates'] || !config['operation end dates']) {
    return false;
  }
  return true;
}

// This will be the main function for the app.
// In here, we will:
// Connect to Sigma, get data, use useEffect, use useMemo, etc. 
// Refer to https://github.com/ja2z/sigma-sample-plugins/blob/main/narrativescience-quill/src/App.js
const useGetGanttData = () => {
  const config = useConfig();
  const sigmaData = useElementData(config.source);
  // const payLoad = useMemo(() => getGanttPayload(config, sigmaData), [config, sigmaData]);
  // console.log('Config', config);
  // console.log('sigmaData', sigmaData);
  const [res, setRes] = useState(null);

  useEffect(() => {
    // if (!payLoad) return null;
    if (!allDimensions(config)) return false;

    setRes(getGanttPayload(config, sigmaData));
    // setRes(payLoad);

    // in here I want to set Res
  }, [config, sigmaData]);

  return res;
}


// This will be the new app declaration
const App = () => {
  const res = useGetGanttData();
  console.log('Res is ', res);
  return (
    res && <HighchartsReact highcharts={Highcharts} constructorType={"ganttChart"} options={res}/>
  );
}
export default App;