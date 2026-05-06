/**
 * script.js - Orphanage Management System
 * Global UI Interactions & Enhancements for Dark Theme App
 */

document.addEventListener('DOMContentLoaded', () => {

  // 1. Dashboard Stat Counters Animation
  const statCounters = document.querySelectorAll('.card h3');
  
  if (statCounters.length > 0) {
    statCounters.forEach(counter => {
      // Get the target number. If it contains symbols like commas or decimals, parse carefully.
      const targetStr = counter.innerText.replace(/,/g, '');
      const target = parseFloat(targetStr);
      
      if (!isNaN(target) && target > 0) {
        counter.innerText = '0';
        
        const duration = 1500; // ms
        const frameRate = 1000 / 60; // 60fps
        const totalFrames = Math.round(duration / frameRate);
        const increment = target / totalFrames;
        
        let current = 0;
        let frame = 0;
        
        const counterInterval = setInterval(() => {
          frame++;
          current += increment;
          
          if (frame >= totalFrames) {
            current = target;
            clearInterval(counterInterval);
          }
          
          // Format based on if it's a float or int
          if (target % 1 !== 0) {
            counter.innerText = current.toFixed(2);
          } else {
            counter.innerText = Math.floor(current).toString();
          }
        }, frameRate);
      }
    });
  }

  // 2. Auto-Dismiss Alert Messages
  const messageBoxes = document.querySelectorAll('.message-box, p[style*="color: red"], .error-message');
  
  messageBoxes.forEach(msg => {
    // Add default transitions via inline styles if not in CSS
    msg.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
    
    setTimeout(() => {
      msg.style.opacity = '0';
      msg.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        msg.style.display = 'none';
      }, 500); // Wait for transition to finish
    }, 4000); // 4 seconds before fade out
  });

  // 3. Client-Side Form Validation & Feedback
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Only handle forms that are not just simple search GET forms
    if (form.method.toUpperCase() === 'POST' && submitBtn) {
      
      form.addEventListener('submit', (e) => {
        let isValid = true;
        const requiredInputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        
        // Also check elements that might not have the required attribute but are logically required based on placeholder/name
        const allInputs = form.querySelectorAll('input:not([type="hidden"]):not([type="search"]), select, textarea');
        
        allInputs.forEach(input => {
          // Typically we should only force check if it's strictly required, 
          // but if we want to add basic visual checks, we do it here.
          // Let's assume name, email, phone etc are expected if they exist.
          if (input.value.trim() === '' && input.name !== 'search' && input.name !== 'guardian_note') {
            isValid = false;
            
            // Visual Shake & Error Border
            input.style.transition = 'all 0.3s ease';
            input.style.borderColor = '#ef4444'; // Red border
            input.style.boxShadow = '0 0 0 2px rgba(239, 68, 68, 0.2)';
            
            // Shake animation
            const keyframes = [
              { transform: 'translateX(0)' },
              { transform: 'translateX(-5px)' },
              { transform: 'translateX(5px)' },
              { transform: 'translateX(-5px)' },
              { transform: 'translateX(5px)' },
              { transform: 'translateX(0)' }
            ];
            input.animate(keyframes, { duration: 400, iterations: 1 });
            
            // Reset after interaction
            input.addEventListener('input', () => {
              input.style.borderColor = '';
              input.style.boxShadow = '';
            }, { once: true });
          }
        });
        
        // If not valid, optionally prevent submission (we won't strictly block here, let PHP handle the real check)
        // just visuals.
      });
      
      // Button interaction micro-animation
      submitBtn.addEventListener('mousedown', () => {
        submitBtn.style.transform = 'scale(0.97)';
      });
      submitBtn.addEventListener('mouseup', () => {
        submitBtn.style.transform = '';
      });
      submitBtn.addEventListener('mouseleave', () => {
        submitBtn.style.transform = '';
      });
    }
  });

  // 4. Smooth Page Content Transition
  const mainContent = document.querySelector('.main-content .page-wrap') || document.querySelector('.main-content');
  if (mainContent) {
    mainContent.style.opacity = '0';
    mainContent.style.transform = 'translateY(10px)';
    mainContent.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    
    // Trigger paint
    setTimeout(() => {
      mainContent.style.opacity = '1';
      mainContent.style.transform = 'translateY(0)';
    }, 50);
  }

  // 5. Active Link Highlight in Sidebar 
  // (In case PHP active state is missing, fallback to JS matching)
  const currentPath = window.location.pathname.split('/').pop() || 'index.php';
  const sidebarLinks = document.querySelectorAll('.sidebar ul li a');
  
  let hasActive = false;
  sidebarLinks.forEach(link => {
    if (link.classList.contains('active')) {
      hasActive = true;
    }
  });
  
  if (!hasActive) {
    sidebarLinks.forEach(link => {
      const linkPath = link.getAttribute('href').split('/').pop();
      if (linkPath === currentPath) {
        link.classList.add('active');
      }
    });
  }

  // 6. Custom Delete Confirmation Modal (bypasses native blocked `confirm()`)
  const deleteBtns = document.querySelectorAll('.delete-btn');
  deleteBtns.forEach(btn => {
    // Prevent the inline onclick from firing if it exists natively
    btn.removeAttribute('onclick');
    
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100vw';
      overlay.style.height = '100vh';
      overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
      overlay.style.backdropFilter = 'blur(6px)';
      overlay.style.display = 'flex';
      overlay.style.justifyContent = 'center';
      overlay.style.alignItems = 'center';
      overlay.style.zIndex = '9999';
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.2s ease';
      
      const modal = document.createElement('div');
      modal.style.background = 'var(--glass)';
      modal.style.border = '1px solid var(--glassborder)';
      modal.style.padding = '30px 40px';
      modal.style.borderRadius = '16px';
      modal.style.textAlign = 'center';
      modal.style.boxShadow = '0 25px 50px -12px rgba(0,0,0,0.5)';
      modal.style.color = 'white';
      modal.style.transform = 'translateY(20px)';
      modal.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      
      modal.innerHTML = `
        <h3 style="margin-bottom: 12px; font-size: 22px;">Confirm Deletion</h3>
        <p style="margin-bottom: 25px; color: var(--text-muted); font-size: 15px;">Are you sure you want to permanently delete this record?<br>This action cannot be undone.</p>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button id="cancelDelete" class="btn btn-outline" style="min-width: 100px;">Cancel</button>
          <button id="confirmDelete" class="btn" style="min-width: 100px; background: rgba(239, 68, 68, 0.8); border-color: transparent; color: white;">Delete</button>
        </div>
      `;
      
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      
      // Animate entry
      requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        modal.style.transform = 'translateY(0)';
      });
      
      const closeDialog = () => {
        overlay.style.opacity = '0';
        modal.style.transform = 'translateY(10px)';
        setTimeout(() => overlay.remove(), 250);
      };
      
      document.getElementById('cancelDelete').addEventListener('click', closeDialog);
      overlay.addEventListener('click', (e) => {
        if(e.target === overlay) closeDialog();
      });
      
      document.getElementById('confirmDelete').addEventListener('click', () => {
        document.getElementById('confirmDelete').innerText = 'Deleting...';
        document.getElementById('confirmDelete').style.opacity = '0.7';
        window.location.href = btn.href;
      });
    });
  });
});
