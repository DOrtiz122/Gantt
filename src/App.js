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


// function App() {


//   return (
//     <p>
//       hello
//     </p>
//   )
// }


const App = () => {
  const [options] = useState({
    series: [
      {
        data: [{
          y: 0,
          start: 1,
          end: 10
        }, {
          y: 1,
          start: 5,
          end: 15
        }]
      }
    ]
  });

  return (
    <HighchartsReact
      highcharts={Highcharts}
      constructorType={"ganttChart"}
      options={options}
    />
  );
};


export default App;