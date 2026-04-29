// Toggle mobile nav and set current year
document.addEventListener('DOMContentLoaded',function(){
  var btn = document.querySelector('.nav-toggle');
  var nav = document.getElementById('main-nav');
  if (btn && nav) {
    btn.addEventListener('click',function(){
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      // reflect expansion on nav element for styling
      nav.setAttribute('aria-expanded', String(!expanded));
    });

    // Close nav when clicking a link (mobile)
    nav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click',function(e){
        if (window.innerWidth <= 900){
          btn.setAttribute('aria-expanded','false');
          nav.setAttribute('aria-expanded','false');
        }
      });
    });
  }

  // Set year in footer
  var y = new Date().getFullYear();
  var el = document.getElementById('year');
  if (el) el.textContent = y;

  // Simple contact form handler (no backend) -> shows a thank you message
  var form = document.getElementById('contact-form');
  if (form){
    form.addEventListener('submit',function(ev){
      ev.preventDefault();
      alert('Thank you, ' + (form.name.value || '') + '! Your message has been recorded locally.');
      form.reset();
    });
  }

  // Scroll reveal for elements with .reveal
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    },{threshold:0.12});
    revealEls.forEach(function(elm){io.observe(elm)});
  } else {
    // fallback
    revealEls.forEach(function(e){e.classList.add('visible')});
  }

});

// Improved lightbox: use event delegation and build image list at open time so images load dynamically
(function(){
  // Create lightbox overlay once
  var lb = document.createElement('div');
  lb.className = 'lb-overlay lb-hidden';
  lb.setAttribute('role','dialog');
  lb.setAttribute('aria-modal','true');
  lb.innerHTML = '\n    <button class="lb-nav lb-prev" aria-label="Previous image">◀</button>\n    <img class="lb-image" src="" alt="">\n    <button class="lb-nav lb-next" aria-label="Next image">▶</button>\n    <div class="lb-caption" aria-hidden="false"></div>\n    <div class="lb-controls">\n      <button class="lb-btn lb-close" aria-label="Close">Close</button>\n    </div>\n  ';
  document.body.appendChild(lb);

  var lbImage = lb.querySelector('.lb-image');
  var lbCaption = lb.querySelector('.lb-caption');
  var lbClose = lb.querySelector('.lb-close');
  var lbPrev = lb.querySelector('.lb-prev');
  var lbNext = lb.querySelector('.lb-next');
  var currentImgs = [];
  var activeIndex = -1;

  function buildImageList(){
    // Select images that are meaningful (skip tiny/decorative ones)
    var all = Array.prototype.slice.call(document.querySelectorAll('img'));
    return all.filter(function(img){
      if (img.closest && img.closest('.no-lightbox')) return false; // opt-out helper
      if (img.getAttribute('data-no-lightbox') === 'true') return false;
      if (img.alt === 'decorative') return false;
      // skip images that are visually tiny
      try{ if (img.naturalWidth && img.naturalWidth < 40) return false; }catch(e){}
      return true;
    });
  }

  // Make images focusable for keyboard users (best-effort) and wrap them so neon can be applied
  function enhanceImages(){
    buildImageList().forEach(function(img){
      // skip if already enhanced
      if (img.getAttribute('data-enhanced') === '1') return;

      img.tabIndex = 0;
      img.classList.add('interactive-img');
      img.setAttribute('role','button');

      // Wrap the image in a span.neon-wrap so we can apply pseudo-element glow outside the image
      var parent = img.parentElement;
      if (!parent || parent.classList.contains('neon-wrap')){
        // parent already suitable
      } else {
        // create wrapper
        var wrap = document.createElement('span');
        wrap.className = 'neon-wrap';
        // preserve display behavior
        var imgDisplay = window.getComputedStyle(img).display;
        wrap.style.display = (imgDisplay === 'block' ? 'block' : 'inline-block');
        // insert wrapper before img and move img inside
        parent.insertBefore(wrap, img);
        wrap.appendChild(img);

        // mouse and focus handlers to toggle neon-edge
        wrap.addEventListener('mouseenter', function(){ wrap.classList.add('neon-edge'); });
        wrap.addEventListener('mouseleave', function(){ wrap.classList.remove('neon-edge'); });
        wrap.addEventListener('focusin', function(){ wrap.classList.add('neon-edge'); });
        wrap.addEventListener('focusout', function(){ wrap.classList.remove('neon-edge'); });
      }

      img.setAttribute('data-enhanced','1');
    });
  }
  enhanceImages();

  // Re-run enhancement if new images are added later
  if ('MutationObserver' in window){
    var mo = new MutationObserver(function(){ enhanceImages(); });
    mo.observe(document.body,{childList:true,subtree:true});
  }

  // Delegate click on images
  document.addEventListener('click', function(e){
    var el = e.target;
    // find ancestor img if any (handles clicks on children inside <figure> etc.)
    var img = el.tagName === 'IMG' ? el : (el.closest ? el.closest('img') : null);
    if (!img) return;
    // Always open lightbox when an image is clicked (prevents navigation when image wrapped in <a>)
    e.preventDefault();
    currentImgs = buildImageList();
    activeIndex = currentImgs.indexOf(img);
    if (activeIndex === -1) return;
    show(activeIndex);
  }, true);

  // Keyboard: Enter/Space on focused image opens lightbox
  document.addEventListener('keydown', function(e){
    var active = document.activeElement;
    if (!active) return;
    if (active.tagName === 'IMG' && (e.key === 'Enter' || e.key === ' ')){
      e.preventDefault();
      currentImgs = buildImageList();
      activeIndex = currentImgs.indexOf(active);
      if (activeIndex === -1) return;
      show(activeIndex);
    }
  });

  function show(i){
    var target = currentImgs[i];
    if (!target) return;
    // Use high-res if data-large attribute provided
    var src = target.getAttribute('data-large') || target.src;
    lbImage.src = src;
    lbImage.alt = target.alt || '';
    lbCaption.textContent = target.getAttribute('data-caption') || target.alt || '';
    lb.classList.remove('lb-hidden');
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }

  function close(){
    lb.classList.add('lb-hidden');
    document.body.style.overflow = '';
  }

  function next(){
    if (!currentImgs.length) return;
    activeIndex = (activeIndex + 1) % currentImgs.length;
    show(activeIndex);
  }
  function prev(){
    if (!currentImgs.length) return;
    activeIndex = (activeIndex - 1 + currentImgs.length) % currentImgs.length;
    show(activeIndex);
  }

  lbClose.addEventListener('click', close);
  lb.addEventListener('click', function(e){ if (e.target === lb) close(); });
  lbPrev.addEventListener('click', function(e){ e.stopPropagation(); prev(); });
  lbNext.addEventListener('click', function(e){ e.stopPropagation(); next(); });

  document.addEventListener('keydown', function(e){
    if (lb.classList.contains('lb-hidden')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  });
})();

// If on the home page, replace the main/home image with the municipality image
document.addEventListener('DOMContentLoaded', function(){
  try{
    var filename = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (filename === '' || filename === 'index.html'){
      // Prefer explicit hero/page image selectors
      var target = document.querySelector('.page-img') || document.querySelector('.hero img') || document.querySelector('main img') || document.querySelector('.page-banner img');
      if (target){
        target.src = 'assets/images/muni.jpg';
        // make sure it's centered and responsive
        target.classList.add('page-img');
        target.style.display = 'block';
        target.style.marginLeft = 'auto';
        target.style.marginRight = 'auto';
        target.style.maxWidth = '100%';
        target.loading = 'lazy';
      }
    }
  }catch(e){
    console.error('Failed to set home image', e);
  }
});

// Inject brand logo into any page header that has a .brand element but no logo image yet
document.addEventListener('DOMContentLoaded', function(){
  try{
    var brands = document.querySelectorAll('.brand');
    brands.forEach(function(brand){
      if (!brand) return;
      // if there's already an image with class brand-logo, skip
      if (brand.querySelector('img.brand-logo')) return;

      var img = document.createElement('img');
      img.src = 'assets/images/logo.png';
      img.alt = 'Pagadian City seal';
      img.className = 'brand-logo';

      // Find existing text node or span to preserve the title
      var textSpan = brand.querySelector('.brand-text');
      if (!textSpan){
        // if brand contains text, wrap it
        var text = brand.textContent && brand.textContent.trim();
        // clear existing content
        while (brand.firstChild) brand.removeChild(brand.firstChild);
        brand.appendChild(img);
        if (text) {
          var span = document.createElement('span');
          span.className = 'brand-text';
          span.textContent = text;
          brand.appendChild(span);
        }
      } else {
        // insert image before the text span
        brand.insertBefore(img, textSpan);
      }
      // ensure header brand uses flex layout (in case styles missing)
      brand.style.display = 'flex';
      brand.style.alignItems = 'center';
      brand.style.gap = '0.6rem';
    });
  }catch(e){
    // silent fail
    console.error(e);
  }
});

// Apply neon-edge class to header and main panels across all pages so the animated glow appears
document.addEventListener('DOMContentLoaded', function(){
  try{
    var header = document.querySelector('.site-header');
    if (header) header.classList.add('neon-edge');

    // Add to the primary content container (if present) to surround the main card/hero
    var mainContainer = document.querySelector('main .container') || document.querySelector('.container');
    if (mainContainer) mainContainer.classList.add('neon-edge');

    // Also add to any prominent panels so the glow appears around them
    document.querySelectorAll('.panel').forEach(function(p){ p.classList.add('neon-edge'); });

  }catch(e){ console.error(e); }
});
