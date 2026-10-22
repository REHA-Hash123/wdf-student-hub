/**
 * STUDENT HUB - REGISTRATION FORM VALIDATION & INTERACTION ENGINE (register.js)
 * Implements HTML5 input validation, Regular Expressions, real-time password strength meter,
 * UX error feedback, accessible ARIA states, and registration ticket modal.
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // 1. REGULAR EXPRESSION PATTERNS
  // ==========================================================================
  const REGEX = {
    // Letters, spaces only, 3 to 50 characters
    name: /^[A-Za-z\s]{3,50}$/,
    
    // RFC 5322 compliant standard email pattern
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    
    // 10-digit mobile number starting with 6, 7, 8, or 9
    mobile: /^[6-9]\d{9}$/,
    
    // Password criteria patterns
    passwordLength: /.{8,}/,
    passwordLower: /[a-z]/,
    passwordUpper: /[A-Z]/,
    passwordNumber: /[0-9]/,
    passwordSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    
    // Combined strong password regex
    passwordFull: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/
  };

  // ==========================================================================
  // 2. DOM ELEMENTS
  // ==========================================================================
  const form = document.getElementById('studentRegistrationForm');
  const nameInput = document.getElementById('fullName');
  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  const mobileInput = document.getElementById('mobileNumber');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const courseSelect = document.getElementById('course');
  const termsCheckbox = document.getElementById('termsAccept');
  const clearBtn = document.getElementById('clearFormBtn');
  
  // Password Strength Meter Elements
  const meterProgress = document.getElementById('meterProgress');
  const meterLabel = document.getElementById('meterLabel');
  const checkLength = document.getElementById('checkLength');
  const checkUpper = document.getElementById('checkUpper');
  const checkLower = document.getElementById('checkLower');
  const checkNumber = document.getElementById('checkNumber');
  const checkSpecial = document.getElementById('checkSpecial');

  // Success Modal Elements
  const successModal = document.getElementById('successModalOverlay');
  const closeSuccessBtn = document.getElementById('closeSuccessBtn');
  const ticketRegId = document.getElementById('ticketRegId');
  const ticketName = document.getElementById('ticketName');
  const ticketEmail = document.getElementById('ticketEmail');
  const ticketMobile = document.getElementById('ticketMobile');
  const ticketCourse = document.getElementById('ticketCourse');
  const ticketYear = document.getElementById('ticketYear');
  const ticketGender = document.getElementById('ticketGender');

  // Track if user has attempted to submit
  let hasSubmitted = false;

  // ==========================================================================
  // 3. UX VALIDATION STATE HELPERS
  // ==========================================================================
  function getGroup(inputElement) {
    return inputElement.closest('.form-group');
  }

  function getErrorElement(inputElement) {
    const group = getGroup(inputElement);
    return group ? group.querySelector('.error-msg') : null;
  }

  function showError(inputElement, message) {
    const group = getGroup(inputElement);
    const errorEl = getErrorElement(inputElement);
    if (!group) return;

    group.classList.remove('is-valid');
    group.classList.add('is-invalid');

    if (errorEl) {
      errorEl.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>${message}</span>
      `;
    }

    if (inputElement.hasAttribute('aria-invalid')) {
      inputElement.setAttribute('aria-invalid', 'true');
    }
  }

  function showSuccess(inputElement) {
    const group = getGroup(inputElement);
    const errorEl = getErrorElement(inputElement);
    if (!group) return;

    group.classList.remove('is-invalid');
    group.classList.add('is-valid');

    if (errorEl) {
      errorEl.innerHTML = '';
    }

    if (inputElement.hasAttribute('aria-invalid')) {
      inputElement.setAttribute('aria-invalid', 'false');
    }
  }

  function clearValidation(inputElement) {
    const group = getGroup(inputElement);
    const errorEl = getErrorElement(inputElement);
    if (!group) return;

    group.classList.remove('is-invalid', 'is-valid');
    if (errorEl) {
      errorEl.innerHTML = '';
    }
    if (inputElement.hasAttribute('aria-invalid')) {
      inputElement.removeAttribute('aria-invalid');
    }
  }

  // ==========================================================================
  // 4. INDIVIDUAL FIELD VALIDATORS (WITH REGEX)
  // ==========================================================================

  // 1. Full Name Validation
  function validateName() {
    const val = nameInput.value.trim();
    if (!val) {
      showError(nameInput, 'Full name is required.');
      return false;
    }
    if (val.length < 3) {
      showError(nameInput, 'Name must be at least 3 characters long.');
      return false;
    }
    if (val.length > 50) {
      showError(nameInput, 'Name must not exceed 50 characters.');
      return false;
    }
    if (!REGEX.name.test(val)) {
      showError(nameInput, 'Name can only contain alphabets and spaces (no digits or symbols).');
      return false;
    }
    showSuccess(nameInput);
    return true;
  }

  // Username validation: 3-30 letters, digits, or underscores.
  function validateUsername() {
    const val = usernameInput.value.trim();
    if (!/^[A-Za-z0-9_]{3,30}$/.test(val)) {
      showError(usernameInput, 'Username must be 3–30 characters and contain only letters, numbers, or underscores.');
      return false;
    }
    showSuccess(usernameInput);
    return true;
  }

  // 2. Email Validation
  function validateEmail() {
    const val = emailInput.value.trim();
    if (!val) {
      showError(emailInput, 'Email address is required.');
      return false;
    }
    if (!REGEX.email.test(val)) {
      showError(emailInput, 'Please enter a valid email address (e.g. name@university.edu).');
      return false;
    }
    showSuccess(emailInput);
    return true;
  }

  // 3. Mobile Number Validation
  function validateMobile() {
    // Strip hyphens, spaces, and brackets
    const rawVal = mobileInput.value.trim().replace(/[\s\-\(\)]/g, '');
    
    if (!rawVal) {
      showError(mobileInput, 'Mobile number is required.');
      return false;
    }
    if (!/^\d+$/.test(rawVal)) {
      showError(mobileInput, 'Mobile number can only contain numeric digits.');
      return false;
    }
    if (rawVal.length !== 10) {
      showError(mobileInput, `Mobile number must be exactly 10 digits (currently ${rawVal.length}).`);
      return false;
    }
    if (!REGEX.mobile.test(rawVal)) {
      showError(mobileInput, 'Mobile number must start with 6, 7, 8, or 9.');
      return false;
    }
    showSuccess(mobileInput);
    return true;
  }

  // 4. Password Strength Meter & Validator
  function evaluatePasswordStrength(pwd) {
    const criteria = {
      length: REGEX.passwordLength.test(pwd),
      upper: REGEX.passwordUpper.test(pwd),
      lower: REGEX.passwordLower.test(pwd),
      number: REGEX.passwordNumber.test(pwd),
      special: REGEX.passwordSpecial.test(pwd)
    };

    // Update checklist UI
    if (checkLength) checkLength.classList.toggle('met', criteria.length);
    if (checkUpper) checkUpper.classList.toggle('met', criteria.upper);
    if (checkLower) checkLower.classList.toggle('met', criteria.lower);
    if (checkNumber) checkNumber.classList.toggle('met', criteria.number);
    if (checkSpecial) checkSpecial.classList.toggle('met', criteria.special);

    // Calculate score (0 to 5)
    let score = 0;
    if (criteria.length) score++;
    if (criteria.upper) score++;
    if (criteria.lower) score++;
    if (criteria.number) score++;
    if (criteria.special) score++;

    // Update Progress Bar & Label
    if (meterProgress && meterLabel) {
      meterProgress.className = 'meter-progress-bar';
      meterLabel.className = 'meter-label';

      if (!pwd) {
        meterProgress.style.width = '0%';
        meterLabel.textContent = 'None';
      } else if (score <= 2) {
        meterProgress.classList.add('weak');
        meterLabel.classList.add('weak');
        meterLabel.textContent = 'Weak';
      } else if (score === 3) {
        meterProgress.classList.add('fair');
        meterLabel.classList.add('fair');
        meterLabel.textContent = 'Fair';
      } else if (score === 4) {
        meterProgress.classList.add('good');
        meterLabel.classList.add('good');
        meterLabel.textContent = 'Good';
      } else if (score === 5) {
        meterProgress.classList.add('strong');
        meterLabel.classList.add('strong');
        meterLabel.textContent = 'Strong';
      }
    }

    return { criteria, score };
  }

  function validatePassword() {
    const val = passwordInput.value;
    const { score } = evaluatePasswordStrength(val);

    if (!val) {
      showError(passwordInput, 'Password is required.');
      return false;
    }
    if (val.length < 8) {
      showError(passwordInput, 'Password must be at least 8 characters long.');
      return false;
    }
    if (score < 4) {
      showError(passwordInput, 'Password is too weak. Please meet all strength criteria above.');
      return false;
    }
    showSuccess(passwordInput);

    // Re-check confirm password if it already has content
    if (confirmPasswordInput.value) {
      validateConfirmPassword();
    }
    return true;
  }

  // 5. Confirm Password Validation
  function validateConfirmPassword() {
    const pwd = passwordInput.value;
    const confirmVal = confirmPasswordInput.value;

    if (!confirmVal) {
      showError(confirmPasswordInput, 'Please confirm your password.');
      return false;
    }
    if (confirmVal !== pwd) {
      showError(confirmPasswordInput, 'Passwords do not match. Please verify.');
      return false;
    }
    showSuccess(confirmPasswordInput);
    return true;
  }

  // 6. Course Select Validation
  function validateCourse() {
    const val = courseSelect.value;
    if (!val) {
      showError(courseSelect, 'Please select your enrolled course or program.');
      return false;
    }
    showSuccess(courseSelect);
    return true;
  }

  // 7. Academic Year Validation
  function getSelectedYear() {
    const checked = document.querySelector('input[name="academicYear"]:checked');
    return checked ? checked.value : '';
  }

  function validateYear() {
    const yearContainer = document.getElementById('yearGroupContainer');
    const errorEl = yearContainer ? yearContainer.querySelector('.error-msg') : null;
    const selected = getSelectedYear();

    if (!selected) {
      if (yearContainer) {
        yearContainer.classList.add('is-invalid');
        yearContainer.classList.remove('is-valid');
      }
      if (errorEl) {
        errorEl.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>Please select your current academic year.</span>
        `;
      }
      return false;
    }

    if (yearContainer) {
      yearContainer.classList.remove('is-invalid');
      yearContainer.classList.add('is-valid');
    }
    if (errorEl) errorEl.innerHTML = '';
    return true;
  }

  // 8. Gender Validation
  function getSelectedGender() {
    const checked = document.querySelector('input[name="gender"]:checked');
    return checked ? checked.value : '';
  }

  function validateGender() {
    const genderContainer = document.getElementById('genderGroupContainer');
    const errorEl = genderContainer ? genderContainer.querySelector('.error-msg') : null;
    const selected = getSelectedGender();

    if (!selected) {
      if (genderContainer) {
        genderContainer.classList.add('is-invalid');
        genderContainer.classList.remove('is-valid');
      }
      if (errorEl) {
        errorEl.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>Please select your gender.</span>
        `;
      }
      return false;
    }

    if (genderContainer) {
      genderContainer.classList.remove('is-invalid');
      genderContainer.classList.add('is-valid');
    }
    if (errorEl) errorEl.innerHTML = '';
    return true;
  }

  // 9. Terms Acceptance Validation
  function validateTerms() {
    const termsGroup = document.getElementById('termsGroup');
    const errorEl = termsGroup ? termsGroup.querySelector('.error-msg') : null;

    if (!termsCheckbox.checked) {
      if (termsGroup) {
        termsGroup.classList.add('is-invalid');
        termsGroup.classList.remove('is-valid');
      }
      if (errorEl) {
        errorEl.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>You must accept the Terms of Service to register.</span>
        `;
      }
      return false;
    }

    if (termsGroup) {
      termsGroup.classList.remove('is-invalid');
      termsGroup.classList.add('is-valid');
    }
    if (errorEl) errorEl.innerHTML = '';
    return true;
  }

  // ==========================================================================
  // 5. EVENT LISTENERS: REAL-TIME & ON-BLUR
  // ==========================================================================

  // Full Name
  nameInput.addEventListener('blur', () => {
    if (nameInput.value.trim() || hasSubmitted) validateName();
  });
  nameInput.addEventListener('input', () => {
    if (hasSubmitted || nameInput.closest('.form-group').classList.contains('is-invalid')) {
      validateName();
    }
  });

  // Email
  emailInput.addEventListener('blur', () => {
    if (emailInput.value.trim() || hasSubmitted) validateEmail();
  });
  emailInput.addEventListener('input', () => {
    if (hasSubmitted || emailInput.closest('.form-group').classList.contains('is-invalid')) {
      validateEmail();
    }
  });

  // Mobile Number (formats clean numeric input)
  mobileInput.addEventListener('blur', () => {
    if (mobileInput.value.trim() || hasSubmitted) validateMobile();
  });
  mobileInput.addEventListener('input', () => {
    if (hasSubmitted || mobileInput.closest('.form-group').classList.contains('is-invalid')) {
      validateMobile();
    }
  });

  // Password Input (Real-time strength evaluation on every keystroke)
  passwordInput.addEventListener('input', () => {
    evaluatePasswordStrength(passwordInput.value);
    if (hasSubmitted || passwordInput.closest('.form-group').classList.contains('is-invalid')) {
      validatePassword();
    }
  });
  passwordInput.addEventListener('blur', () => {
    if (passwordInput.value || hasSubmitted) validatePassword();
  });

  // Confirm Password
  confirmPasswordInput.addEventListener('input', () => {
    if (hasSubmitted || confirmPasswordInput.closest('.form-group').classList.contains('is-invalid')) {
      validateConfirmPassword();
    }
  });
  confirmPasswordInput.addEventListener('blur', () => {
    if (confirmPasswordInput.value || hasSubmitted) validateConfirmPassword();
  });

  // Course Select
  courseSelect.addEventListener('change', () => {
    validateCourse();
  });

  // Radio Cards Selection Handlers (Year & Gender)
  document.querySelectorAll('.radio-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const radio = card.querySelector('input[type="radio"]');
      if (!radio) return;
      radio.checked = true;

      // Update active card styling within same group
      const name = radio.name;
      document.querySelectorAll(`input[name="${name}"]`).forEach(r => {
        r.closest('.radio-card')?.classList.remove('selected');
      });
      card.classList.add('selected');

      if (name === 'academicYear') validateYear();
      if (name === 'gender') validateGender();
    });
  });

  // Terms Checkbox
  termsCheckbox.addEventListener('change', () => {
    validateTerms();
  });

  // ==========================================================================
  // 6. PASSWORD VISIBILITY TOGGLE (EYE ICONS)
  // ==========================================================================
  document.querySelectorAll('.password-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const targetInput = document.getElementById(targetId);
      if (!targetInput) return;

      const isPassword = targetInput.type === 'password';
      targetInput.type = isPassword ? 'text' : 'password';

      // Switch icon (Eye open vs Eye slashed)
      btn.innerHTML = isPassword
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
           </svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
           </svg>`;
      btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    });
  });

  if (usernameInput) {
    usernameInput.addEventListener('blur', validateUsername);
    usernameInput.addEventListener('input', () => {
      if (hasSubmitted) validateUsername();
    });
  }

  // ==========================================================================
  // 7. FORM SUBMISSION VALIDATION & SUCCESS MODAL
  // ========================================================================== 
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      hasSubmitted = true;

      // Run all individual validators
      const isNameValid = validateName();
      const isUsernameValid = validateUsername();
      const isEmailValid = validateEmail();
      const isMobileValid = validateMobile();
      const isPasswordValid = validatePassword();
      const isConfirmValid = validateConfirmPassword();
      const isCourseValid = validateCourse();
      const isYearValid = validateYear();
      const isGenderValid = validateGender();
      const isTermsValid = validateTerms();

      const isFormValid = (
        isNameValid &&
        isUsernameValid &&
        isEmailValid &&
        isMobileValid &&
        isPasswordValid &&
        isConfirmValid &&
        isCourseValid &&
        isYearValid &&
        isGenderValid &&
        isTermsValid
      );

      if (!isFormValid) {
        // Focus first invalid element with smooth scroll
        const firstInvalid = form.querySelector('.form-group.is-invalid .form-input, .form-group.is-invalid .form-select, .form-group.is-invalid input[type="radio"], .form-group.is-invalid input[type="checkbox"]');
        if (firstInvalid) {
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstInvalid.focus();
        }

        // Show toast alert
        if (typeof showToast === 'function') {
          showToast('Please correct the highlighted errors before submitting.', 'error');
        }
        return;
      }

      // Send validated data to the PHP server for server-side validation and storage.
      // The server will hash the password and append the record to data/registrations.json.
      form.submit();
      return;

      // Legacy client-side success flow (not reached after server submission).
      // Generate Registration Data
      const regId = 'SH-' + Math.floor(100000 + Math.random() * 900000);
      const studentData = {
        regId: regId,
        fullName: nameInput.value.trim(),
        email: emailInput.value.trim(),
        mobile: mobileInput.value.trim(),
        course: courseSelect.options[courseSelect.selectedIndex].text,
        academicYear: getSelectedYear(),
        gender: getSelectedGender(),
        registeredAt: new Date().toISOString()
      };

      // Save to localStorage
      try {
        localStorage.setItem('studentHub_registeredStudent', JSON.stringify(studentData));

        // Also update shared user profile so top-right circle reflects the name!
        const existingProfile = JSON.parse(localStorage.getItem('studentHub_userProfile') || '{}');
        existingProfile.name = studentData.fullName;
        existingProfile.role = `${studentData.course} • ${studentData.academicYear}`;
        existingProfile.email = studentData.email;
        localStorage.setItem('studentHub_userProfile', JSON.stringify(existingProfile));
      } catch (err) {
        console.warn('Storage save error:', err);
      }

      // Populate Success Ticket Modal
      if (ticketRegId) ticketRegId.textContent = regId;
      if (ticketName) ticketName.textContent = studentData.fullName;
      if (ticketEmail) ticketEmail.textContent = studentData.email;
      if (ticketMobile) ticketMobile.textContent = studentData.mobile;
      if (ticketCourse) ticketCourse.textContent = studentData.course;
      if (ticketYear) ticketYear.textContent = studentData.academicYear;
      if (ticketGender) ticketGender.textContent = studentData.gender;

      // Display Success Modal
      if (successModal) {
        successModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }

      if (typeof showToast === 'function') {
        showToast('Registration successful! Welcome to Student Hub!');
      }
    });
  }

  // Close Success Modal
  if (closeSuccessBtn && successModal) {
    closeSuccessBtn.addEventListener('click', () => {
      successModal.classList.remove('active');
      document.body.style.overflow = '';
      window.location.href = 'index.html';
    });
  }

  // ==========================================================================
  // 8. CLEAR / RESET FORM
  // ==========================================================================
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      form.reset();
      hasSubmitted = false;

      // Clear all validation classes & messages
      document.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('is-invalid', 'is-valid');
        const err = group.querySelector('.error-msg');
        if (err) err.innerHTML = '';
      });

      // Clear selected state on radio cards
      document.querySelectorAll('.radio-card').forEach(card => {
        card.classList.remove('selected');
      });

      // Reset password meter
      evaluatePasswordStrength('');

      if (typeof showToast === 'function') {
        showToast('Form has been reset.');
      }
    });
  }
});
