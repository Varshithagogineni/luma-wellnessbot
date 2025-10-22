// Panda Animation Initialization
(function initPandaAnimation() {
  // Wait for Lottie to be available
  if (typeof lottie === 'undefined') {
    console.error('Lottie library not loaded');
    return;
  }

  // Load and render panda animation
  const anim = lottie.loadAnimation({
    container: document.getElementById('panda-animation'),
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: 'Panda Waving.json', // Load the panda animation JSON
    speed: 0.8 // Animation speed (0.8 is slightly slower than normal)
  });

  // Ensure animation plays smoothly based on frame duration
  anim.addEventListener('DOMLoaded', function() {
    // Animation successfully loaded
    console.log('Panda animation loaded successfully');
    // The animation will now play with frame-based timing
  });

  anim.addEventListener('error', function(error) {
    console.error('Error loading panda animation:', error);
  });
})();
