import _ from 'lodash';
import * as hosts from '../constants/hosts';

function setupFavicon(stageAbbr) {
  const canvas = document.createElement('canvas');
  if (!canvas.getContext) return;
  const img = document.createElement('img');
  const favicon = document.querySelector('link[rel~="icon"]');
  const newFavicon = favicon.cloneNode(true);
  const ctx = canvas.getContext('2d');
  canvas.width = 88;
  canvas.height = 88;
  img.onload = () => {
    ctx.drawImage(img, 0, 8);
    ctx.beginPath();
    ctx.fillStyle = 'green';
    ctx.strokeStyle = 'rgba(0,0,0,0)';
    ctx.arc(59, 28, 29, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'white';
    ctx.fillStyle = 'white';
    ctx.font = 'bold 60px "Arial", sans-serif';
    ctx.fillText(stageAbbr, 41, 40);
    ctx.closePath();

    newFavicon.href = canvas.toDataURL('image/png');
    favicon.remove();
    document.querySelector('head').appendChild(newFavicon);
  };
  img.src = favicon.getAttribute('href');
}

export default function setupStageInfo() {
  const { stageName } = hosts;
  const host = hosts.DEPLOYMENT_ABBRS.find(r => r.name === stageName);
  if (host) {
    setupFavicon(host.abbr);
  }
  const title = host ? host.abbr : _.startCase(stageName);
  document.title = `Huskar ${title}`;
}
