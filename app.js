// State Management
let currentFormat = 'badge'; // 'badge' or 'pfp'
let templateImage = new Image();
let userImage = null;
let isTemplateLoaded = false;

// Preload PFP Assets from hhgoa.com
let assetGoaHindi = new Image();
let assetFooterTrees = new Image();
let isGoaHindiLoaded = false;
let isFooterTreesLoaded = false;

// Badge Background Assets
let badgeBgSunrise = new Image();
let badgeBgSignpost = new Image();
let badgeBgAgenda = new Image();
let badgeBgLaptop = new Image();
let badgeBgClassic = new Image();
let assetHackerHouseLogo = new Image();

let isBgSunriseLoaded = false;
let isBgSignpostLoaded = false;
let isBgAgendaLoaded = false;
let isBgLaptopLoaded = false;
let isBgClassicLoaded = false;
let isHackerHouseLogoLoaded = false;

let currentBadgeTheme = 'sunrise'; // 'sunrise', 'signpost', 'agenda', 'laptop', 'classic'

// QRious library reference
let qrEncoder = null;

// Photo transformation state
const transform = {
  scale: 1.0,
  rotate: 0,
  x: 0,
  y: 0
};

// Dragging state for canvas pan
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let activeTransformStart = { x: 0, y: 0 };

// Default Form Values
const defaultValues = {
  name: '',
  role: '',
  class: '',
  bagItem1: '🥥 COCONUT',
  bagItem2: '💻 VS CODE',
  bagItem3: '🎧 LO-FI BEATS',
  shipping: '',
  id: '',
  theme: 'official-ring' // official-ring, tropical-palm, sunset-flora
};

// Constants for Format B coordinates (684x1024)
const BADGE_WIDTH = 684;
const BADGE_HEIGHT = 1024;
const AVATAR_X = 349;
const AVATAR_Y = 448;
const AVATAR_R = 158; // Inner radius of the photo border cutout

// Offscreen canvas to hold the template with a transparent avatar hole cut out
let offscreenTemplateCanvas = null;

// Initialize the Application
window.addEventListener('DOMContentLoaded', () => {
  // Load QRious library from CDN dynamically
  loadLibrary('https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js', () => {
    console.log('QRious loaded successfully');
    initQREncoder();
    redraw();
  });

  // Setup DOM elements and event listeners
  initDOM();
  
  // Load Template Image
  templateImage.onload = () => {
    isTemplateLoaded = true;
    createTemplateCutout();
    redraw();
  };
  templateImage.onerror = () => {
    console.error('Failed to load badge template. Please ensure badge_template.jpg exists in the workspace.');
    redraw();
  };
  templateImage.src = 'badge_template.jpg';

  // Load Badge Backgrounds
  badgeBgSunrise.onload = () => {
    isBgSunriseLoaded = true;
    redraw();
  };
  badgeBgSunrise.onerror = () => {
    console.error('Failed to load Sun rise.png');
  };
  badgeBgSunrise.src = 'assets/Sun rise.png';

  badgeBgSignpost.onload = () => {
    isBgSignpostLoaded = true;
    redraw();
  };
  badgeBgSignpost.onerror = () => {
    console.error('Failed to load hackers.png');
  };
  badgeBgSignpost.src = 'assets/hackers.png';

  badgeBgAgenda.onload = () => {
    isBgAgendaLoaded = true;
    redraw();
  };
  badgeBgAgenda.onerror = () => {
    console.error('Failed to load agenda.png');
  };
  badgeBgAgenda.src = 'assets/agenda.png';

  badgeBgLaptop.onload = () => {
    isBgLaptopLoaded = true;
    redraw();
  };
  badgeBgLaptop.onerror = () => {
    console.error('Failed to load details.png');
  };
  badgeBgLaptop.src = 'assets/details.png';

  badgeBgClassic.onload = () => {
    isBgClassicLoaded = true;
    redraw();
  };
  badgeBgClassic.onerror = () => {
    console.error('Failed to load badge_template.jpg for bg');
  };
  badgeBgClassic.src = 'badge_template.jpg';

  assetHackerHouseLogo.onload = () => {
    isHackerHouseLogoLoaded = true;
    redraw();
  };
  assetHackerHouseLogo.onerror = () => {
    console.error('Failed to load Hacker house.png logo');
  };
  assetHackerHouseLogo.src = 'assets/Hacker house.png';

  // Load PFP Assets
  assetGoaHindi.onload = () => {
    isGoaHindiLoaded = true;
    redraw();
  };
  assetGoaHindi.onerror = () => {
    console.error('Failed to load goa_hindi.svg asset');
  };
  assetGoaHindi.src = 'assets/goa_hindi.svg';

  assetFooterTrees.onload = () => {
    isFooterTreesLoaded = true;
    redraw();
  };
  assetFooterTrees.onerror = () => {
    console.error('Failed to load footer trees.png asset');
  };
  assetFooterTrees.src = 'assets/footer trees.png';

  // Generate random builder ID on page load
  generateRandomID();
});

// Load external script dynamically
function loadLibrary(url, callback) {
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = url;
  script.onload = callback;
  document.head.appendChild(script);
}

// Initialize QR Encoder helper
function initQREncoder() {
  if (typeof QRious !== 'undefined') {
    qrEncoder = new QRious({
      size: 150,
      level: 'H'
    });
  }
}

// Setup Event Listeners and UI Bindings
function initDOM() {
  // Input fields
  const inputs = ['input-name', 'input-role', 'input-class', 'input-shipping', 'input-id'];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', redraw);
    }
  });

  // Select dropdowns
  const selects = ['bag-item-1', 'bag-item-2', 'bag-item-3'];
  selects.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', redraw);
    }
  });

  // Sliders
  const sliderScale = document.getElementById('slider-scale');
  const sliderRotate = document.getElementById('slider-rotate');
  const sliderX = document.getElementById('slider-x');
  const sliderY = document.getElementById('slider-y');

  sliderScale.addEventListener('input', (e) => {
    transform.scale = parseFloat(e.target.value);
    redraw();
  });
  sliderRotate.addEventListener('input', (e) => {
    transform.rotate = parseInt(e.target.value);
    redraw();
  });
  sliderX.addEventListener('input', (e) => {
    transform.x = parseInt(e.target.value);
    redraw();
  });
  sliderY.addEventListener('input', (e) => {
    transform.y = parseInt(e.target.value);
    redraw();
  });

  // Reset transform button
  document.getElementById('btn-reset-transform').addEventListener('click', () => {
    resetTransform();
    redraw();
  });

  // File Upload Handlers
  const fileInput = document.getElementById('file-input');
  const dropZone = document.getElementById('drop-zone');

  // Drag and drop events
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  });

  dropZone.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleImageFile(e.target.files[0]);
    }
  });

  // Main Canvas Pan Dragging support
  const canvas = document.getElementById('generator-canvas');
  canvas.addEventListener('mousedown', (e) => {
    if (!userImage) return;
    isDragging = true;
    dragStart.x = e.clientX;
    dragStart.y = e.clientY;
    activeTransformStart.x = transform.x;
    activeTransformStart.y = transform.y;
    canvas.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    // Scale dragging coordinates based on preview scale ratio
    const rect = canvas.getBoundingClientRect();
    const scaleRatio = canvas.width / rect.width;
    
    transform.x = activeTransformStart.x + dx * scaleRatio;
    transform.y = activeTransformStart.y + dy * scaleRatio;
    
    // Sync to sliders
    document.getElementById('slider-x').value = transform.x;
    document.getElementById('slider-y').value = transform.y;
    
    redraw();
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      canvas.style.cursor = 'grab';
    }
  });

  // Touch screen dragging support
  canvas.addEventListener('touchstart', (e) => {
    if (!userImage || e.touches.length !== 1) return;
    isDragging = true;
    dragStart.x = e.touches[0].clientX;
    dragStart.y = e.touches[0].clientY;
    activeTransformStart.x = transform.x;
    activeTransformStart.y = transform.y;
  });

  canvas.addEventListener('touchmove', (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - dragStart.x;
    const dy = e.touches[0].clientY - dragStart.y;
    
    const rect = canvas.getBoundingClientRect();
    const scaleRatio = canvas.width / rect.width;
    
    transform.x = activeTransformStart.x + dx * scaleRatio;
    transform.y = activeTransformStart.y + dy * scaleRatio;
    
    // Sync to sliders
    document.getElementById('slider-x').value = transform.x;
    document.getElementById('slider-y').value = transform.y;
    
    redraw();
  });

  canvas.addEventListener('touchend', () => {
    isDragging = false;
  });
}

// Reset image adjustments
function resetTransform() {
  transform.scale = 1.0;
  transform.rotate = 0;
  transform.x = 0;
  transform.y = 0;

  document.getElementById('slider-scale').value = 1.0;
  document.getElementById('slider-rotate').value = 0;
  document.getElementById('slider-x').value = 0;
  document.getElementById('slider-y').value = 0;
}

// Set text input field value helper
function setFieldValue(id, val) {
  const el = document.getElementById(id);
  if (el) {
    el.value = val;
    redraw();
  }
}

// Generate a random Builder ID
function generateRandomID() {
  const digits = Math.floor(1000 + Math.random() * 9000);
  const idInput = document.getElementById('input-id');
  idInput.value = `#HH-GOA-${digits}`;
  redraw();
}

// Switch between formats
function switchFormat(format) {
  currentFormat = format;
  
  const tabBadge = document.getElementById('tab-badge');
  const tabPfp = document.getElementById('tab-pfp');
  const badgeFields = document.getElementById('badge-fields-panel');
  const pfpFields = document.getElementById('pfp-fields-panel');
  const canvasContainer = document.querySelector('.canvas-container');

  if (format === 'badge') {
    tabBadge.classList.add('active');
    tabPfp.classList.remove('active');
    badgeFields.classList.remove('hidden');
    pfpFields.classList.add('hidden');
    canvasContainer.classList.remove('pfp-aspect');
  } else {
    tabBadge.classList.remove('active');
    tabPfp.classList.add('active');
    badgeFields.classList.add('hidden');
    pfpFields.classList.remove('hidden');
    canvasContainer.classList.add('pfp-aspect');
  }
  
  resetTransform();
  redraw();
}

// Set active theme for Format A (PFP)
let activeTheme = 'official-ring';
function setTheme(theme) {
  activeTheme = theme;
  const options = document.querySelectorAll('.theme-option');
  options.forEach(opt => {
    if (opt.getAttribute('data-theme') === theme) {
      opt.classList.add('active');
    } else {
      opt.classList.remove('active');
    }
  });
  redraw();
}

// Trigger browser file dialog
function triggerFileInput() {
  document.getElementById('file-input').click();
}

// Process uploaded image file
function handleImageFile(file) {
  const loading = document.getElementById('canvas-loading');
  loading.classList.remove('hidden');

  const processImage = (imgSrc) => {
    const img = new Image();
    img.onload = () => {
      userImage = img;
      resetTransform();
      loading.classList.add('hidden');
      
      // Update upload UI
      document.getElementById('drop-zone').classList.add('hidden');
      document.getElementById('upload-success').classList.remove('hidden');
      document.getElementById('success-filename').textContent = file.name;
      
      redraw();
    };
    img.onerror = () => {
      loading.classList.add('hidden');
      alert('Error loading image file.');
    };
    img.src = imgSrc;
  };

  // Handle HEIC/HEIF files
  if (file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic') {
    if (typeof heic2any !== 'undefined') {
      heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.8
      })
      .then((convertedBlob) => {
        const reader = new FileReader();
        reader.onload = (e) => processImage(e.target.result);
        reader.readAsDataURL(convertedBlob);
      })
      .catch((err) => {
        console.error('HEIC conversion failed:', err);
        loading.classList.add('hidden');
        alert('Failed to process iPhone HEIC image. Please upload a standard JPG or PNG file.');
      });
    } else {
      loading.classList.add('hidden');
      alert('HEIC file converter not loaded yet. Please try again or upload a JPG/PNG.');
    }
  } else {
    // Standard file formats (JPG, PNG)
    const reader = new FileReader();
    reader.onload = (e) => processImage(e.target.result);
    reader.readAsDataURL(file);
  }
}

// Create an offscreen template canvas with a transparent hole for the avatar
function createTemplateCutout() {
  offscreenTemplateCanvas = document.createElement('canvas');
  offscreenTemplateCanvas.width = BADGE_WIDTH;
  offscreenTemplateCanvas.height = BADGE_HEIGHT;
  
  const ctx = offscreenTemplateCanvas.getContext('2d');
  
  // 1. Draw original template
  ctx.drawImage(templateImage, 0, 0, BADGE_WIDTH, BADGE_HEIGHT);
  
  // 2. Cut out circular hole
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(AVATAR_X, AVATAR_Y, AVATAR_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Main Draw Dispatcher
function redraw() {
  const canvas = document.getElementById('generator-canvas');
  
  if (currentFormat === 'badge') {
    canvas.width = BADGE_WIDTH;
    canvas.height = BADGE_HEIGHT;
    drawBadge(canvas);
  } else {
    canvas.width = 800;
    canvas.height = 800;
    drawPFP(canvas);
  }
}

// Format B: Draw Builder ID Card
function drawBadge(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cardCenterX = 347.5;
  const creamBgColor = '#fbecd5';
  const darkGreenColor = '#032f14';
  const redTextColor = '#db3d5b';
  const yellowBgColor = '#fac002';
  
  const isClassic = currentBadgeTheme === 'classic';

  // 1. Resolve Background Image based on Selected Theme
  let bgImage = badgeBgClassic;
  let isBgLoaded = isBgClassicLoaded;

  if (currentBadgeTheme === 'sunrise') {
    bgImage = badgeBgSunrise;
    isBgLoaded = isBgSunriseLoaded;
  } else if (currentBadgeTheme === 'signpost') {
    bgImage = badgeBgSignpost;
    isBgLoaded = isBgSignpostLoaded;
  } else if (currentBadgeTheme === 'agenda') {
    bgImage = badgeBgAgenda;
    isBgLoaded = isBgAgendaLoaded;
  } else if (currentBadgeTheme === 'laptop') {
    bgImage = badgeBgLaptop;
    isBgLoaded = isBgLaptopLoaded;
  } else if (currentBadgeTheme === 'classic') {
    bgImage = badgeBgClassic;
    isBgLoaded = isBgClassicLoaded;
  }

  // 2. Draw Card Border Margin & Background Cutout
  // Draw card white margin
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, BADGE_WIDTH, BADGE_HEIGHT);

  ctx.save();
  const margin = 12;
  ctx.beginPath();
  roundRect(ctx, margin, margin, BADGE_WIDTH - 2 * margin, BADGE_HEIGHT - 2 * margin, 35);
  ctx.clip();

  // Draw background image cropped/centered
  if (isBgLoaded) {
    const imgW = bgImage.width;
    const imgH = bgImage.height;
    const targetW = BADGE_WIDTH;
    const targetH = BADGE_HEIGHT;
    
    const imgRatio = imgW / imgH;
    const targetRatio = targetW / targetH;
    let srcX = 0, srcY = 0, srcW = imgW, srcH = imgH;
    
    if (imgRatio > targetRatio) {
      srcW = imgH * targetRatio;
      srcX = (imgW - srcW) / 2;
    } else {
      srcH = imgW / targetRatio;
      srcY = (imgH - srcH) / 2;
    }
    
    ctx.drawImage(bgImage, srcX, srcY, srcW, srcH, 0, 0, targetW, targetH);
  } else {
    // Fallback solid cream card background
    ctx.fillStyle = creamBgColor;
    ctx.fillRect(0, 0, BADGE_WIDTH, BADGE_HEIGHT);
  }

  // 3. Draw Thick Outer Frame
  if (!isClassic) {
    ctx.strokeStyle = '#032f14'; // Dark green
    ctx.lineWidth = 26;
    ctx.beginPath();
    roundRect(ctx, margin, margin, BADGE_WIDTH - 2 * margin, BADGE_HEIGHT - 2 * margin, 35);
    ctx.stroke();

    // Draw Thin Inner Gold Border
    ctx.strokeStyle = '#fac002'; // Gold
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    roundRect(ctx, margin + 13, margin + 13, BADGE_WIDTH - 2 * margin - 26, BADGE_HEIGHT - 2 * margin - 26, 22);
    ctx.stroke();
  }
  ctx.restore();

  // 4. Draw Header Banner Ribbon & Logo Text dynamically
  // Red ribbon banner at top
  if (!isClassic) {
    ctx.save();
    ctx.fillStyle = '#db3d5b'; // red
    ctx.strokeStyle = '#fac002'; // gold
    ctx.lineWidth = 3.5;
    
    const banW = 110;
    const banH = 150;
    const banX = cardCenterX - banW / 2;
    const banY = 15;
    
    ctx.beginPath();
    roundRect(ctx, banX, banY, banW, banH, {tl: 0, tr: 0, br: 15, bl: 15});
    ctx.fill();
    ctx.stroke();
    
    // Ribbon details
    ctx.fillStyle = '#fac002';
    ctx.font = "800 13px 'Montserrat', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('HH', cardCenterX, banY + 45);
    ctx.fillText('GOA', cardCenterX, banY + 65);
    ctx.fillText('2026', cardCenterX, banY + 85);
    
    ctx.font = "18px Montserrat";
    ctx.fillText('🌴', cardCenterX, banY + 22);
    ctx.restore();

    // "HACKER HOUSE GOA" Logo
    if (isHackerHouseLogoLoaded) {
      const logoW = 450;
      const logoH = logoW * (assetHackerHouseLogo.height / assetHackerHouseLogo.width);
      ctx.drawImage(assetHackerHouseLogo, cardCenterX - logoW / 2, 178, logoW, logoH);
    } else {
      // Fallback Logo text
      ctx.fillStyle = '#032f14';
      ctx.font = "800 48px 'Cinzel', serif";
      ctx.textAlign = 'center';
      ctx.fillText('HACKER HOUSE', cardCenterX, 225);
    }
  }

  // 5. Draw User Photo (Clipped Circle) or Placeholder
  if (userImage) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(AVATAR_X, AVATAR_Y, AVATAR_R, 0, Math.PI * 2);
    ctx.clip();
    
    ctx.translate(AVATAR_X, AVATAR_Y);
    ctx.rotate((transform.rotate * Math.PI) / 180);
    ctx.scale(transform.scale, transform.scale);
    
    const w = userImage.width;
    const h = userImage.height;
    const minDim = Math.min(w, h);
    const drawSize = AVATAR_R * 2.1;
    const ratio = drawSize / minDim;
    
    ctx.drawImage(
      userImage,
      - (w * ratio) / 2 + transform.x,
      - (h * ratio) / 2 + transform.y,
      w * ratio,
      h * ratio
    );
    ctx.restore();
  } else {
    // Camera upload placeholder circle
    ctx.save();
    ctx.fillStyle = creamBgColor;
    ctx.beginPath();
    ctx.arc(AVATAR_X, AVATAR_Y, AVATAR_R, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#032f14';
    ctx.font = '55px FontAwesome';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📷', AVATAR_X, AVATAR_Y - 15);
    
    ctx.font = "800 12px 'Space Mono', monospace";
    ctx.fillText('UPLOAD PHOTO', AVATAR_X, AVATAR_Y + 35);
    ctx.restore();
  }

  // Gold & Pink rings around the photo
  ctx.save();
  ctx.strokeStyle = '#fac002'; // Gold ring
  ctx.lineWidth = 5.5;
  ctx.beginPath();
  ctx.arc(AVATAR_X, AVATAR_Y, AVATAR_R + 2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#ff007f'; // Pink outer ring border
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(AVATAR_X, AVATAR_Y, AVATAR_R + 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 6. Draw Plaques and Details
  // Get form input values
  const name = (document.getElementById('input-name').value || defaultValues.name).toUpperCase();
  const role = (document.getElementById('input-role').value || defaultValues.role).toUpperCase();
  const builderClass = (document.getElementById('input-class').value || defaultValues.class).toUpperCase();
  const bagItem1 = document.getElementById('bag-item-1').value;
  const bagItem2 = document.getElementById('bag-item-2').value;
  const bagItem3 = document.getElementById('bag-item-3').value;
  const shipping = (document.getElementById('input-shipping').value || defaultValues.shipping).toUpperCase();
  const builderId = (document.getElementById('input-id').value || defaultValues.id).toUpperCase();

  // A. NAME PLAQUE
  if (!isClassic) {
    ctx.fillStyle = darkGreenColor;
    ctx.strokeStyle = '#fac002'; // Gold
    ctx.lineWidth = 3.5;
    
    const pillW = 494;
    const pillH = 66;
    const pillX = cardCenterX - pillW / 2;
    const pillY = 652 - pillH / 2;
    
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, pillX, pillY, pillW, pillH, 10);
    ctx.fill();
    ctx.stroke();

    // Stars
    ctx.fillStyle = '#fac002';
    ctx.font = '16px Montserrat';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✦', pillX + 24, 652 + 1);
    ctx.fillText('✦', pillX + pillW - 24, 652 + 1);
    ctx.restore();
  }

  // Text
  ctx.save();
  ctx.fillStyle = '#fcfaf2';
  let nameFontSize = 23;
  if (name.length > 20) nameFontSize = 16;
  else if (name.length > 16) nameFontSize = 19;
  else if (name.length > 12) nameFontSize = 21;
  ctx.font = `800 ${nameFontSize}px 'Montserrat', sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(name, cardCenterX, 652 + 2);
  ctx.restore();

  // B. ROLE/STACK PLAQUE
  if (!isClassic) {
    ctx.save();
    ctx.fillStyle = yellowBgColor;
    const roleW = 494;
    const roleH = 40;
    const roleX = cardCenterX - roleW / 2;
    const roleY = 713 - roleH / 2;
    
    ctx.beginPath();
    roundRect(ctx, roleX, roleY, roleW, roleH, 6);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.fillStyle = darkGreenColor;
  let roleFontSize = 14;
  if (role.length > 24) roleFontSize = 10;
  else if (role.length > 20) roleFontSize = 11;
  else if (role.length > 15) roleFontSize = 12;
  ctx.font = `800 ${roleFontSize}px 'Space Mono', monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`⚡  ${role}  ⚡`, cardCenterX, 713 + 1);
  ctx.restore();

  // C. UNIFIED DETAILS FOOTER PANEL
  if (!isClassic) {
    ctx.save();
    ctx.fillStyle = creamBgColor;
    ctx.strokeStyle = '#032f14';
    ctx.lineWidth = 3.5;
    
    const panelX = 35;
    const panelY = 740;
    const panelW = BADGE_WIDTH - 2 * panelX;
    const panelH = 225;
    
    ctx.beginPath();
    roundRect(ctx, panelX, panelY, panelW, panelH, 15);
    ctx.fill();
    ctx.stroke();

    // Column Dividers (Red dotted lines)
    ctx.strokeStyle = '#db3d5b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.moveTo(230, panelY + 15);
    ctx.lineTo(230, panelY + panelH - 25);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(435, panelY + 15);
    ctx.lineTo(435, panelY + panelH - 25);
    ctx.stroke();
    ctx.setLineDash([]); // Reset
    ctx.restore();
  }

  // D. COLUMN 1 DETAILS: BUILDER CLASS & QR CODE
  // Column 1 Header Label
  if (!isClassic) {
    ctx.save();
    ctx.fillStyle = darkGreenColor;
    ctx.font = "800 9px 'Space Mono', monospace";
    ctx.textAlign = 'center';
    ctx.fillText('BUILDER CLASS', 128.5, 760);
    ctx.restore();
  }

  // Builder Class Text
  ctx.save();
  ctx.fillStyle = redTextColor;
  let classFontSize = 17;
  if (builderClass.length > 16) classFontSize = 11;
  else if (builderClass.length > 12) classFontSize = 13;
  ctx.font = `800 ${classFontSize}px 'Montserrat', sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(builderClass, 128.5, 786);
  ctx.restore();

  // QR Code
  ctx.save();
  if (qrEncoder && name && builderId) {
    const shareUrl = `https://frame.hhgoa.com/?name=${encodeURIComponent(name)}&id=${encodeURIComponent(builderId)}`;
    qrEncoder.value = shareUrl;
    
    const qrCanvas = qrEncoder.canvas;
    ctx.drawImage(qrCanvas, 77, 832, 105, 105);
    
    // Palm tree overlay center
    ctx.fillStyle = creamBgColor;
    ctx.fillRect(115, 870, 28, 28);
    
    ctx.fillStyle = darkGreenColor;
    ctx.font = '18px Montserrat';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🌴', 129, 884);
  } else {
    ctx.strokeStyle = darkGreenColor;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(77, 832, 105, 105);
    ctx.fillStyle = darkGreenColor;
    ctx.font = "800 10px 'Space Mono', monospace";
    ctx.textAlign = 'center';
    ctx.fillText('QR CODE', 129, 884);
  }
  ctx.restore();

  // E. COLUMN 2 DETAILS: BEACH BAG ESSENTIALS
  // Column 2 Header Label
  if (!isClassic) {
    ctx.save();
    ctx.fillStyle = darkGreenColor;
    ctx.font = "800 9px 'Space Mono', monospace";
    ctx.textAlign = 'center';
    ctx.fillText('BEACH BAG ESSENTIALS', 332, 760);
    ctx.restore();
  }

  ctx.save();
  ctx.fillStyle = darkGreenColor;
  ctx.font = `700 13px 'Space Mono', monospace`;
  ctx.textAlign = 'left';
  ctx.fillText(bagItem1, 268, 781);
  ctx.fillText(bagItem2, 268, 816);
  ctx.fillText(bagItem3, 268, 851);
  ctx.restore();

  // F. COLUMN 3 DETAILS: SHIPPING, ID & BARCODE
  // Column 3 Header Label
  if (!isClassic) {
    ctx.save();
    ctx.fillStyle = darkGreenColor;
    ctx.font = "800 9px 'Space Mono', monospace";
    ctx.textAlign = 'center';
    ctx.fillText('CURRENTLY SHIPPING', 540.5, 760);
    
    // Builder ID label
    ctx.fillText('BUILDER ID', 539.5, 830);
    ctx.restore();
  }

  // Shipping project
  ctx.save();
  ctx.fillStyle = redTextColor;
  let shipFontSize = 15;
  if (shipping.length > 18) shipFontSize = 11;
  else if (shipping.length > 14) shipFontSize = 13;
  ctx.font = `800 ${shipFontSize}px 'Montserrat', sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(shipping, 540.5, 792);

  // Builder ID value
  ctx.fillStyle = darkGreenColor;
  ctx.font = `700 13.5px 'Space Mono', monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(builderId || '#HH-GOA-XXXX', 539.5, 853);
  ctx.restore();

  // Barcode
  ctx.save();
  ctx.fillStyle = darkGreenColor;
  const bX = 460;
  const bY = 872;
  const bW = 160;
  const bH = 34;
  
  let seed = 0;
  const barcodeStr = builderId || '#HH-GOA-0000';
  for (let i = 0; i < barcodeStr.length; i++) {
    seed += barcodeStr.charCodeAt(i);
  }
  
  let currentX = bX;
  let idx = 0;
  while (currentX < bX + bW) {
    const val = Math.sin(seed + idx) * 1000;
    const step = Math.floor(Math.abs(val) % 4) + 1; // line width 1-4px
    const gap = Math.floor(Math.abs(val / 10) % 4) + 1; // gap width 1-4px
    
    ctx.fillRect(currentX, bY, step, bH);
    currentX += step + gap;
    idx++;
  }
  ctx.restore();

  // G. DYNAMIC #FRAMEINGOA BOTTOM RIBBON
  if (!isClassic) {
    ctx.save();
    ctx.fillStyle = '#db3d5b'; // pink/red
    ctx.strokeStyle = '#fac002'; // gold
    ctx.lineWidth = 2.5;
    
    const ribbonW = 320;
    const ribbonH = 34;
    const ribbonX = cardCenterX - ribbonW / 2;
    const ribbonY = 948;
    
    ctx.beginPath();
    roundRect(ctx, ribbonX, ribbonY, ribbonW, ribbonH, 17);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#fcfaf2';
    ctx.font = "800 12.5px 'Montserrat', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✦  #FRAMEINGOA  ✦', cardCenterX, ribbonY + ribbonH / 2 + 1);
    ctx.restore();
  }
}

// Helper to draw text along a circular arc
function drawTextAlongArc(ctx, text, x, y, radius, angle, top) {
  ctx.save();
  ctx.translate(x, y);
  
  // Calculate total angular width of the text
  let totalAngle = 0;
  const charAngles = [];
  for (let i = 0; i < text.length; i++) {
    const charWidth = ctx.measureText(text[i]).width;
    // Add tiny letter spacing
    const charAngle = (charWidth + 2) / radius;
    charAngles.push(charAngle);
    totalAngle += charAngle;
  }
  
  if (top) {
    // Start from left (smallest angle) and go to right (largest angle)
    let currentAngle = angle - (totalAngle / 2);
    for (let i = 0; i < text.length; i++) {
      ctx.save();
      ctx.rotate(currentAngle + charAngles[i] / 2);
      ctx.translate(0, -radius);
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
      currentAngle += charAngles[i];
    }
  } else {
    // Start from left (smallest angle) and go to right (largest angle)
    let currentAngle = angle - (totalAngle / 2);
    for (let i = 0; i < text.length; i++) {
      ctx.save();
      // Rotate 180 degrees so characters face upright, translate by negative radius to draw at bottom
      ctx.rotate(currentAngle + charAngles[i] / 2 + Math.PI);
      ctx.translate(0, -radius);
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
      currentAngle += charAngles[i];
    }
  }
  ctx.restore();
}

// Format A: Draw PFP Frame / Overlay
function drawPFP(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  if (activeTheme === 'official-ring') {
    drawCircularRingPFP(ctx, w, h);
  } else if (activeTheme === 'tropical-palm') {
    drawTropicalPalmPFP(ctx, w, h);
  } else {
    drawSunsetFloraPFP(ctx, w, h);
  }
}

// Style 1: Official Circular Ring
function drawCircularRingPFP(ctx, w, h) {
  const centerX = w / 2;
  const centerY = h / 2;
  const pfpR = 290; // Photo radius
  const ringOuterR = 350; // Ring outer edge
  const textRadius = 320; // Radius where text sits
  
  // 1. Draw User Photo (Clipped to a circle)
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, pfpR, 0, Math.PI * 2);
  ctx.clip();

  if (userImage) {
    ctx.translate(centerX, centerY);
    ctx.rotate((transform.rotate * Math.PI) / 180);
    ctx.scale(transform.scale, transform.scale);

    const imgW = userImage.width;
    const imgH = userImage.height;
    const minDim = Math.min(imgW, imgH);
    const ratio = (pfpR * 2.2) / minDim;

    ctx.drawImage(
      userImage,
      - (imgW * ratio) / 2 + transform.x,
      - (imgH * ratio) / 2 + transform.y,
      imgW * ratio,
      imgH * ratio
    );
  } else {
    // Placeholder gradient
    const grad = ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, pfpR);
    grad.addColorStop(0, '#fbecd5');
    grad.addColorStop(1, '#ffd8ad');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.fillStyle = '#032f14';
    ctx.font = '110px FontAwesome';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📷', centerX, centerY - 20);

    ctx.font = "800 22px 'Montserrat', sans-serif";
    ctx.fillText('UPLOAD YOUR PHOTO', centerX, centerY + 80);
  }
  ctx.restore();

  // 2. Draw Green Ring Frame
  ctx.save();
  ctx.lineWidth = 60; // thickness of ring (350 - 290)
  ctx.strokeStyle = '#032f14'; // Dark green
  ctx.beginPath();
  ctx.arc(centerX, centerY, (ringOuterR + pfpR) / 2, 0, Math.PI * 2);
  ctx.stroke();

  // Draw gold circle lines (inner & outer boundaries of green ring)
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = '#fac002'; // Gold
  ctx.beginPath();
  ctx.arc(centerX, centerY, pfpR + 1.5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(centerX, centerY, ringOuterR - 1.5, 0, Math.PI * 2);
  ctx.stroke();

  // 3. Draw Curved Text inside Ring
  ctx.fillStyle = '#fac002'; // Gold text
  ctx.font = "800 23.5px 'Montserrat', sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Top Text: HACKER HOUSE GOA
  drawTextAlongArc(ctx, 'HACKER HOUSE GOA', centerX, centerY, textRadius, 0, true);
  
  // Bottom Text: OCT 28-31 2026
  drawTextAlongArc(ctx, 'OCT 28-31 2026', centerX, centerY, textRadius, 0, false);

  // 4. Draw Magenta Diamonds on Left and Right
  ctx.fillStyle = '#ff007f';
  
  const drawDiamond = (dx, dy) => {
    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-8, -8, 16, 16);
    ctx.restore();
  };
  
  drawDiamond(centerX - textRadius, centerY);
  drawDiamond(centerX + textRadius, centerY);

  // 5. Draw bottom Devanagari overlay "गोवा"
  if (isGoaHindiLoaded) {
    ctx.drawImage(assetGoaHindi, centerX - 80, centerY + pfpR - 40, 160, 80);
  } else {
    // Beautiful fallback Devanagari using google font
    ctx.fillStyle = '#ff007f';
    ctx.font = "800 48px 'Yatra One', cursive";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('गोवा', centerX, centerY + pfpR);
  }
  ctx.restore();
}

// Style 2: Tropical Palm & Stamp
function drawTropicalPalmPFP(ctx, w, h) {
  const name = (document.getElementById('input-name').value || defaultValues.name).toUpperCase();
  const role = (document.getElementById('input-role').value || defaultValues.role).toUpperCase();
  
  // 1. Draw green background card
  ctx.fillStyle = '#032f14';
  ctx.fillRect(0, 0, w, h);

  // 2. Draw gold double borders
  ctx.strokeStyle = '#fac002';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, w - 10, h - 10);
  
  ctx.strokeStyle = '#032f14';
  ctx.lineWidth = 4;
  ctx.strokeRect(12, 12, w - 24, h - 24);

  ctx.strokeStyle = '#fac002';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(16, 16, w - 32, h - 32);

  // 3. Draw User Photo (Clipped to center circle)
  const centerX = w / 2;
  const centerY = h / 2 - 50; // Shifted up slightly
  const pfpR = 210;

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, pfpR, 0, Math.PI * 2);
  ctx.clip();

  if (userImage) {
    ctx.translate(centerX, centerY);
    ctx.rotate((transform.rotate * Math.PI) / 180);
    ctx.scale(transform.scale, transform.scale);

    const imgW = userImage.width;
    const imgH = userImage.height;
    const minDim = Math.min(imgW, imgH);
    const ratio = (pfpR * 2.2) / minDim;

    ctx.drawImage(
      userImage,
      - (imgW * ratio) / 2 + transform.x,
      - (imgH * ratio) / 2 + transform.y,
      imgW * ratio,
      imgH * ratio
    );
  } else {
    ctx.fillStyle = '#fbecd5';
    ctx.fillRect(centerX - pfpR, centerY - pfpR, pfpR * 2, pfpR * 2);
    ctx.fillStyle = '#032f14';
    ctx.font = '80px FontAwesome';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📷', centerX, centerY);
  }
  ctx.restore();

  // Draw gold circle frame around photo
  ctx.strokeStyle = '#fac002';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(centerX, centerY, pfpR + 1, 0, Math.PI * 2);
  ctx.stroke();

  // 4. Draw Tropical Palm leaves (Visual lines mockup)
  ctx.strokeStyle = '#9ac95f'; // light green palm leaf
  ctx.lineWidth = 3.5;
  
  // Top left corner leaves
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(25, 25);
    ctx.quadraticCurveTo(120 + i*15, 30 + i*30, 60 + i*40, 180 + i*10);
    ctx.stroke();
  }

  // 5. Draw Gold dashed circular stamp top-right
  const stampX = 665;
  const stampY = 145;
  ctx.strokeStyle = '#fac002';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(stampX, stampY, 55, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]); // Reset dash

  ctx.fillStyle = '#fac002';
  ctx.font = "800 8.5px 'Montserrat', sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  drawTextAlongArc(ctx, 'WELCOME TO GOA 2026 ✦', stampX, stampY, 46, -Math.PI / 2, true);
  
  ctx.font = '24px Montserrat';
  ctx.fillText('🌴', stampX, stampY);

  // Left vertical texts: CODE COLLAB CREATE
  ctx.fillStyle = '#fcfaf2';
  ctx.font = "800 17px 'Montserrat', sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText('C', 70, 290);
  ctx.fillText('O', 70, 310);
  ctx.fillText('D', 70, 330);
  ctx.fillText('E', 70, 350);

  ctx.fillText('S', 70, 390);
  ctx.fillText('H', 70, 410);
  ctx.fillText('I', 70, 430);
  ctx.fillText('P', 70, 450);

  // Right Side Graphic: Palm tree & coding symbol </>
  ctx.fillStyle = '#fac002';
  ctx.font = "800 24px 'Space Mono', monospace";
  ctx.fillText('</>', 720, 330);
  ctx.font = '35px Montserrat';
  ctx.fillText('🌴', 720, 410);

  // 6. Draw Name Plaque at bottom
  ctx.fillStyle = '#fcfaf2'; // Cream Plaque
  ctx.strokeStyle = '#fac002'; // Gold border
  ctx.lineWidth = 4;
  
  const nW = 550;
  const nH = 80;
  const nX = centerX - nW / 2;
  const nY = 620;
  
  ctx.beginPath();
  roundRect(ctx, nX, nY, nW, nH, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#032f14';
  let nameSize = 34;
  if (name.length > 20) nameSize = 22;
  else if (name.length > 15) nameSize = 27;
  
  ctx.font = `800 ${nameSize}px 'Montserrat', sans-serif`;
  ctx.fillText(name, centerX, nY + nH / 2 + 2);

  // Role and stack texts below plaque
  ctx.fillStyle = '#fac002';
  ctx.font = "800 18px 'Space Mono', monospace";
  ctx.fillText(role, centerX, 735);

  ctx.fillStyle = '#fcfaf2';
  ctx.font = "700 14px 'Space Mono', monospace";
  ctx.fillText('REACT • NODE.JS • MONGODB • TAILWIND', centerX, 765);
}

// Style 3: Sunset Flora & Barcode
function drawSunsetFloraPFP(ctx, w, h) {
  const name = (document.getElementById('input-name').value || defaultValues.name).toUpperCase();
  const role = (document.getElementById('input-role').value || defaultValues.role).toUpperCase();
  const builderClass = (document.getElementById('input-class').value || defaultValues.class).toUpperCase();
  const builderId = (document.getElementById('input-id').value || defaultValues.id).toUpperCase();

  // 1. Background
  ctx.fillStyle = '#032f14';
  ctx.fillRect(0, 0, w, h);

  // Gold outer thin border
  ctx.strokeStyle = '#fac002';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, w - 20, h - 20);

  // 2. Top Header text
  ctx.fillStyle = '#fac002';
  ctx.font = "800 28px 'Cinzel', serif";
  ctx.textAlign = 'center';
  ctx.fillText('HACKER HOUSE GOA', w / 2, 60);

  ctx.fillStyle = '#fcfaf2';
  ctx.font = "700 15px 'Space Mono', monospace";
  ctx.fillText('28 - 31 OCTOBER 2026', w / 2, 95);

  // 3. User Photo (Clipped inside a square border)
  const picX = 220;
  const picY = 135;
  const picW = 360;
  const picH = 360;

  ctx.save();
  ctx.beginPath();
  ctx.rect(picX, picY, picW, picH);
  ctx.clip();

  if (userImage) {
    ctx.translate(picX + picW / 2, picY + picH / 2);
    ctx.rotate((transform.rotate * Math.PI) / 180);
    ctx.scale(transform.scale, transform.scale);

    const imgW = userImage.width;
    const imgH = userImage.height;
    const minDim = Math.min(imgW, imgH);
    const ratio = (picW * 1.1) / minDim;

    ctx.drawImage(
      userImage,
      - (imgW * ratio) / 2 + transform.x,
      - (imgH * ratio) / 2 + transform.y,
      imgW * ratio,
      imgH * ratio
    );
  } else {
    ctx.fillStyle = '#fbecd5';
    ctx.fillRect(picX, picY, picW, picH);
    ctx.fillStyle = '#032f14';
    ctx.font = '80px FontAwesome';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📷', picX + picW / 2, picY + picH / 2);
  }
  ctx.restore();

  // Photo gold frame
  ctx.strokeStyle = '#fac002';
  ctx.lineWidth = 6;
  ctx.strokeRect(picX - 3, picY - 3, picW + 6, picH + 6);

  // Yellow ID badge in corner
  ctx.fillStyle = '#fac002';
  ctx.fillRect(picX - 3, picY - 3, 90, 30);
  ctx.fillStyle = '#032f14';
  ctx.font = "800 13px 'Space Mono', monospace";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(builderId.split('-').pop() || 'No. 081', picX + 42, picY + 12);

  // 4. Details Section Below Photo
  // Name
  ctx.fillStyle = '#fcfaf2';
  let nameSize = 34;
  if (name.length > 20) nameSize = 22;
  else if (name.length > 15) nameSize = 28;
  ctx.font = `800 ${nameSize}px 'Cinzel', serif`;
  ctx.fillText(name, w / 2, 542);

  // Role
  ctx.fillStyle = '#fac002';
  ctx.font = "800 16px 'Space Mono', monospace";
  ctx.fillText(role, w / 2, 582);

  // Builder Class pink banner
  ctx.fillStyle = '#ff007f'; // Hot pink
  const banW = 440;
  const banH = 46;
  const banX = w / 2 - banW / 2;
  const banY = 618;
  ctx.beginPath();
  roundRect(ctx, banX, banY, banW, banH, 23);
  ctx.fill();
  
  ctx.strokeStyle = '#fac002';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#fcfaf2';
  ctx.font = "800 15px 'Space Mono', monospace";
  ctx.fillText(builderClass, w / 2, banY + banH / 2 + 1);

  // 5. Draw bougainvillea floral trees footer border
  if (isFooterTreesLoaded) {
    ctx.drawImage(assetFooterTrees, 12, 672, w - 24, 115);
  } else {
    // Retro simple wave pink graphic as fallback
    ctx.fillStyle = '#ff007f';
    ctx.beginPath();
    ctx.moveTo(12, 700);
    ctx.bezierCurveTo(200, 720, 400, 680, w - 12, 700);
    ctx.lineTo(w - 12, 788);
    ctx.lineTo(12, 788);
    ctx.fill();
  }
}

// Canvas Rounded Rectangle Helper (works with paths)
function roundRect(ctx, x, y, width, height, radius) {
  if (typeof radius === 'undefined') {
    radius = 5;
  }
  if (typeof radius === 'number') {
    radius = {tl: radius, tr: radius, br: radius, bl: radius};
  } else {
    var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
    for (var side in defaultRadius) {
      radius[side] = radius[side] || defaultRadius[side];
    }
  }
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
}

// Trigger browser download of Canvas image
function downloadImage() {
  const canvas = document.getElementById('generator-canvas');
  const name = (document.getElementById('input-name').value || 'badge').trim().toLowerCase().replace(/\s+/g, '_');
  
  const link = document.createElement('a');
  link.download = `hh_goa_${currentFormat}_${name}.png`;
  link.href = canvas.toDataURL('image/png');
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function showToast(message) {
  let toast = document.getElementById('share-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'share-toast';
    toast.style.position = 'fixed';
    toast.style.bottom = '30px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = '#032f14';
    toast.style.color = '#fcfaf2';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '8px';
    toast.style.border = '2px solid #fac002';
    toast.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
    toast.style.fontFamily = "'Space Mono', monospace";
    toast.style.fontSize = '12.5px';
    toast.style.fontWeight = 'bold';
    toast.style.zIndex = '9999';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.4s ease';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  // Trigger reflow to restart transition
  toast.offsetHeight;
  toast.style.opacity = '1';
  setTimeout(() => {
    toast.style.opacity = '0';
  }, 4500);
}

// Open X (Twitter) Web Intent Share Compose box
function shareToX() {
  const name = (document.getElementById('input-name').value || 'Builder').trim();
  const idText = (document.getElementById('input-id').value || '#HH-GOA-7757').trim();
  
  let tweetText = '';
  if (currentFormat === 'badge') {
    tweetText = `Just got my official Builder ID card for Hacker House Goa 2026! Check it out! 🌴🛠️\n\nName: ${name}\nID: ${idText}\n\nBuild, ship, repeat! #FrameInGoa @HackerHouseGoa`;
  } else {
    tweetText = `Ready for Hacker House Goa 2026! Set my PFP frame. Let's build, ship, and repeat in paradise! 🌴🌊\n\n#FrameInGoa @HackerHouseGoa`;
  }
  
  const canvas = document.getElementById('generator-canvas');
  if (!canvas) {
    // Fallback if no canvas found
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(shareUrl, '_blank');
    return;
  }

  showToast("📤 Generating share link & copying card to clipboard...");

  // 1. Copy image to clipboard automatically
  try {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const item = new ClipboardItem({ "image/png": blob });
      navigator.clipboard.write([item])
        .then(() => console.log("Auto-copy to clipboard successful"))
        .catch(err => console.warn("Clipboard write failed", err));
    }, 'image/png');
  } catch (e) {
    console.warn("Clipboard API not supported", e);
  }

  // 2. Upload to tmpfiles.org to get a shareable URL
  canvas.toBlob((blob) => {
    if (!blob) {
      // Fallback if blob conversion fails
      const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
      window.open(shareUrl, '_blank');
      return;
    }

    const formData = new FormData();
    formData.append('file', blob, `hh_goa_${currentFormat}_card.png`);

    fetch('https://tmpfiles.org/api/v1/upload', {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    })
    .then(result => {
      if (result.status === 'success' && result.data && result.data.url) {
        // Convert to raw download link (tmpfiles.org/123/name.png -> tmpfiles.org/dl/123/name.png)
        const rawUrl = result.data.url;
        const dlUrl = rawUrl.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
        
        // Append URL to the tweet
        const tweetWithImage = `${tweetText}\n\n${dlUrl}`;
        const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetWithImage)}`;
        
        window.open(shareUrl, '_blank');
        showToast("✅ Share link ready! Tweet opened.");
      } else {
        throw new Error("Invalid response format");
      }
    })
    .catch(err => {
      console.warn("tmpfiles.org upload failed:", err);
      // Fallback - Open standard tweet and remind user to paste
      const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
      window.open(shareUrl, '_blank');
      showToast("📋 Copy successful! Paste (Cmd+V/Ctrl+V) the card in the composer.");
    });
  }, 'image/png');
}

// Set active badge style theme
function setBadgeTheme(theme) {
  currentBadgeTheme = theme;
  // Update active state class in UI
  document.querySelectorAll('[data-badge-theme]').forEach(el => {
    el.classList.remove('active');
  });
  const activeEl = document.querySelector(`[data-badge-theme="${theme}"]`);
  if (activeEl) {
    activeEl.classList.add('active');
  }
  redraw();
}

window.setBadgeTheme = setBadgeTheme;
