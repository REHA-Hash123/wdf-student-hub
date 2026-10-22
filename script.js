/**
 * STUDENT HUB - EXTERNAL JAVASCRIPT
 * Handles customizable user profile avatar (upload, presets, URL, localStorage),
 * real-time course search and category filtering, course enrollment, and toast notifications.
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // 1. PRESET AVATARS GENERATOR (High quality student SVGs)
  // ==========================================================================
  const PRESET_AVATARS = [
    {
      id: 'avatar-1',
      name: 'Scholar Boy',
      svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%237C8363"/><circle cx="50" cy="42" r="20" fill="%23FFDCB2"/><path d="M50 20c-12 0-22 8-22 20 0 3 .5 6 1.5 8.5 2-8 8.5-13.5 20.5-13.5s18.5 5.5 20.5 13.5c1-2.5 1.5-5.5 1.5-8.5 0-12-10-20-21.5-20z" fill="%232D3748"/><circle cx="43" cy="42" r="2.5" fill="%232D3748"/><circle cx="57" cy="42" r="2.5" fill="%232D3748"/><path d="M46 51 Q50 55 54 51" stroke="%232D3748" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M22 88c5-15 16-24 28-24s23 9 28 24" fill="%23F6C892"/></svg>`
    },
    {
      id: 'avatar-2',
      name: 'Tech Girl',
      svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23EBB87A"/><circle cx="50" cy="43" r="20" fill="%23FFE3C6"/><path d="M30 40c0-14 9-23 20-23s20 9 20 23v14c-4-4-9-6-15-6-4 0-7 2-10 4-3-2-6-4-10-4-2 0-3 .5-5 2z" fill="%235D4037"/><circle cx="44" cy="43" r="2.5" fill="%232D3748"/><circle cx="56" cy="43" r="2.5" fill="%232D3748"/><path d="M47 51 Q50 54 53 51" stroke="%23E57373" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M24 90c4-16 15-25 26-25s22 9 26 25" fill="%237C8363"/></svg>`
    },
    {
      id: 'avatar-3',
      name: 'Creative Guy',
      svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%234A5568"/><circle cx="50" cy="42" r="19" fill="%23FBD38D"/><path d="M28 35c3-10 12-16 22-16s19 6 22 16c-3-2-8-3-14-1-6 2-10-2-15 0-6 2-11 0-15 1z" fill="%23D69E2E"/><circle cx="43" cy="42" r="2.5" fill="%232D3748"/><circle cx="57" cy="42" r="2.5" fill="%232D3748"/><circle cx="43" cy="42" r="6" fill="none" stroke="%232D3748" stroke-width="1.5"/><circle cx="57" cy="42" r="6" fill="none" stroke="%232D3748" stroke-width="1.5"/><line x1="49" y1="42" x2="51" y2="42" stroke="%232D3748" stroke-width="2"/><path d="M46 51 Q50 55 54 51" stroke="%232D3748" stroke-width="2" fill="none"/><path d="M24 88c5-14 15-22 26-22s21 8 26 22" fill="%23ED8936"/></svg>`
    },
    {
      id: 'avatar-4',
      name: 'Leader',
      svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23319795"/><circle cx="50" cy="44" r="19" fill="%23EDD0B2"/><path d="M29 34c4-12 11-16 21-16s17 4 21 16v18c-3-3-8-5-13-5-4 0-7 2-9 4-3-2-6-4-9-4-5 0-9 2-11 5z" fill="%232C3E50"/><circle cx="44" cy="44" r="2.5" fill="%232D3748"/><circle cx="56" cy="44" r="2.5" fill="%232D3748"/><path d="M47 52 Q50 56 53 52" stroke="%232D3748" stroke-width="2" fill="none"/><path d="M25 88c5-13 14-21 25-21s20 8 25 21" fill="%23FAF089"/></svg>`
    },
    {
      id: 'avatar-5',
      name: 'Designer',
      svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23DD6B20"/><circle cx="50" cy="43" r="19" fill="%23FFD8A8"/><path d="M32 30c5-8 11-12 18-12s13 4 18 12c-4 0-7 3-10 7-3-4-8-4-12-3-4 1-8-2-14-4z" fill="%231A202C"/><circle cx="43" cy="42" r="2.5" fill="%232D3748"/><circle cx="57" cy="42" r="2.5" fill="%232D3748"/><path d="M46 51 Q50 55 54 51" stroke="%232D3748" stroke-width="2" fill="none"/><path d="M24 90c5-15 15-23 26-23s21 8 26 23" fill="%2368D391"/></svg>`
    },
    {
      id: 'avatar-6',
      name: 'Coder Girl',
      svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%236B46C1"/><circle cx="50" cy="43" r="20" fill="%23FEEBC8"/><path d="M30 42c0-12 9-22 20-22s20 10 20 22c-3-2-7-3-11-2-4 1-6-2-10-1-4 1-7-1-9 1-3 1-7 1-10 2z" fill="%234A5568"/><circle cx="43" cy="43" r="2.5" fill="%232D3748"/><circle cx="57" cy="43" r="2.5" fill="%232D3748"/><path d="M47 52 Q50 55 53 52" stroke="%23D53F8C" stroke-width="2" fill="none"/><path d="M25 89c5-14 14-22 25-22s20 8 25 22" fill="%23F6AD55"/></svg>`
    }
  ];

  // Default User Profile
  const DEFAULT_PROFILE = {
    name: 'Alex Morgan',
    role: 'Computer Science • Year 2',
    email: 'alex.morgan@studenthub.edu',
    avatarUrl: PRESET_AVATARS[0].svg,
    avatarId: 'avatar-1'
  };

  // State
  let userProfile = { ...DEFAULT_PROFILE };
  let pendingAvatarUrl = userProfile.avatarUrl;
  let enrolledCourses = [];

  // DOM Elements - Profile & Modal
  const profileCircleBtn = document.getElementById('profileCircleBtn');
  const userProfileImgs = document.querySelectorAll('.user-profile-img');
  const profileModalOverlay = document.getElementById('profileModalOverlay');
  const closeProfileModalBtn = document.getElementById('closeProfileModalBtn');
  const cancelProfileModalBtn = document.getElementById('cancelProfileModalBtn');
  const saveProfileModalBtn = document.getElementById('saveProfileModalBtn');
  const resetProfileBtn = document.getElementById('resetProfileBtn');
  
  const modalAvatarPreview = document.getElementById('modalAvatarPreview');
  const previewName = document.getElementById('previewName');
  const previewRole = document.getElementById('previewRole');
  const inputUserName = document.getElementById('inputUserName');
  const inputUserRole = document.getElementById('inputUserRole');
  
  const fileDropzone = document.getElementById('fileDropzone');
  const fileInputHidden = document.getElementById('fileInputHidden');
  const presetAvatarsContainer = document.getElementById('presetAvatarsContainer');
  const customUrlInput = document.getElementById('customUrlInput');
  const applyUrlBtn = document.getElementById('applyUrlBtn');

  // DOM Elements - Search, Filter, Courses
  const courseSearchInput = document.getElementById('courseSearchInput');
  const searchSubmitBtn = document.getElementById('searchSubmitBtn');
  const filterTabs = document.querySelectorAll('.filter-tab');
  const quickTagBtns = document.querySelectorAll('.tag-btn');
  const courseCards = document.querySelectorAll('.course-card');
  const noResultsBox = document.getElementById('noResultsBox');
  const resetSearchBtn = document.getElementById('resetSearchBtn');
  const toastContainer = document.getElementById('toastContainer');
  const cartBadgeCount = document.getElementById('cartBadgeCount');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mainNav = document.getElementById('mainNav');

  // ==========================================================================
  // 2. PROFILE INITIALIZATION & LOCALSTORAGE MANAGEMENT
  // ==========================================================================
  function loadProfileFromStorage() {
    try {
      const savedProfile = localStorage.getItem('studentHub_userProfile');
      if (savedProfile) {
        userProfile = JSON.parse(savedProfile);
      }
      const savedEnrolled = localStorage.getItem('studentHub_enrolledCourses');
      if (savedEnrolled) {
        enrolledCourses = JSON.parse(savedEnrolled);
      }
    } catch (e) {
      console.warn('Could not load profile from localStorage:', e);
    }
    updateProfileDisplay();
    updateEnrollmentDisplay();
  }

  function saveProfileToStorage() {
    try {
      localStorage.setItem('studentHub_userProfile', JSON.stringify(userProfile));
    } catch (e) {
      console.warn('Could not save profile to localStorage:', e);
    }
  }

  function saveEnrollmentToStorage() {
    try {
      localStorage.setItem('studentHub_enrolledCourses', JSON.stringify(enrolledCourses));
    } catch (e) {
      console.warn('Could not save enrollment to localStorage:', e);
    }
  }

  function updateProfileDisplay() {
    // Update all profile images on page (header circle, etc.)
    userProfileImgs.forEach(img => {
      img.src = userProfile.avatarUrl;
      img.alt = `${userProfile.name}'s Profile Picture`;
    });

    // Update modal preview if present
    if (modalAvatarPreview) {
      modalAvatarPreview.src = userProfile.avatarUrl;
    }
    if (previewName) {
      previewName.textContent = userProfile.name;
    }
    if (previewRole) {
      previewRole.textContent = userProfile.role;
    }
    if (inputUserName) {
      inputUserName.value = userProfile.name;
    }
    if (inputUserRole) {
      inputUserRole.value = userProfile.role;
    }
  }

  // Render Preset Avatars into the modal
  function renderPresetAvatars() {
    if (!presetAvatarsContainer) return;
    presetAvatarsContainer.innerHTML = '';
    
    PRESET_AVATARS.forEach(avatar => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `preset-avatar-btn ${userProfile.avatarId === avatar.id ? 'active' : ''}`;
      btn.title = `Choose ${avatar.name}`;
      btn.dataset.avatarId = avatar.id;
      
      const img = document.createElement('img');
      img.src = avatar.svg;
      img.alt = avatar.name;
      
      btn.appendChild(img);
      btn.addEventListener('click', () => {
        selectPresetAvatar(avatar);
      });
      presetAvatarsContainer.appendChild(btn);
    });
  }

  function selectPresetAvatar(avatar) {
    pendingAvatarUrl = avatar.svg;
    if (modalAvatarPreview) modalAvatarPreview.src = avatar.svg;
    
    // Highlight active button
    document.querySelectorAll('.preset-avatar-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.avatarId === avatar.id);
    });
    showToast(`Selected "${avatar.name}" avatar. Click 'Save Changes' to apply.`);
  }

  // ==========================================================================
  // 3. FILE UPLOADER & IMAGE CUSTOMIZER
  // ==========================================================================
  if (fileDropzone && fileInputHidden) {
    // Click on dropzone triggers hidden file input
    fileDropzone.addEventListener('click', () => {
      fileInputHidden.click();
    });

    // Drag and drop support
    fileDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileDropzone.style.borderColor = 'var(--color-olive)';
      fileDropzone.style.backgroundColor = 'var(--color-olive-light)';
    });

    fileDropzone.addEventListener('dragleave', () => {
      fileDropzone.style.borderColor = '';
      fileDropzone.style.backgroundColor = '';
    });

    fileDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      fileDropzone.style.borderColor = '';
      fileDropzone.style.backgroundColor = '';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processUploadedImage(e.dataTransfer.files[0]);
      }
    });

    // File input selection
    fileInputHidden.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        processUploadedImage(e.target.files[0]);
      }
    });
  }

  function processUploadedImage(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Please upload a valid image file (PNG, JPG, SVG, WebP).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size exceeds 5MB limit. Please choose a smaller image.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      pendingAvatarUrl = dataUrl;
      if (modalAvatarPreview) modalAvatarPreview.src = dataUrl;
      
      // Clear preset active states
      document.querySelectorAll('.preset-avatar-btn').forEach(b => b.classList.remove('active'));
      
      showToast('Custom photo loaded! Click "Save Changes" to apply.');
    };
    reader.onerror = () => {
      showToast('Failed to read image file.', 'error');
    };
    reader.readAsDataURL(file);
  }

  // Custom Image URL handler
  if (applyUrlBtn && customUrlInput) {
    applyUrlBtn.addEventListener('click', () => {
      const url = customUrlInput.value.trim();
      if (!url) {
        showToast('Please enter an image URL.');
        return;
      }
      
      // Test if image loads
      const testImg = new Image();
      testImg.onload = () => {
        pendingAvatarUrl = url;
        if (modalAvatarPreview) modalAvatarPreview.src = url;
        document.querySelectorAll('.preset-avatar-btn').forEach(b => b.classList.remove('active'));
        showToast('Image URL applied to preview! Click "Save Changes".');
      };
      testImg.onerror = () => {
        showToast('Could not load image from this URL. Please verify link.', 'error');
      };
      testImg.src = url;
    });
  }

  // ==========================================================================
  // 4. PROFILE MODAL CONTROLS (OPEN / CLOSE / SAVE / RESET)
  // ==========================================================================
  function openProfileModal() {
    if (!profileModalOverlay) return;
    pendingAvatarUrl = userProfile.avatarUrl;
    if (modalAvatarPreview) modalAvatarPreview.src = userProfile.avatarUrl;
    if (inputUserName) inputUserName.value = userProfile.name;
    if (inputUserRole) inputUserRole.value = userProfile.role;
    renderPresetAvatars();
    profileModalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // prevent scroll
  }

  function closeProfileModal() {
    if (!profileModalOverlay) return;
    profileModalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (profileCircleBtn) {
    profileCircleBtn.addEventListener('click', openProfileModal);
  }

  if (closeProfileModalBtn) {
    closeProfileModalBtn.addEventListener('click', closeProfileModal);
  }

  if (cancelProfileModalBtn) {
    cancelProfileModalBtn.addEventListener('click', closeProfileModal);
  }

  // Close when clicking outside modal
  if (profileModalOverlay) {
    profileModalOverlay.addEventListener('click', (e) => {
      if (e.target === profileModalOverlay) {
        closeProfileModal();
      }
    });
  }

  // Close with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && profileModalOverlay && profileModalOverlay.classList.contains('active')) {
      closeProfileModal();
    }
  });

  // Save Changes
  if (saveProfileModalBtn) {
    saveProfileModalBtn.addEventListener('click', () => {
      const newName = inputUserName.value.trim() || 'Alex Morgan';
      const newRole = inputUserRole.value.trim() || 'Student';

      userProfile.name = newName;
      userProfile.role = newRole;
      userProfile.avatarUrl = pendingAvatarUrl;

      // Check if matches a preset avatar id
      const matchedPreset = PRESET_AVATARS.find(a => a.svg === pendingAvatarUrl);
      userProfile.avatarId = matchedPreset ? matchedPreset.id : 'custom';

      saveProfileToStorage();
      updateProfileDisplay();
      closeProfileModal();
      showToast('Profile picture and details saved successfully!');
    });
  }

  // Reset to Default
  if (resetProfileBtn) {
    resetProfileBtn.addEventListener('click', () => {
      if (confirm('Reset profile avatar and information to default?')) {
        userProfile = { ...DEFAULT_PROFILE };
        pendingAvatarUrl = DEFAULT_PROFILE.avatarUrl;
        saveProfileToStorage();
        updateProfileDisplay();
        renderPresetAvatars();
        showToast('Profile reset to default.');
      }
    });
  }

  // ==========================================================================
  // 5. LIVE COURSE SEARCH & FILTER ENGINE
  // ==========================================================================
  function filterCourses() {
    const query = courseSearchInput ? courseSearchInput.value.toLowerCase().trim() : '';
    const activeTab = document.querySelector('.filter-tab.active');
    const selectedCategory = activeTab ? activeTab.dataset.category.toLowerCase() : 'all';

    let visibleCount = 0;

    courseCards.forEach(card => {
      const title = (card.querySelector('.card-title')?.textContent || '').toLowerCase();
      const category = (card.dataset.category || '').toLowerCase();
      const tags = (card.dataset.tags || '').toLowerCase();

      const matchesSearch = !query || title.includes(query) || category.includes(query) || tags.includes(query);
      const matchesCategory = selectedCategory === 'all' || category === selectedCategory;

      if (matchesSearch && matchesCategory) {
        card.style.display = 'flex';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (noResultsBox) {
      noResultsBox.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  }

  if (courseSearchInput) {
    courseSearchInput.addEventListener('input', filterCourses);
  }

  if (searchSubmitBtn) {
    searchSubmitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      filterCourses();
      // Smooth scroll to courses section
      const popularSection = document.getElementById('popularCoursesSection');
      if (popularSection) {
        popularSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // Category filter tabs
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      filterCourses();
    });
  });

  // Quick tag buttons in hero
  quickTagBtns.forEach(tagBtn => {
    tagBtn.addEventListener('click', () => {
      const tagText = tagBtn.textContent.trim();
      if (courseSearchInput) {
        courseSearchInput.value = tagText;
      }
      filterCourses();
      const popularSection = document.getElementById('popularCoursesSection');
      if (popularSection) {
        popularSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      showToast(`Filtered courses by "${tagText}"`);
    });
  });

  // Reset search button inside empty state
  if (resetSearchBtn) {
    resetSearchBtn.addEventListener('click', () => {
      if (courseSearchInput) courseSearchInput.value = '';
      filterTabs.forEach(t => t.classList.remove('active'));
      const allTab = document.querySelector('.filter-tab[data-category="all"]');
      if (allTab) allTab.classList.add('active');
      filterCourses();
    });
  }

  // Dropdown filter support for courses.html (Wireframe 2)
  const courseFilterBtn = document.getElementById('courseFilterBtn');
  const courseSelectName = document.getElementById('courseSelectName');
  const facultySelect = document.getElementById('facultySelect');

  if (courseFilterBtn) {
    courseFilterBtn.addEventListener('click', () => {
      const selectedName = courseSelectName ? courseSelectName.value.toLowerCase().trim() : '';
      let visibleCount = 0;

      courseCards.forEach(card => {
        const title = (card.querySelector('.card-title')?.textContent || '').toLowerCase();
        const matchesName = !selectedName || title.includes(selectedName);

        if (matchesName) {
          card.style.display = 'flex';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      showToast(`Showing ${visibleCount} courses matching your criteria.`);
    });
  }

  // ==========================================================================
  // 6. COURSE ENROLLMENT SYSTEM
  // ==========================================================================
  function updateEnrollmentDisplay() {
    courseCards.forEach(card => {
      const courseId = card.dataset.courseId;
      const btn = card.querySelector('.enroll-btn');
      if (!btn) return;

      if (enrolledCourses.includes(courseId)) {
        btn.classList.add('enrolled');
        btn.textContent = 'ENROLLED';
      } else {
        btn.classList.remove('enrolled');
        btn.textContent = 'ENROLL';
      }
    });

    if (cartBadgeCount) {
      cartBadgeCount.textContent = enrolledCourses.length;
    }
  }

  document.querySelectorAll('.enroll-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = btn.closest('.course-card');
      if (!card) return;
      const courseId = card.dataset.courseId;
      const courseTitle = card.querySelector('.card-title')?.textContent || 'this course';

      if (enrolledCourses.includes(courseId)) {
        // Toggle unenroll
        enrolledCourses = enrolledCourses.filter(id => id !== courseId);
        btn.classList.remove('enrolled');
        btn.textContent = 'ENROLL';
        showToast(`Withdrawn from ${courseTitle}`);
      } else {
        // Enroll
        enrolledCourses.push(courseId);
        btn.classList.add('enrolled');
        btn.textContent = 'ENROLLED';
        showToast(`Enrolled successfully in "${courseTitle}".`);
      }

      saveEnrollmentToStorage();
      if (cartBadgeCount) {
        cartBadgeCount.textContent = enrolledCourses.length;
      }
    });
  });

  // ==========================================================================
  // 7. TOAST NOTIFICATION UTILITY
  // ==========================================================================
  function showToast(message, type = 'info') {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    
    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    icon.innerHTML = type === 'error' 
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>' 
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';

    const text = document.createElement('span');
    text.textContent = message;

    toast.appendChild(icon);
    toast.appendChild(text);
    toastContainer.appendChild(toast);

    // Trigger enter animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Auto remove after 3.5s
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3500);
  }

  // ==========================================================================
  // 8. MOBILE MENU TOGGLE
  // ==========================================================================
  if (mobileMenuBtn && mainNav) {
    mobileMenuBtn.addEventListener('click', () => {
      mainNav.classList.toggle('mobile-open');
    });
  }

  // Run on start
  loadProfileFromStorage();
  renderPresetAvatars();
});
