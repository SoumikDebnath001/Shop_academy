// Full-screen loader shown on the first page load. It is plain server-rendered HTML, so it appears before
// any JavaScript runs; siteLoaderScript (in <head>) hides it once every asset has loaded.
// Hiding works through <html data-loaded>, so React's markup is never touched (no hydration mismatch).
export default function SiteLoader() {
  return (
    <div className="site-loader" role="status" aria-label="Loading Obuya One">
      {/* eslint-disable-next-line @next/next/no-img-element -- self-animating SVG; next/image would add nothing here */}
      <img src="/loader.svg" alt="" width={150} height={150} fetchPriority="high" />
      <noscript>
        <style>{'.site-loader{display:none}'}</style>
      </noscript>
    </div>
  );
}

// Waits for window "load" (images, CSS, scripts), then for the icon + heading fonts (the client-rendered navbar
// requests them after "load", so they are loaded explicitly) and any other fonts in use, then marks the page loaded.
// The 15s fallback keeps a stuck asset from hiding the site forever.
export const siteLoaderScript = `(function(){var h=document.documentElement,done=function(){h.dataset.loaded='true'},ready=function(){var f=document.fonts;if(!f)return done();Promise.all([f.load('24px "Material Symbols Outlined"'),f.load('700 24px "Libre Caslon Text"'),f.ready]).then(done,done)};if(document.readyState==='complete')ready();else addEventListener('load',ready,{once:true});setTimeout(done,15000)})()`;
