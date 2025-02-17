
let rareEvent = false;
let epicEvent = false;

let basicShader;
let shaderTexture;
let img;
let seed;
let noiseScale;
let speed;
let aniScale;
let noiseExpo1, noiseExpo2;
let chromaticAberration;
let redProb, rgbdelay;
let zoom = 1.0;
let zoomFactor = 1.0;

let scrollOffset = 0.0;
let targetZoom = 1.0;
let redB;
let noiseB;

let blockheight = 0;
let blocktime = 0;
let previousHeight = 0;
let newBlockDetected = false;
let shake = 0;
let count = 0;
let countLength = 20;
let scaleMult;
let selectedNoiseScale;
let lastRareEventCount = 0;
let kali = 0.0
let rareProb
let rareE
let rareStop = false
let uadd = 0;

function dateToBlockHeight(dateString) {
  let userDate = new Date(dateString);
  if (isNaN(userDate.getTime())) {
    return null;
  }
  const genesisTimestamp = new Date('2009-01-03T00:00:00Z').getTime() / 1000;
  const secondsPerBlock = 600; 
  let userTimestamp = userDate.getTime() / 1000;
  let blocksSinceGenesis = (userTimestamp - genesisTimestamp) / secondsPerBlock;
  let approxBlockHeight = floor(blocksSinceGenesis);
  return max(0, approxBlockHeight);
}
async function getBlockTime() {
  try {
    let response = await fetch('https://ordinals.com/r/blocktime');
    let value = await response.json();
    blocktime = value;
    return value;
  } catch (error) {
    console.error(error);
    return null;
  }
};
async function getBlockHeight() {
  try {
    let response = await fetch('https://ordinals.com/r/blockheight');
    let currentHeight = await response.json();
    console.log("Current blockHeight: " + currentHeight);
    if (previousHeight === 0) {
      previousHeight = currentHeight;
      newBlockDetected = false;
    } else if (currentHeight > previousHeight) {
      previousHeight = currentHeight;
      newBlockDetected = true;
    } else {
      newBlockDetected = false;
    }
    if (newBlockDetected) {
      rareEvent = (previousHeight % 2016 === 0);
      epicEvent = (previousHeight % 210000 === 0);
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};
function preload() {
  basicShader = loadShader('shader.vert', 'shader.frag');
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);

  shaderTexture = createGraphics(windowWidth, windowHeight, WEBGL);
  shaderTexture.noStroke();
  shaderTexture.pixelDensity(1);
  seed = random() * 999999;
  console.log("Seed: " + seed);
  randomSeed(seed);
  noiseSeed(seed);
  pixelDensity(1);
  noiseScale = random([1.0, 1.0, 2.0, 2.0, 1.5, 1.25, 0.5, 0.5, 1.0]);
  selectedNoiseScale = noiseScale;
  redB = random([0.0, 0.0, 1.0]);
  speed = random(2, 6.5);
  aniScale = random([1.0, 1.0, 2.0, 2.0, 10.0, 1.0, 0.2, 0.5, 5.0, 1.0]);
  noiseExpo1 = random([0.01, 0.01, 0.1, 1.0, 1.0, 0.1, 0.1, 0.01, 0.1]);
  noiseExpo2 = random([0.01, 0.01, 0.1, 1.0, 1.0, 0.1, 0.1, 0.01, 0.1]);
  noiseB = random([0.0, 1.0, 0.0]);
  rareProb = random([0.0, 0.0, 0.05])
  let consoleRare = rareProb == 0.05 ? "Yes" : "No";

  console.log("Rare Probability: " + consoleRare);

  chromaticAberration = random([0, 0, 0, 0, 0, 0.1]);
  redProb = random([0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);

  if (chromaticAberration == 0.0 && redProb == 0.0) {
    rgbdelay = random([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.3]);
  } else {
    rgbdelay = 0.0;
  }

  let chrom = chromaticAberration == 0.1 ? "Yes" : "No";
  let red = redProb == 1.0 ? "Yes" : "No";
  let rgb = rgbdelay == 0.3 ? "Yes" : "No";
  let noiB = noiseB == 1.0 ? "Yes" : "No";

  console.log("Chromatic Aberration: " + chrom);
  console.log("Highlight Color: " + red);
  console.log("RGB Delay: " + rgb);
  console.log("Square Noise: " + noiB);

  const referenceDate = "2025-02-01T00:00:00Z";
  let startBlock2025  = dateToBlockHeight(referenceDate); 

  let params = getURLParams();

  if (params.date) {
    let desiredDate = new Date(params.date);
    if (!isNaN(desiredDate.getTime())) {
      blocktime = desiredDate.getTime() / 1000;
      console.log("Using static date from URL:", params.date);
      let approximateBlockHeight = dateToBlockHeight(params.date);

      if (approximateBlockHeight !== null) {
        if (approximateBlockHeight < startBlock2025) {
          approximateBlockHeight = startBlock2025;
        }
        let blocksSince2025 = approximateBlockHeight - startBlock2025;
        let newRareCount    = floor(blocksSince2025 / 2016);

        if (newRareCount > lastRareEventCount) {
          let eventsPassed = newRareCount - lastRareEventCount;
          console.log("Manual date: Passed", eventsPassed, "rare event(s) after 2025.");
          for (let i = 0; i < eventsPassed; i++) {
            if (!rareStop) {
              rareE = random(1);
            }
            if (rareE < rareProb) {
              kali = 0.6;
              rareStop = true;
            }
          }
          lastRareEventCount = newRareCount;
        }
        previousHeight  = approximateBlockHeight;
        blockheight     = approximateBlockHeight;
        newBlockDetected = false;
        console.log("Using approx BH from date param:", approximateBlockHeight);
      }
    } else {
      console.error("Invalid date format in URL parameter.");
      getBlockTime();
      setInterval(getBlockTime, 5000);
      getBlockHeight();
      setInterval(getBlockHeight, 5000);
    }
  } else {
    getBlockTime();
    setInterval(getBlockTime, 5000);
    getBlockHeight();
    setInterval(getBlockHeight, 5000);
  }
}
function convertUnixToReadable(unixTime) {
  let date = new Date(unixTime * 1000);
  let hrs = nf(date.getHours(), 2);
  let mins = nf(date.getMinutes(), 2);
  let secs = nf(date.getSeconds(), 2);
  let day = nf(date.getDate(), 2);
  let month = nf(date.getMonth() + 1, 2);
  let year = date.getFullYear();
  return `${hrs}:${mins}:${secs} ${day}/${month}/${year}`;
}
let blockTime = 1737228148;
function draw() {
  if (newBlockDetected) {
    count += 1;
    shake = 1.0;
    if (count > countLength) {
      newBlockDetected = false;
      count = 0;
    }
  } else {
    shake = 0.0;
  }
  if (rareEvent) {
    console.log("Rare Event triggered at blockheight: " + previousHeight);
    if (rareStop) {
    } else {
      rareE = random(1)
    }
    if (rareE < rareProb) {
      kali = 0.6
      rareStop = true
    }
  }
  let epicIndex = floor(previousHeight / 210000);
  let fractionOfEpic = (previousHeight % 210000) / 210000; 
  let isRising = (epicIndex % 2 === 0); 
  let minVal = 1.0;
  let maxVal = 500.0;
  let exponent = 5.5;
  if (isRising) {
    scaleMult = lerp(minVal, maxVal, pow(fractionOfEpic, exponent));
  } else {
    scaleMult = lerp(minVal, maxVal, pow(fractionOfEpic, exponent));
  }
  noiseScale = selectedNoiseScale / scaleMult;
  const referenceDateSec = new Date('2025-02-01T00:00:00Z').getTime() / 1000;
  const SECONDS_PER_YEAR = 31557600; 

  let diffSec = blocktime - referenceDateSec;
  if (diffSec < 0) {
    uadd = 0;
  } else {
    let yearsPassed = diffSec / SECONDS_PER_YEAR;
    uadd = 500 * yearsPassed;
  }
  let sendToShader = uadd / 25.0;
  basicShader.setUniform('u_rgbd', rgbdelay);
  basicShader.setUniform('u_red', redProb);
  basicShader.setUniform('u_chroAber', chromaticAberration);
  basicShader.setUniform('u_noiseExpo1', noiseExpo1);
  basicShader.setUniform('u_noiseExpo2', noiseExpo2);
  basicShader.setUniform('u_aniScale', aniScale);
  basicShader.setUniform('u_noiseScale', noiseScale);
  basicShader.setUniform('u_speed', speed);
  basicShader.setUniform('u_seed', seed);
  basicShader.setUniform('u_waveAmp1', 1.0);
  basicShader.setUniform('u_waveAmp2', 1.0);
  basicShader.setUniform('u_waveSpeed1', 0.2);
  basicShader.setUniform('u_waveSpeed2', 0.1);
  basicShader.setUniform('u_time', millis() / 1000.0);
  basicShader.setUniform('u_resolution', [width, height]);
  basicShader.setUniform('u_pixelDensity', pixelDensity());
  basicShader.setUniform('u_prevFrame', shaderTexture);
  basicShader.setUniform('u_color', redB);
  basicShader.setUniform('u_noiseB', noiseB);
  basicShader.setUniform('u_sortAm', 0.0);
  basicShader.setUniform('u_shake', shake);
  basicShader.setUniform('u_add', sendToShader);
  basicShader.setUniform('u_kali', kali);
  shaderTexture.shader(basicShader);
  shaderTexture.rect(0, 0, width, height);
  push();
  rotate(TAU / 2);
  translate(-width / 2, -height / 2);
  image(shaderTexture, 0, 0, width, height);
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  shaderTexture.resizeCanvas(windowWidth, windowHeight);
  basicShader.setUniform('u_resolution', [windowWidth, windowHeight]);
  basicShader.setUniform('u_pixelDensity', pixelDensity());
}
