import React, { 
  useState, 
  useEffect,
  useMemo, 
  useRef } from 'react';

// Highcharts packages
// import Highcharts from 'highcharts';
import Highcharts from 'highcharts/highcharts-gantt';
import HighchartsReact from 'highcharts-react-official';

// Sigma packages
import { client, useConfig, useElementData } from "@sigmacomputing/plugin";

// configure this for sigma
client.config.configureEditorPanel([
  { name: "source", type: "element" },
  { name: "dimension", type: "column", source: "source", allowMultiple: true },
  { name: "measures", type: "column", source: "source", allowMultiple: true },
]);

// Set to 00:00:00:000 today
var today = new Date(),
    day = 1000 * 60 * 60 * 24,
    dateFormat = Highcharts.dateFormat,
    series,
    cars;

today = today.getTime();
console.log('HELLO');



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

const App = () => {

  // Sigma stuff
  const config = useConfig();
  const sigmaData = useElementData(config.source);
  
  // Config is the dimensions and measures we selected for the source. 
  // They are hashed so i have to reference them in a really annoying manner by checking what is what and going from there.
  // config.dimension is an array that I need to loop through.
  // config.measures also an array of length 1. it contains the string value key for the end times. 
  // The strategy here is to know for sure what one of these key values is, thanks to the hashing
  console.log(config);
  
  // sigmaData is the object of arrays that contain data. The key value is each one of the values from 
  console.log(sigmaData);
  console.log(series);

  const [options] = useState({
  series: series,
  tooltip: {
      pointFormat: '<span>Rented To: {point.rentedTo}</span><br/><span>From: {point.start:%e. %b %I:%M}</span><br/><span>To: {point.end:%e. %b %I:%M}</span>'
  },
  // This right here is the range bar and navigator, which is looking great. Lots of additional customizations can be made here however
  navigator: {
    enabled: true
  },
  scrollbar: {
    enabled: true
  },
  rangeSelector: {
    enabled: true,
    selected: 0
  },
  // This below keeps an indicator line for the current time
  xAxis: {
      currentDateIndicator: true
  },
  yAxis: {
      type: 'category',
      grid: {
          columns: [{
              title: {
                  text: 'Work Order'
              },
              categories: series.map(function (s) {
                  return s.name;
              })
          }, {
              title: {
                  text: 'Current Stage'
              },
              categories: series.map(function (s) {
                  return s.current.rentedTo;
              })
          }, {
              title: {
                  text: 'Start'
              },
              categories: series.map(function (s) {
                  return dateFormat('%e. %b', s.current.from);
              })
          }]
      }
  }
  })

  return (
    <HighchartsReact
      highcharts={Highcharts}
      constructorType={"ganttChart"}
      options={options}
    />
  );
};


export default App;