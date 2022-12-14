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

// ------------------------------------------------------------------------------------
// This branch serves to be the refactored codebase

// The motivation for this is to:
// 1. Have page load correctly
// 2. input data switches reload the data and displays properly
// 3. decrease unfamiliarity with useMemo hook
// ------------------------------------------------------------------------------------

// cars array of objects
// cars = [{
//   model: 'Nissan Leaf',
//   current: 0,
//   deals: [{
//       rentedTo: 'Lisa Star',
//       from: today - 1 * day,
//       to: today + 2 * day
//   }, {
//       rentedTo: 'Shane Long',
//       from: today - 30 * day,
//       to: today - 2 * day
//   }, {
//       rentedTo: 'Jack Coleman',
//       from: today + 5 * day,
//       to: today + 6 * day
//   }]
// }, {
//   model: 'Jaguar E-type',
//   current: 0,
//   deals: [{
//       rentedTo: 'Martin Hammond',
//       from: today - 2 * day,
//       to: today + 1 * day
//   }, {
//       rentedTo: 'Linda Jackson',
//       from: today - 2 * day,
//       to: today + 1 * day
//   }, {
//       rentedTo: 'Robert Sailor',
//       from: today + 2 * day,
//       to: today + 6 * day
//   }]
// }];

// // Parse car data into series.
// series = cars.map(function (car, i) {
//   var data = car.deals.map(function (deal) {
//       return {
//           id: 'deal-' + i,
//           rentedTo: deal.rentedTo,
//           start: deal.from,
//           end: deal.to,
//           y: i,
//           name: deal.rentedTo
//       };
//   });
//   return {
//       name: car.model,
//       data: data,
//       current: car.deals[car.current]
//   };
// });

var sigmaSeries = null;

const App = () => {

  // Sigma stuff
  const config = useConfig();
  const sigmaData = useElementData(config.source);
  const ref = useRef();
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

    // build data object first
    const sigmaObjectBuilder = (obj) => {
      for (var i = 0; i < config.dimension.length; i++) {
        var first_val = sigmaData[config.dimension[i]][0];
        if (typeof first_val !== 'string') {
          // this is start_times
          obj.start_time = sigmaData[config.dimension[i]];
        } else {
          // it is either wono or operation
          // can convert the string to a number and back to an int. if same value, it is wono. if not, it is operation.
          // convert string # to int
          var temp = parseInt(first_val);
          if (first_val === '00' + temp.toString()) {
            // this is wono bc the values are the same before and after, meaning it was an int
            obj.wono = sigmaData[config.dimension[i]];
          } else {
            // not the same before and after, therefor it was a string operation
            obj.operation = sigmaData[config.dimension[i]];
          }
        }
      }

      return obj;
    }

    // process data object to be series array
    var sigmaSeriesBuilder = (obj) => {
      // debugger;
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
            // maybe remove below
            // y: wono_count
          }
    
          // I also want to add to this data array the parent object
          newObj.data.push({
            name: prev_wono,
            id: 'wono-' + wono_count.toString(),
            pointWidth: 3,
            // y: wono_count
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
            // maybe remove below
            // y: wono_count
          }
          // reset prev_wono
          prev_wono = curr_wono;
    
          // Add the parent object to newObj data array
          newObj.data.push({
            name: curr_wono,
            id: 'wono-' + wono_count.toString(),
            pointWidth: 3,
            // y: wono_count
          })
        } else {
          // we are in the same wono still
          // so we want to add to the data key
          let dataObj = {
            parent: 'wono-' + wono_count.toString(),
            name: obj.operation[i],
            start: obj.start_time[i],
            end: obj.end_time[i],
            // y: wono_count
          }
          // add the new data object to the array
          newObj.data.push(dataObj);
          i++;
        }
      }
    
      // push last newObj to the arr
      arr.push(newObj)
    
      return arr;
    }

    var sigmaObj;

    if (sigmaData?.[dimensions[0]]) {
      // data object 
      sigmaObj = {
        end_time: sigmaData[config.measures[0]]
      };
      // build sigmaObj
      sigmaObj = sigmaObjectBuilder(sigmaObj);
      
      // build sigma series
      sigmaSeries = sigmaSeriesBuilder(sigmaObj);
    }


    console.log('Sigma Object', sigmaObj)
    console.log('Sigma Series', sigmaSeries);
    
    if (sigmaSeries) {
      const options = {
        // chart: {
        //   type: "xrange"
        // },
        series: sigmaSeries,
        // series: [{ data: sigmaSeries }],
        tooltip: {
          pointFormat: '<span>Operation: {point.name}</span><br/><span>From: {point.start:%e. %b %I:%M}</span><br/><span>To: {point.end:%e. %b %I:%M}</span>'
        },
        // This right here is the range bar and navigator, which is looking great. Lots of additional customizations can be made here however
        navigator: {
          enabled: true,
          // series: { type: "xrange"}
        },
        scrollbar: {
          enabled: true
        },
        rangeSelector: {
          enabled: true,
          // selected: 0
        },
    
        // This below keeps an indicator line for the current time
        xAxis: {
            currentDateIndicator: true
        },
        // yAxis: {
        //     type: 'category',
        //     grid: {
        //         columns: [{
        //             title: {
        //                 text: 'Work Order'
        //             },
        //             categories: sigmaSeries.map(function (s) {
        //                 return s.name;
        //             })
        //         }]
        //     }
        // }
        yAxis: {
          type: 'treegrid',
          uniqueNames: true,
        }
      }
      return options
    }
    
  }, [config, sigmaData]);

  return (
    <div>
      <p>
        refactor branch
      </p>
      {options && sigmaSeries && 
      <HighchartsReact
      highcharts={Highcharts}
      constructorType={"ganttChart"}
      options={options}
      ref={ref}
    />}
    </div>

  );
};


export default App;