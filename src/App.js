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

// var sigmaSeries = null;

// 1. Have page load correctly
// This is an async await issue. I should load in the data first and then have everything else after take place.

const App = () => {

  // Sigma stuff
  // const config = useConfig();
  // const sigmaData = useElementData(config.source);
  // const ref = useRef();

  // create state for the options object
  // sigmaObject is build by an ASYNC process for fetching data
  // sigmaSeries is built by a SYNC process bc all the data has been fetched already
  var [ops, setOps] = useState([]);
  var [sigObj, setSigObj] = useState({});
  var [sigSeries, setSigSeries] = useState([]);

  const config = useConfig();
  const sigmaData = useElementData(config.source);


  // object builder and array builder functions
  // build data object first
  const sigmaObjectBuilder = (sigmaData, config) => {
    const dimensions = config.dimension;
    const measures = config.measures;

    console.log('dimensions', dimensions);
    console.log('measures', measures);
    console.log('sigmaData', sigmaData);

    let obj = {};

    if (dimensions && measures && Object.keys(sigmaData).length > 0) {
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
      // add the end time array as well, which is the only measure
      obj.end_time = sigmaData[config.measures[0]];
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
    if (obj !== {}) {
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
    }
    
    return arr;
  }

  // async stuff

  // const Connector = async () => {
  //   console.log('in Connector');
  //   // const config = await useConfig();
  //   // console.log('Config',config);
  //   // const sigmaData = await useElementData(config.source);
  //   // console.log('sigmaData', sigmaData);
  


  //   // now I want to use sigmaObjectBuilder and sigmaSeriesBuilder to create these
  //   // object builder
  //   setSigObj(() => sigmaObjectBuilder(sigmaData, config));

  //   console.log('set sig obj');

  //   // series builder
  //   setSigSeries(() => sigmaSeriesBuilder(sigObj));
  //   console.log('set sig series');
  // }

  const sigmaOptionsBuilder = () => {
    setOps({
      // chart: {
      //   type: "xrange"
      // },
      series: sigSeries,
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
          // currentDateIndicator: true
      },
      yAxis: {
        type: 'treegrid',
        uniqueNames: true,
      }
    })
  }

  // useEffect 
  useEffect(() => {
    // console.log('in use effect');
    // Connector()
    // .then(() => {
    //   console.log('we have made connection and hopefully received data and build series')
    // })
    // .then((data) => {
    //   console.log('data', data);
    //   sigmaOptionsBuilder();
    // })

    setSigObj(() => sigmaObjectBuilder(sigmaData, config));
    console.log('set sig obj', sigObj);
    setSigSeries(() => sigmaSeriesBuilder(sigObj));
    console.log('set sig series', sigSeries);

  }, [config, sigmaData] ) // [config, sigmaData]

  // const options = useMemo(() => {
  //   const dimensions = config.dimension;
  //   const measures = config.measures;

  //   // this is the async workaround, which isn't great
  //   if (!(dimensions && measures)) return false;

  //   // // build data object first
  //   // const sigmaObjectBuilder = (sigmaData, config) => {

  //   //   let obj = {};
  //   //   for (var i = 0; i < config.dimension.length; i++) {
  //   //     var first_val = sigmaData[config.dimension[i]][0];
  //   //     if (typeof first_val !== 'string') {
  //   //       // this is start_times
  //   //       obj.start_time = sigmaData[config.dimension[i]];
  //   //     } else {
  //   //       // it is either wono or operation
  //   //       // can convert the string to a number and back to an int. if same value, it is wono. if not, it is operation.
  //   //       // convert string # to int
  //   //       var temp = parseInt(first_val);
  //   //       if (first_val === '00' + temp.toString()) {
  //   //         // this is wono bc the values are the same before and after, meaning it was an int
  //   //         obj.wono = sigmaData[config.dimension[i]];
  //   //       } else {
  //   //         // not the same before and after, therefor it was a string operation
  //   //         obj.operation = sigmaData[config.dimension[i]];
  //   //       }
  //   //     }
  //   //   }

  //   //   // add the end time array as well, which is the only measure
  //   //   obj.end_time = sigmaData[config.measures[0]];

  //   //   return obj;
  //   // }

  //   // // process data object to be series array
  //   // var sigmaSeriesBuilder = (obj) => {
  //   //   // debugger;
  //   //   let arr = [];
    
  //   //   let i = 0;
  //   //   let wono_count = 0;
    
  //   //   // declare prev_wono outside
  //   //   let prev_wono;
  //   //   let newObj;
      
  //   //   while (i < obj.wono.length) {
    
  //   //     // base case for the first wono
  //   //     if (!prev_wono) {
  //   //       prev_wono = obj.wono[i];
  //   //       newObj = {
  //   //         name: prev_wono,
  //   //         data: [],
  //   //         // maybe remove below
  //   //         // y: wono_count
  //   //       }
    
  //   //       // I also want to add to this data array the parent object
  //   //       newObj.data.push({
  //   //         name: prev_wono,
  //   //         id: 'wono-' + wono_count.toString(),
  //   //         pointWidth: 3,
  //   //         // y: wono_count
  //   //       })
  //   //     }
        
  //   //     let curr_wono = obj.wono[i];
  //   //     // if prev wono and curr_wono are different,
  //   //     // we are at a new wono
  //   //     if (prev_wono !== curr_wono) {
  //   //       wono_count++;
  //   //       arr.push(newObj);
  //   //       newObj = {
  //   //         name: curr_wono,
  //   //         data: [],
  //   //         // maybe remove below
  //   //         // y: wono_count
  //   //       }
  //   //       // reset prev_wono
  //   //       prev_wono = curr_wono;
    
  //   //       // Add the parent object to newObj data array
  //   //       newObj.data.push({
  //   //         name: curr_wono,
  //   //         id: 'wono-' + wono_count.toString(),
  //   //         pointWidth: 3,
  //   //         // y: wono_count
  //   //       })
  //   //     } else {
  //   //       // we are in the same wono still
  //   //       // so we want to add to the data key
  //   //       let dataObj = {
  //   //         parent: 'wono-' + wono_count.toString(),
  //   //         name: obj.operation[i],
  //   //         start: obj.start_time[i],
  //   //         end: obj.end_time[i],
  //   //         // y: wono_count
  //   //       }
  //   //       // add the new data object to the array
  //   //       newObj.data.push(dataObj);
  //   //       i++;
  //   //     }
  //   //   }
    
  //   //   // push last newObj to the arr
  //   //   arr.push(newObj)
    
  //   //   return arr;
  //   // }

  //   // var sigmaObj;

  //   // if (sigmaData?.[dimensions[0]]) {
  //   //   // data object 
  //   //   // sigmaObj = {
  //   //   //   end_time: sigmaData[config.measures[0]]
  //   //   // };
  //   //   // build sigmaObj
  //   //   sigmaObj = sigmaObjectBuilder(sigmaObj);
      
  //   //   // build sigma series
  //   //   sigmaSeries = sigmaSeriesBuilder(sigmaObj);
  //   // }


  //   // console.log('Sigma Object', sigmaObj)
  //   // console.log('Sigma Series', sigmaSeries);
    
  //   if (sigmaSeries) {
  //     const options = {
  //       // chart: {
  //       //   type: "xrange"
  //       // },
  //       series: sigmaSeries,
  //       // series: [{ data: sigmaSeries }],
  //       tooltip: {
  //         pointFormat: '<span>Operation: {point.name}</span><br/><span>From: {point.start:%e. %b %I:%M}</span><br/><span>To: {point.end:%e. %b %I:%M}</span>'
  //       },
  //       // This right here is the range bar and navigator, which is looking great. Lots of additional customizations can be made here however
  //       navigator: {
  //         enabled: true,
  //         // series: { type: "xrange"}
  //       },
  //       scrollbar: {
  //         enabled: true
  //       },
  //       rangeSelector: {
  //         enabled: true,
  //         // selected: 0
  //       },
    
  //       // This below keeps an indicator line for the current time
  //       xAxis: {
  //           // currentDateIndicator: true
  //       },
  //       yAxis: {
  //         type: 'treegrid',
  //         uniqueNames: true,
  //       }
  //     }
  //     return options
  //   }
    
  // }, [config, sigmaData]);

  return (
    <div>
      <p>
        refactor branch
      </p>
      {ops && sigSeries && 
      <HighchartsReact
      highcharts={Highcharts}
      constructorType={"ganttChart"}
      options={ops}
      // ref={ref}
    />}
    </div>
  );
};


export default App;