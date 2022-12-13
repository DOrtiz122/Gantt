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

var input_gantt_data = {
  operation: [
    "CUT-CNC",
    "FINAL INSPECTION",
    "INPROCESS INSPECT",
    "LABEL-PRINT",
    "PACKAGING",
    "QA_FAI",
    "RINSE-ULTRASONIC",
    "TEST-HE LEAK",
    "WELD-UHP ORBITAL"
  ],
  wono: [
    '001000205304',
    '001000205304',
    '001000205304',
    '001000205304',
    '001000205304',
    '001000205304',
    '001000205304',
    '001000205304',
    '001000205304'
  ],
  wono_start_datetime: [
    1665566604000, 
    1665566604000, 
    1665566604000, 
    1665566604000, 
    1665566604000, 
    1665566604000, 
    1665566604000, 
    1665566604000, 
    1665566604000
  ],
  op_start_datetime: [
    1665578756000, 
    1666289067000, 
    1666192095000, 
    1666193098000, 
    1666273932000, 
    1667323519000, 
    1665599789000, 
    1666192225000, 
    1666191841000
  ],
  op_end_datetime: [
    1665579897000, 
    1666291831000, 
    1666192129000, 
    1666193403000, 
    1666273967000, 
    1668010223000, 
    1665599932000, 
    1666192314000, 
    1666191879000
  ],
  op_duration: [
    1141, 
    2764, 
    34, 
    305, 
    35, 
    686704, 
    143, 
    89, 
    38
  ]
}

// THIS IS THE BRANCH WHERE WILL WE CONNECT TO SIGMA DATA

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
  // console.log(config);
  
  // sigmaData is the object of arrays that contain data. The key value is each one of the values from 
  // console.log(sigmaData);
  // console.log(series);

  const options = useMemo(() => {
    const dimensions = config.dimension;
    const measures = config.measures;

    if (!(dimensions && measures)) return false;

    // data object 
    var sigmaObj = {
      end_time: sigmaData[config.measures[0]]
    }

    // build data object first
    const sigmaObjectBuilder = () => {
      for (var i = 0; i < config.dimension.length; i++) {
        var first_val = sigmaData[config.dimension[i]][0];
        if (typeof first_val !== 'string') {
          // this is start_times
          sigmaObj.start_time = sigmaData[config.dimension[i]];
        } else {
          // it is either wono or operation
          // can convert the string to a number and back to an int. if same value, it is wono. if not, it is operation.
          // convert string # to int
          var temp = parseInt(first_val);
          console.log('temp to string ', temp.toString());
          console.log('first val ', first_val);
          if (first_val === '00' + temp.toString()) {
            // this is wono bc the values are the same before and after, meaning it was an int
            sigmaObj.wono = sigmaData[config.dimension[i]];
          } else {
            // not the same before and after, therefor it was a string operation
            sigmaObj.operation = sigmaData[config.dimension[i]];
          }
        }
      }
    }

    if (sigmaData?.[dimensions[0]]) {
      sigmaObjectBuilder();
    }

    console.log('Sigma Object', sigmaObj)

    const options = {
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
    }
  
  }, [config, sigmaData]);

  // Figure out which remaining 3 columns are which. Save these values to an array.
  // var wonos, operation, start_times;
  // look through config.dimension array to do this.
  // ask if sigmaData[config.dimension[i]][0] is a string or int. if it is a string, it is either operation or wono. if it is not a string, it is start time
  
  // nice thing is these are in order so we shouldn't have to worry about lining these back up 

  
  return (
    <div>
      <p>
        Dev Branch
      </p>
      {options && 
      <HighchartsReact
      highcharts={Highcharts}
      constructorType={"ganttChart"}
      options={options}
    />}
    </div>

  );
};


export default App;