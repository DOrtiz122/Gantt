// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;

// This is where I will actually develop the Gantt chart

// I want to use Hooks if I can, possibly

import React, { 
  useState, 
  useEffect,
  useMemo, 
  useRef } from 'react';

import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
// import Highcharts from 
import ApexCharts from 'apexcharts';
import Chart from 'react-apexcharts';
import { client, useConfig, useElementData } from "@sigmacomputing/plugin";

var ser = {
      
  series: [
  {
    name: 'Manufacturing',
    data: [
      {
        x: 'Project A',
        y: [
          new Date('2019-03-05T12:00:00Z').getTime(),
          new Date('2019-03-08T12:00:00Z').getTime()
        ]
      },
      // {
      //   x: 'Project A',
      //   y: [
      //     new Date('2019-03-10').getTime(),
      //     new Date('2019-03-12').getTime()
      //   ]
      // },
    ]
  }],
  options: {
    chart: {
      height: 450,
      type: 'rangeBar'
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '80%'
      }
    },
    xaxis: {
      type: 'datetime'
      // labels: {
      //   format: 'dd/MM'
      // }
    },
    stroke: {
      width: 1
    },
    fill: {
      type: 'solid',
      opacity: 0.6
    },
    // legend: {
    //   position: 'top',
    //   horizontalAlign: 'left'
    // }
  },
}

function App() {

  const [dog, setDog] = useState(ser);

  useEffect(() => {
  setDog(ser);
  }, [])

  return (
    <p>
      hello
      <Chart options={dog.options} series={dog.series} type="rangeBar" height={450}  />
    </p>
  )
}

export default App;