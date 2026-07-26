import { resolve } from "node:path";
import { chromium } from "playwright";

const mediaPath = resolve(
  process.argv[2] ||
    "out/miaotarot-hot-meme-ginger-final-v2-18s-1080x1920.mp4",
);

const browser = await chromium.launch({
  headless: true,
  ignoreDefaultArgs: ["--mute-audio"],
  args: ["--autoplay-policy=no-user-gesture-required"],
});

try {
  const page = await browser.newPage();
  await page.route("http://media.local/", (route) =>
    route.fulfill({
      body: '<video id="video" src="/video.mp4" playsinline></video>',
      contentType: "text/html",
    }),
  );
  await page.route("http://media.local/video.mp4", (route) =>
    route.fulfill({ path: mediaPath, contentType: "video/mp4" }),
  );
  await page.goto("http://media.local/");

  const result = await page.evaluate(async () => {
    const video = document.querySelector("#video");
    if (!(video instanceof HTMLVideoElement)) {
      throw new Error("Video element was not created");
    }

    const context = new AudioContext();
    const source = context.createMediaElementSource(video);
    const analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    analyser.connect(context.destination);

    await context.resume();
    await video.play();

    let peakDeviation = 0;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
      const samples = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(samples);
      for (const value of samples) {
        peakDeviation = Math.max(peakDeviation, Math.abs(value - 128));
      }
    }

    return {
      currentTime: video.currentTime,
      duration: video.duration,
      readyState: video.readyState,
      paused: video.paused,
      width: video.videoWidth,
      height: video.videoHeight,
      audioContext: context.state,
      peakDeviation,
    };
  });

  if (
    result.currentTime < 1 ||
    result.paused ||
    result.readyState < 3 ||
    result.width !== 1080 ||
    result.height !== 1920
  ) {
    throw new Error(`Browser video playback failed: ${JSON.stringify(result)}`);
  }
  if (result.audioContext !== "running" || result.peakDeviation < 2) {
    throw new Error(`Browser audio playback failed: ${JSON.stringify(result)}`);
  }

  console.log(
    `Browser playback verified: ${result.duration.toFixed(2)}s, ${result.width}x${result.height}, audio waveform peak deviation ${result.peakDeviation}`,
  );
} finally {
  await browser.close();
}
