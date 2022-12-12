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

// Set to 00:00:00:000 today
// today.setUTCHours(0);
// today.setUTCMinutes(0);
// today.setUTCSeconds(0);
// today.setUTCMilliseconds(0);
today = today.getTime();
console.log('hello');

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
      from: today - 3 * day,
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
}, {
  model: 'Volvo V60',
  current: 0,
  deals: [{
      rentedTo: 'Mona Ricci',
      from: today + 0 * day,
      to: today + 3 * day
  }, {
      rentedTo: 'Jane Dockerman',
      from: today + 3 * day,
      to: today + 4 * day
  }, {
      rentedTo: 'Bob Shurro',
      from: today + 6 * day,
      to: today + 8 * day
  }]
}, {
  model: 'Volkswagen Golf',
  current: 0,
  deals: [{
      rentedTo: 'Hailie Marshall',
      from: today - 1 * day,
      to: today + 1 * day
  }, {
      rentedTo: 'Morgan Nicholson',
      from: today - 3 * day,
      to: today - 2 * day
  }, {
      rentedTo: 'William Harriet',
      from: today + 2 * day,
      to: today + 3 * day
  }]
}, {
  model: 'Peugeot 208',
  current: 0,
  deals: [{
      rentedTo: 'Harry Peterson',
      from: today - 1 * day,
      to: today + 2 * day
  }, {
      rentedTo: 'Emma Wilson',
      from: today + 3 * day,
      to: today + 4 * day
  }, {
      rentedTo: 'Ron Donald',
      from: today + 5 * day,
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

  const [options] = useState({
    series: series,
    plotOptions: {
      series: {
          dataLabels: {
              enabled: true,
              format: '{point.name}',
              style: {
                  fontWeight: 'normal'
              }
          }
      }
  },
  tooltip: {
      pointFormat: '<span>Rented To: {point.rentedTo}</span><br/><span>From: {point.start:%e. %b %I:%M}</span><br/><span>To: {point.end:%e. %b %I:%M}</span>'
  },
  accessibility: {
      keyboardNavigation: {
          seriesNavigation: {
              mode: 'serialize'
          }
      },
      point: {
          valueDescriptionFormat: 'Rented to {point.rentedTo} from {point.x:%A, %B %e %I:%M} to {point.x2:%A, %B %e %I:%M}.'
      },
      series: {
          descriptionFormatter: function (series) {
              return series.name + ', car ' + (series.index + 1) + ' of ' + series.chart.series.length + '.';
          }
      }
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
                  text: 'Rented To'
              },
              categories: series.map(function (s) {
                  return s.current.rentedTo;
              })
          }, {
              title: {
                  text: 'From'
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