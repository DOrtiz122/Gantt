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
import { isLabelWithInternallyDisabledControl } from '@testing-library/user-event/dist/utils';
import { isCompositeComponent } from 'react-dom/test-utils';

// configure this for sigma
client.config.configureEditorPanel([
  { name: "source", type: "element" },
  { name: "dimension", type: "column", source: "source", allowMultiple: true },
  { name: "measures", type: "column", source: "source", allowMultiple: true },
]);


// THIS IS THE BRANCH WHERE WILL WE CONNECT TO SIGMA DATA
// declare this globally
var sigmaSeries, sigmaObj = null;

const App = () => {

  // Sigma stuff
  const config = useConfig();
  const sigmaData = useElementData(config.source);
  const ref = useRef();
  // var sigmaSeries, sigmaObj = null;

  var [options, setOptions] = useState({});

  useEffect(() => {
    const dimensions = config.dimension;
    const measures = config.measures; // only start_time will be passed in

    // bc useConfig and useElementData aren't promise based, i can't use async/await. it needs to be conditional everything.
    if (!(dimensions && measures)) return false;

    // build data object first
    const sigmaObjectBuilder = (obj) => {

      // Sort all of the 4 input arrays the same way, according to start_times
      // 1) combine the arrays into a single object, then push to array
      // the only thing that matters right now is start time, we can figure out which is which later

      let list = [];
      for (let i = 0; i < sigmaData[config.measures[0]].length; i++) {
        list.push({
          start: sigmaData[config.measures[0]][i],
          data1: sigmaData[config.dimension[0]][i],
          data2: sigmaData[config.dimension[1]][i],
          data3: sigmaData[config.dimension[2]][i]
        })
      }

      // 2) Sort based on start time
      list.sort((a, b) => a.start - b.start)
      
      // 3) Separate them back out
      for (let i = 0; i < list.length; i++) {
        sigmaData[config.measures[0]][i] = list[i].start;
        sigmaData[config.dimension[0]][i] = list[i].data1;
        sigmaData[config.dimension[1]][i] = list[i].data2;
        sigmaData[config.dimension[2]][i] = list[i].data3;
      }
      

      // add in the last component
      obj.start_time = sigmaData[config.measures[0]];

      // This is the actual object builder
      for (var i = 0; i < config.dimension.length; i++) {
        var first_val = sigmaData[config.dimension[i]][0];
        if (typeof first_val !== 'string') {
          // this is start_times
          // obj.start_time = sigmaData[config.dimension[i]];
          obj.end_time = sigmaData[config.dimension[i]];
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
    
          // Parent Object in the array
          newObj.data.push({
            name: prev_wono,
            id: 'wono-' + wono_count.toString(),
            pointWidth: 3,
            // add start and end that change with state hopefully
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
    
      return arr;
    }


    // build the object and series 
    if (sigmaData?.[dimensions[0]]) {
      // reset sigmaObj and sigmaSeries to null first
      // case for when the input is switched
      sigmaObj = null;
      sigmaSeries = null;


      // build data object so we can parse it
      sigmaObj = sigmaObjectBuilder({});
      
      // build sigma series
      sigmaSeries = sigmaSeriesBuilder(sigmaObj);
    }


    // if sigmaSeries array exists, create options object.
    // conditionals bc not promise based
    if (sigmaSeries) {
      var newOptions = {
        series: sigmaSeries,
        tooltip: {
          pointFormat: '<span>Operation: {point.name}</span><br/><span>From: {point.start:%b %e, %I:%M %P}</span><br/><span>To: {point.end:%b %e, %I:%M %P}</span>'
        },
        // This right here is the range bar and navigator, which is looking great. Lots of additional customizations can be made here however
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

      setOptions(newOptions);
    }

  }, [config, sigmaData]);

  return (
    <div>
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