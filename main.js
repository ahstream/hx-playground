import { round } from 'hx-client-lib';

(async () => {
  console.log(`round(10.1234, 2) = ${round(10.1234, 2)}`);

  document.querySelector('#app').innerHTML = `
<div>
  <h1>Hello Vite!</h1>
  <div>
  round(1.2345, 2) = ${round(1.2345, 2)}
  </div>
</div>
`;
})();
