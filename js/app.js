(() => {
  const root = document.documentElement;
  const languageToggle = document.getElementById('languageToggle');
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const nav = document.getElementById('siteNav');
  const progress = document.getElementById('scrollProgress');
  const form = document.getElementById('kalimhWhatsAppForm');
  const feedback = document.getElementById('formFeedback');
  const accommodationType = document.getElementById('accommodationType');
  const groupSizeRow = document.getElementById('groupSizeRow');
  const groupSize = document.getElementById('groupSize');
  const consentField = document.getElementById('consentField');
  const cookieBanner = document.getElementById('cookieBanner');
  const cookieAccept = document.getElementById('cookieAccept');
  const cookieReject = document.getElementById('cookieReject');
  const whatsappNumber = '60178801714';
  const consentCookie = 'kalimh_cookie_consent';
  const consentDays = 180;
  const staticLanguage = root.lang === 'ar' ? 'ar' : 'en';
  let currentLanguage = staticLanguage;
  let lastFocusedElement = null;

  const text = (en, ar) => currentLanguage === 'ar' ? ar : en;
  const cookieOptions = () => `path=/; max-age=${consentDays * 24 * 60 * 60}; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
  const readCookie = (name) => {
    const prefix = `${name}=`;
    const item = document.cookie.split(';').map((entry) => entry.trim()).find((entry) => entry.startsWith(prefix));
    return item ? decodeURIComponent(item.slice(prefix.length)) : '';
  };
  const writeCookie = (name, value) => {
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; ${cookieOptions()}`;
  };
  const removeCookie = (name) => {
    const base = `${encodeURIComponent(name)}=; path=/; max-age=0; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
    document.cookie = base;
    if (window.location.hostname && !window.location.hostname.includes(':')) {
      document.cookie = `${base}; domain=${window.location.hostname}`;
    }
  };
  const removeAnalyticsCookies = () => {
    document.cookie.split(';').map((entry) => entry.trim().split('=')[0]).filter((name) => name === '_ga' || name.startsWith('_ga_')).forEach(removeCookie);
  };
  const updateGoogleConsent = (choice) => {
    const granted = choice === 'accepted' ? 'granted' : 'denied';
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: granted,
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
      });
    }
    if (choice === 'accepted') {
      window.kalimhLoadAnalytics?.();
    } else {
      removeAnalyticsCookies();
    }
  };
  const trackEvent = (name, parameters = {}) => {
    if (readCookie(consentCookie) !== 'accepted' || typeof window.gtag !== 'function') return;
    window.gtag('event', name, parameters);
  };
  window.kalimhTrackEvent = trackEvent;

  const showCookieBanner = () => {
    if (!cookieBanner) return;
    cookieBanner.hidden = false;
  };
  const hideCookieBanner = () => {
    if (!cookieBanner) return;
    cookieBanner.hidden = true;
  };
  const saveCookieChoice = (choice) => {
    writeCookie(consentCookie, choice);
    updateGoogleConsent(choice);
    hideCookieBanner();
  };

  if (!readCookie(consentCookie)) {
    showCookieBanner();
  } else {
    updateGoogleConsent(readCookie(consentCookie));
  }
  cookieAccept?.addEventListener('click', () => saveCookieChoice('accepted'));
  cookieReject?.addEventListener('click', () => saveCookieChoice('rejected'));
  document.querySelectorAll('[data-cookie-settings]').forEach((button) => {
    button.addEventListener('click', () => {
      showCookieBanner();
      cookieBanner?.querySelector('button')?.focus();
    });
  });

  const translate = (language, { navigate = false } = {}) => {
    currentLanguage = language;
    root.lang = language;
    root.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-en][data-ar]').forEach((element) => {
      const value = element.dataset[language];
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.placeholder = value;
      } else {
        element.textContent = value;
      }
    });
    document.querySelectorAll('[data-placeholder-en][data-placeholder-ar]').forEach((element) => {
      element.placeholder = element.dataset[`placeholder${language === 'ar' ? 'Ar' : 'En'}`];
    });
    document.querySelectorAll('[data-aria-en][data-aria-ar]').forEach((element) => {
      element.setAttribute('aria-label', element.dataset[`aria${language === 'ar' ? 'Ar' : 'En'}`]);
    });
    document.querySelectorAll('[data-alt-en][data-alt-ar]').forEach((element) => {
      element.alt = element.dataset[`alt${language === 'ar' ? 'Ar' : 'En'}`];
    });
    if (languageToggle) {
      languageToggle.textContent = language === 'ar' ? 'English' : 'العربية';
      languageToggle.setAttribute('aria-label', language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية');
    }
    if (navigate && language !== staticLanguage && languageToggle) {
      const route = languageToggle.dataset[`lang${language === 'ar' ? 'Ar' : 'En'}`];
      if (route) {
        const target = new URL(route, document.baseURI);
        target.hash = window.location.hash;
        window.location.assign(target.href);
      }
    }
  };

  if (languageToggle) {
    languageToggle.addEventListener('click', () => {
      translate(currentLanguage === 'en' ? 'ar' : 'en', { navigate: true });
    });
  }

  if (menuToggle && mobileMenu) {
    const menuFocusable = () => [...mobileMenu.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])')]
      .filter((element) => !element.hasAttribute('disabled'));
    const openMenu = () => {
      lastFocusedElement = document.activeElement;
      mobileMenu.classList.add('is-open');
      mobileMenu.setAttribute('aria-hidden', 'false');
      menuToggle.classList.add('is-open');
      menuToggle.setAttribute('aria-expanded', 'true');
      menuToggle.setAttribute('aria-label', text('Close navigation menu', 'إغلاق قائمة التنقل'));
      document.body.classList.add('menu-open');
      window.setTimeout(() => menuFocusable()[0]?.focus(), 0);
    };
    const closeMenu = ({ restoreFocus = false } = {}) => {
      mobileMenu.classList.remove('is-open');
      mobileMenu.setAttribute('aria-hidden', 'true');
      menuToggle.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', text('Open navigation menu', 'فتح قائمة التنقل'));
      document.body.classList.remove('menu-open');
      if (restoreFocus && lastFocusedElement instanceof HTMLElement) lastFocusedElement.focus();
    };
    menuToggle.addEventListener('click', () => mobileMenu.classList.contains('is-open') ? closeMenu({ restoreFocus: true }) : openMenu());
    mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => closeMenu()));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && mobileMenu.classList.contains('is-open')) closeMenu({ restoreFocus: true });
      if (event.key !== 'Tab' || !mobileMenu.classList.contains('is-open')) return;
      const focusable = menuFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    window.addEventListener('resize', () => { if (window.innerWidth > 820) closeMenu(); });
  }

  const updateScroll = () => {
    const top = window.scrollY;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = `${height > 0 ? Math.min(100, (top / height) * 100) : 0}%`;
    nav?.classList.toggle('is-scrolled', top > 18);
    const sections = [...document.querySelectorAll('main section[id]')];
    let current = '';
    sections.forEach((section) => { if (top >= section.offsetTop - 150) current = section.id; });
    document.querySelectorAll('.nav-links a').forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${current}`));
  };
  window.addEventListener('scroll', updateScroll, { passive: true });

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, { threshold: .1 });
    document.querySelectorAll('.reveal').forEach((item) => revealObserver.observe(item));
  } else {
    document.querySelectorAll('.reveal').forEach((item) => item.classList.add('visible'));
  }

  document.querySelectorAll('[data-analytics-event]').forEach((element) => {
    element.addEventListener('click', () => {
      trackEvent(element.dataset.analyticsEvent, { link_label: element.dataset.analyticsLabel || '' });
    });
  });

  if (form && feedback && accommodationType && groupSizeRow && groupSize && consentField) {
    const updateStartDate = () => {
      const input = document.getElementById('startDate');
      if (!input) return;
      const today = new Date();
      const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      input.min = localToday;
    };
    const fieldContainer = (field) => field.id === 'contactConsent' ? consentField : field.closest('.field');
    const errorElement = (field) => document.getElementById(`${field.id}Error`);
    const clearFieldError = (field) => {
      const container = fieldContainer(field);
      const error = errorElement(field);
      container?.classList.remove('has-error');
      field.removeAttribute('aria-invalid');
      if (error) error.textContent = '';
    };
    const updateGroupSize = () => {
      const needsGroupSize = accommodationType.value === 'whole_house';
      groupSizeRow.hidden = !needsGroupSize;
      groupSizeRow.setAttribute('aria-hidden', String(!needsGroupSize));
      groupSize.required = needsGroupSize;
      if (!needsGroupSize) {
        groupSize.value = '';
        clearFieldError(groupSize);
      }
    };
    const validationMessage = (field) => {
      if (field.validity.valueMissing) return text('Please complete this field.', 'يرجى تعبئة هذا الحقل.');
      if (field.validity.typeMismatch) return text('Enter a valid email address.', 'أدخل بريدًا إلكترونيًا صحيحًا.');
      if (field.validity.tooShort) return text('Please enter a little more detail.', 'يرجى إدخال تفاصيل أكثر قليلًا.');
      if (field.validity.rangeUnderflow || field.validity.rangeOverflow) return text('Please enter a valid value.', 'يرجى إدخال قيمة صحيحة.');
      return text('Check this field and try again.', 'تحقق من هذا الحقل ثم حاول مرة أخرى.');
    };
    const setFieldError = (field) => {
      const container = fieldContainer(field);
      const error = errorElement(field);
      container?.classList.add('has-error');
      field.setAttribute('aria-invalid', 'true');
      if (error) error.textContent = validationMessage(field);
    };
    const validateField = (field) => {
      if (!field.willValidate || field.checkValidity()) {
        clearFieldError(field);
        return true;
      }
      setFieldError(field);
      return false;
    };
    const selectedText = (id) => {
      const field = document.getElementById(id);
      if (!field) return '';
      if (field.tagName === 'SELECT') return field.options[field.selectedIndex]?.textContent.trim() || '';
      return field.value.trim();
    };
    const labelText = (id) => document.querySelector(`label[for="${id}"]`)?.textContent.replace('*', '').trim() || id;
    const clearFeedback = () => {
      feedback.textContent = '';
      feedback.className = 'form-feedback';
    };
    const showFeedback = (message, type = 'success') => {
      feedback.textContent = message;
      feedback.className = `form-feedback show ${type}`;
    };

    updateStartDate();
    updateGroupSize();
    accommodationType.addEventListener('change', updateGroupSize);
    form.querySelectorAll('input, select, textarea').forEach((field) => {
      const eventName = field.type === 'checkbox' || field.tagName === 'SELECT' ? 'change' : 'input';
      field.addEventListener(eventName, () => validateField(field));
    });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      clearFeedback();
      updateGroupSize();
      const fields = [...form.querySelectorAll('input, select, textarea')].filter((field) => field.type !== 'hidden');
      const invalidField = fields.find((field) => !validateField(field));
      if (invalidField) {
        showFeedback(text('Please correct the highlighted fields before continuing.', 'يرجى تصحيح الحقول المميزة قبل المتابعة.'), 'error');
        invalidField.focus();
        return;
      }
      const ids = ['fullName', 'phone', 'email', 'destination', 'studyGoal', 'startDate', 'accommodationType', 'area', 'groupSize', 'accommodationRequests'];
      const rows = ids
        .filter((id) => id !== 'groupSize' || !groupSizeRow.hidden)
        .map((id) => `${labelText(id)}: ${selectedText(id)}`)
        .filter((line) => !line.endsWith(': '));
      const greeting = currentLanguage === 'ar'
        ? 'مرحبًا أكاديمية كلمة، أرغب في طلب دعم للدراسة في الخارج.'
        : 'Hello Kalimh Academy, I would like support with studying abroad.';
      const message = `${greeting}\n\n${rows.join('\n')}`;
      const targetUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      const whatsappWindow = window.open(targetUrl, '_blank');
      if (whatsappWindow) {
        whatsappWindow.opener = null;
        trackEvent('generate_lead', { method: 'whatsapp_form' });
        showFeedback(text('WhatsApp has opened with your enquiry. Review it, then send when you are ready.', 'تم فتح واتساب مع تفاصيل طلبك. راجع الرسالة ثم أرسلها عندما تكون جاهزًا.'), 'success');
      } else {
        showFeedback(text('Your browser blocked WhatsApp. Please use the WhatsApp button in the corner or allow pop-ups for this site.', 'قام المتصفح بحظر فتح واتساب. يرجى استخدام زر واتساب في الزاوية أو السماح بالنوافذ المنبثقة لهذا الموقع.'), 'error');
      }
    });
  }

  translate(currentLanguage);
  updateScroll();
})();
