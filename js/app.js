(() => {
  'use strict';

  const root = document.documentElement;
  const staticLanguage = root.lang === 'ar' ? 'ar' : 'en';
  let currentLanguage = staticLanguage;
  let lastFocusedElement = null;
  let scrollFrame = 0;

  const languageToggle = document.getElementById('languageToggle');
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const nav = document.getElementById('siteNav');
  const progress = document.getElementById('scrollProgress');
  const cookieBanner = document.getElementById('cookieBanner');
  const cookieAccept = document.getElementById('cookieAccept');
  const cookieReject = document.getElementById('cookieReject');

  const whatsappNumber = '60178801714';
  const consentCookie = 'kalimh_cookie_consent';
  const consentDays = 180;

  const text = (en, ar) => (currentLanguage === 'ar' ? ar : en);
  const isReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --------------------------------------------------------------------------
     Analytics consent
     -------------------------------------------------------------------------- */
  const cookieOptions = () =>
    `path=/; max-age=${consentDays * 24 * 60 * 60}; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;

  const readCookie = (name) => {
    const prefix = `${name}=`;
    const item = document.cookie
      .split(';')
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith(prefix));
    return item ? decodeURIComponent(item.slice(prefix.length)) : '';
  };

  const writeCookie = (name, value) => {
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; ${cookieOptions()}`;
  };

  const removeCookie = (name) => {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    const base = `${encodeURIComponent(name)}=; path=/; max-age=0; SameSite=Lax${secure}`;
    document.cookie = base;

    if (window.location.hostname && !window.location.hostname.includes(':')) {
      document.cookie = `${base}; domain=${window.location.hostname}`;
    }
  };

  const removeAnalyticsCookies = () => {
    document.cookie
      .split(';')
      .map((entry) => entry.trim().split('=')[0])
      .filter((name) => name === '_ga' || name.startsWith('_ga_'))
      .forEach(removeCookie);
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

  if (!readCookie(consentCookie)) showCookieBanner();
  else updateGoogleConsent(readCookie(consentCookie));

  cookieAccept?.addEventListener('click', () => saveCookieChoice('accepted'));
  cookieReject?.addEventListener('click', () => saveCookieChoice('rejected'));

  document.querySelectorAll('[data-cookie-settings]').forEach((button) => {
    button.addEventListener('click', () => {
      showCookieBanner();
      cookieBanner?.querySelector('button')?.focus();
    });
  });

  /* --------------------------------------------------------------------------
     Language routing and native text
     -------------------------------------------------------------------------- */
  const translate = (language, { navigate = false } = {}) => {
    currentLanguage = language;
    root.lang = language;
    root.dir = language === 'ar' ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-en][data-ar]').forEach((element) => {
      const value = element.dataset[language];
      if (value == null) return;

      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        element.placeholder = value;
      } else {
        element.textContent = value;
      }
    });

    document.querySelectorAll('[data-placeholder-en][data-placeholder-ar]').forEach((element) => {
      element.placeholder = element.dataset[`placeholder${language === 'ar' ? 'Ar' : 'En'}`] || '';
    });

    document.querySelectorAll('[data-aria-en][data-aria-ar]').forEach((element) => {
      const label = element.dataset[`aria${language === 'ar' ? 'Ar' : 'En'}`];
      if (label) element.setAttribute('aria-label', label);
    });

    document.querySelectorAll('[data-alt-en][data-alt-ar]').forEach((element) => {
      element.alt = element.dataset[`alt${language === 'ar' ? 'Ar' : 'En'}`] || '';
    });

    if (languageToggle) {
      languageToggle.textContent = language === 'ar' ? 'English' : 'العربية';
      languageToggle.setAttribute(
        'aria-label',
        language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'
      );
    }

    updateCarouselLanguage();

    if (navigate && language !== staticLanguage && languageToggle) {
      const route = languageToggle.dataset[`lang${language === 'ar' ? 'Ar' : 'En'}`];
      if (!route) return;

      const target = new URL(route, document.baseURI);
      target.hash = window.location.hash;
      window.location.assign(target.href);
    }
  };

  languageToggle?.addEventListener('click', () => {
    translate(currentLanguage === 'en' ? 'ar' : 'en', { navigate: true });
  });

  /* --------------------------------------------------------------------------
     Mobile navigation
     -------------------------------------------------------------------------- */
  if (menuToggle && mobileMenu) {
    const menuFocusable = () =>
      [...mobileMenu.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])')]
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

      if (restoreFocus && lastFocusedElement instanceof HTMLElement) {
        lastFocusedElement.focus();
      }
    };

    menuToggle.addEventListener('click', () => {
      if (mobileMenu.classList.contains('is-open')) closeMenu({ restoreFocus: true });
      else openMenu();
    });

    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => closeMenu());
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && mobileMenu.classList.contains('is-open')) {
        closeMenu({ restoreFocus: true });
        return;
      }

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

    window.addEventListener('resize', () => {
      if (window.innerWidth > 820) closeMenu();
    });
  }

  /* --------------------------------------------------------------------------
     Scroll progress and active navigation
     -------------------------------------------------------------------------- */
  const updateScroll = () => {
    scrollFrame = 0;
    const top = window.scrollY;
    const height = document.documentElement.scrollHeight - window.innerHeight;

    if (progress) {
      progress.style.width = `${height > 0 ? Math.min(100, (top / height) * 100) : 0}%`;
    }

    nav?.classList.toggle('is-scrolled', top > 18);

    const sections = [...document.querySelectorAll('main section[id]')];
    let current = sections[0]?.id || '';
    sections.forEach((section) => {
      if (top >= section.offsetTop - 160) current = section.id;
    });

    document.querySelectorAll('.nav-links a, .mobile-menu a').forEach((link) => {
      const active = link.getAttribute('href') === `#${current}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  const scheduleScrollUpdate = () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(updateScroll);
  };

  window.addEventListener('scroll', scheduleScrollUpdate, { passive: true });
  window.addEventListener('resize', scheduleScrollUpdate);

  /* --------------------------------------------------------------------------
     Reveal animations
     -------------------------------------------------------------------------- */
  if (isReducedMotion() || !('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach((item) => item.classList.add('visible'));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -5% 0px' }
    );

    document.querySelectorAll('.reveal').forEach((item) => revealObserver.observe(item));
  }

  document.querySelectorAll('[data-analytics-event]').forEach((element) => {
    element.addEventListener('click', () => {
      trackEvent(element.dataset.analyticsEvent, {
        link_label: element.dataset.analyticsLabel || ''
      });
    });
  });

  /* --------------------------------------------------------------------------
     Form validation and WhatsApp fallback
     -------------------------------------------------------------------------- */
  const form = document.getElementById('kalimhWhatsAppForm');
  const feedback = document.getElementById('formFeedback');
  const formFallback = document.getElementById('formFallback');
  const whatsappFallback = document.getElementById('whatsappFallback');
  const copyEnquiry = document.getElementById('copyEnquiry');
  const accommodationType = document.getElementById('accommodationType');
  const groupSizeRow = document.getElementById('groupSizeRow');
  const groupSize = document.getElementById('groupSize');
  const studyGoal = document.getElementById('studyGoal');
  const studyDurationRow = document.getElementById('studyDurationRow');
  const studyDuration = document.getElementById('studyDuration');
  const consentField = document.getElementById('consentField');
  const websiteField = document.getElementById('websiteField');

  // Keep the duration field independent from the rest of the form setup.
  // This guarantees that it works even if another optional form element is missing.
  const syncStudyDuration = () => {
    if (!studyGoal || !studyDurationRow || !studyDuration) return;

    const isEnglishCourse = studyGoal.value === 'english';
    studyDurationRow.hidden = !isEnglishCourse;
    studyDurationRow.setAttribute('aria-hidden', String(!isEnglishCourse));
    studyDuration.required = isEnglishCourse;

    if (!isEnglishCourse) {
      studyDuration.value = '';
      studyDuration.removeAttribute('aria-invalid');
      studyDuration.closest('.field')?.classList.remove('has-error');
      const durationError = document.getElementById('studyDurationError');
      if (durationError) durationError.textContent = '';
    }
  };

  if (studyGoal && studyDurationRow && studyDuration) {
    syncStudyDuration();
    studyGoal.addEventListener('change', syncStudyDuration);
  }

  if (
    form && feedback && accommodationType && groupSizeRow && groupSize &&
    studyGoal && studyDurationRow && studyDuration && consentField
  ) {
    let preparedMessage = '';

    const updateStartDate = () => {
      const input = document.getElementById('startDate');
      if (!input) return;

      const today = new Date();
      input.min = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);
    };

    const fieldContainer = (field) =>
      field.id === 'contactConsent' ? consentField : field.closest('.field');

    const errorElement = (field) => document.getElementById(`${field.id}Error`);

    const clearFieldError = (field) => {
      fieldContainer(field)?.classList.remove('has-error');
      field.removeAttribute('aria-invalid');
      const error = errorElement(field);
      if (error) error.textContent = '';
    };

    const updateGroupSize = () => {
      const required = accommodationType.value === 'whole_house';
      groupSizeRow.hidden = !required;
      groupSizeRow.setAttribute('aria-hidden', String(!required));
      groupSize.required = required;

      if (!required) {
        groupSize.value = '';
        clearFieldError(groupSize);
      }
    };

    const validationMessage = (field) => {
      if (field.validity.valueMissing) return text('Please complete this field.', 'يرجى تعبئة هذا الحقل.');
      if (field.validity.typeMismatch) return text('Enter a valid email address.', 'أدخل بريدًا إلكترونيًا صحيحًا.');
      if (field.validity.tooShort) return text('Please enter a little more detail.', 'يرجى إدخال تفاصيل أكثر قليلًا.');
      if (field.validity.rangeUnderflow || field.validity.rangeOverflow) {
        return text('Please enter a valid value.', 'يرجى إدخال قيمة صحيحة.');
      }
      return text('Check this field and try again.', 'تحقق من هذا الحقل ثم حاول مرة أخرى.');
    };

    const setFieldError = (field) => {
      fieldContainer(field)?.classList.add('has-error');
      field.setAttribute('aria-invalid', 'true');
      const error = errorElement(field);
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
      if (field instanceof HTMLSelectElement) {
        return field.options[field.selectedIndex]?.textContent.trim() || '';
      }
      return field.value.trim();
    };

    const labelText = (id) =>
      document.querySelector(`label[for="${id}"]`)?.textContent.replace('*', '').trim() || id;

    const clearFeedback = () => {
      feedback.textContent = '';
      feedback.className = 'form-feedback';
      if (formFallback) formFallback.hidden = true;
    };

    const showFeedback = (message, type = 'success') => {
      feedback.textContent = message;
      feedback.className = `form-feedback show ${type}`;
    };

    const setSubmitting = (submitting) => {
      const button = form.querySelector('.form-submit');
      if (!button) return;
      button.disabled = submitting;
      button.classList.toggle('is-loading', submitting);
      button.setAttribute('aria-busy', String(submitting));
    };

    const buildSubmission = () => {
      const ids = [
        'fullName', 'phone', 'email', 'destination', 'studyGoal', 'studyDuration',
        'startDate', 'accommodationType', 'area', 'groupSize', 'accommodationRequests'
      ];

      const data = {};
      const rows = ids
        .filter((id) => id !== 'groupSize' || !groupSizeRow.hidden)
        .filter((id) => id !== 'studyDuration' || !studyDurationRow.hidden)
        .map((id) => {
          const value = selectedText(id);
          if (!value) return '';
          data[id] = value;
          return `${labelText(id)}: ${value}`;
        })
        .filter(Boolean);

      const greeting = text(
        'Hello Kalimh Academy, I would like support with planning my study journey abroad.',
        'مرحبًا أكاديمية كلمة، أرغب في الحصول على دعم لتخطيط رحلتي التعليمية في الخارج.'
      );

      return {
        data: {
          ...data,
          pageLanguage: currentLanguage,
          submittedAt: new Date().toISOString(),
          source: 'kalimhacademy.com'
        },
        message: `${greeting}\n\n${rows.join('\n')}`
      };
    };

    const exposeFallback = (targetUrl, message) => {
      preparedMessage = message;
      if (whatsappFallback) whatsappFallback.href = targetUrl;
      if (formFallback) formFallback.hidden = false;
    };

    const copyText = async (value) => {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
        return;
      }

      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    };

    copyEnquiry?.addEventListener('click', async () => {
      if (!preparedMessage) return;
      try {
        await copyText(preparedMessage);
        showFeedback(text('The enquiry text was copied.', 'تم نسخ نص الاستفسار.'), 'success');
      } catch {
        showFeedback(text('The text could not be copied automatically.', 'تعذر نسخ النص تلقائيًا.'), 'error');
      }
    });

    updateStartDate();
    updateGroupSize();
    syncStudyDuration();

    accommodationType.addEventListener('change', updateGroupSize);

    form.querySelectorAll('input, select, textarea').forEach((field) => {
      if (field === websiteField) return;
      const eventName = field.type === 'checkbox' || field instanceof HTMLSelectElement ? 'change' : 'input';
      field.addEventListener(eventName, () => validateField(field));
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearFeedback();
      updateGroupSize();
      syncStudyDuration();

      // Honeypot: ignore automated submissions without exposing the filter.
      if (websiteField?.value.trim()) {
        showFeedback(text('Thank you. Your enquiry has been prepared.', 'شكرًا لك. تم تجهيز استفسارك.'), 'success');
        return;
      }

      const fields = [...form.querySelectorAll('input, select, textarea')]
        .filter((field) => field !== websiteField && field.type !== 'hidden');
      const invalidField = fields.find((field) => !validateField(field));

      if (invalidField) {
        showFeedback(
          text(
            'Please correct the highlighted fields before continuing.',
            'يرجى تصحيح الحقول المميزة قبل المتابعة.'
          ),
          'error'
        );
        invalidField.focus();
        return;
      }

      const submission = buildSubmission();
      const targetUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(submission.message)}`;
      const endpoint = form.dataset.formEndpoint?.trim();
      exposeFallback(targetUrl, submission.message);

      if (endpoint) {
        setSubmitting(true);
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(submission.data)
          });

          if (!response.ok) throw new Error(`Submission failed with status ${response.status}`);

          trackEvent('generate_lead', { method: 'website_form' });
          showFeedback(
            text(
              'Your enquiry was submitted. You may also continue on WhatsApp.',
              'تم إرسال استفسارك. ويمكنك أيضًا المتابعة عبر واتساب.'
            ),
            'success'
          );
          form.reset();
          updateGroupSize();
          syncStudyDuration();
        } catch (error) {
          console.error(error);
          showFeedback(
            text(
              'The online submission did not complete. Your enquiry is ready to send through WhatsApp below.',
              'لم يكتمل الإرسال عبر الموقع. استفسارك جاهز للإرسال عبر واتساب أدناه.'
            ),
            'error'
          );
        } finally {
          setSubmitting(false);
        }
        return;
      }

      const whatsappWindow = window.open(targetUrl, '_blank');
      if (whatsappWindow) {
        whatsappWindow.opener = null;
        trackEvent('generate_lead', { method: 'whatsapp_form' });
        showFeedback(
          text(
            'WhatsApp opened with your enquiry. Review the message, then send it when ready.',
            'تم فتح واتساب مع تفاصيل استفسارك. راجع الرسالة ثم أرسلها عندما تكون جاهزًا.'
          ),
          'success'
        );
      } else {
        showFeedback(
          text(
            'Your browser blocked the new window. Use “Open WhatsApp manually” below.',
            'حظر المتصفح النافذة الجديدة. استخدم «افتح واتساب يدويًا» أدناه.'
          ),
          'error'
        );
      }
    });
  }

  /* --------------------------------------------------------------------------
     Reviews carousel
     -------------------------------------------------------------------------- */
  const carousels = [];

  const updateCarouselLanguage = () => {
    carousels.forEach((controller) => controller.update());
  };

  document.querySelectorAll('[data-reviews-carousel]').forEach((carousel) => {
    const viewport = carousel.querySelector('.reviews-viewport');
    const track = carousel.querySelector('.reviews-track');
    const cards = [...carousel.querySelectorAll('.review-card')];
    const previousButton = carousel.querySelector('[data-review-prev]');
    const nextButton = carousel.querySelector('[data-review-next]');
    const status = carousel.querySelector('[data-carousel-status]');
    const dots = [...carousel.querySelectorAll('[data-carousel-dot]')];

    if (!viewport || !track || !cards.length || !previousButton || !nextButton) return;

    const getStep = () => {
      const gap = parseFloat(getComputedStyle(track).columnGap || '0');
      return cards[0].getBoundingClientRect().width + gap;
    };

    const getIndex = () => {
      const step = getStep();
      if (!step) return 0;
      return Math.max(0, Math.min(cards.length - 1, Math.round(viewport.scrollLeft / step)));
    };

    const update = () => {
      const step = getStep();
      const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth - 2);
      const currentScroll = Math.max(0, viewport.scrollLeft);
      const index = getIndex();
      const maxIndex = step ? Math.max(0, Math.round(maxScroll / step)) : 0;
      const gap = parseFloat(getComputedStyle(track).columnGap || '0');
      const visibleCount = step
        ? Math.max(1, Math.min(cards.length, Math.round((viewport.clientWidth + gap) / step)))
        : 1;
      const lastVisible = Math.min(cards.length, index + visibleCount);

      previousButton.disabled = currentScroll <= 2;
      nextButton.disabled = currentScroll >= maxScroll;

      dots.forEach((dot, dotIndex) => {
        const available = dotIndex <= maxIndex;
        const active = available && dotIndex === index;
        dot.hidden = !available;
        dot.classList.toggle('is-active', active);
        if (active) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });

      if (status) {
        status.textContent = visibleCount > 1
          ? text(
              `Examples ${index + 1}–${lastVisible} of ${cards.length}`,
              `الأمثلة ${index + 1}–${lastVisible} من ${cards.length}`
            )
          : text(
              `Example ${index + 1} of ${cards.length}`,
              `المثال ${index + 1} من ${cards.length}`
            );
      }
    };

    const goTo = (index) => {
      const safeIndex = Math.max(0, Math.min(cards.length - 1, index));
      viewport.scrollTo({
        left: safeIndex * getStep(),
        behavior: isReducedMotion() ? 'auto' : 'smooth'
      });
    };

    previousButton.addEventListener('click', () => goTo(getIndex() - 1));
    nextButton.addEventListener('click', () => goTo(getIndex() + 1));

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => goTo(index));
    });

    viewport.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goTo(getIndex() - 1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goTo(getIndex() + 1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        goTo(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        goTo(cards.length - 1);
      }
    });

    let scrollTimer = 0;
    viewport.addEventListener(
      'scroll',
      () => {
        window.clearTimeout(scrollTimer);
        scrollTimer = window.setTimeout(update, 70);
      },
      { passive: true }
    );

    if ('ResizeObserver' in window) {
      new ResizeObserver(update).observe(viewport);
    } else {
      window.addEventListener('resize', update);
    }

    const controller = { update };
    carousels.push(controller);
    update();
  });

  /* Keep only one FAQ answer open at a time. */
  document.querySelectorAll('.faq-list').forEach((list) => {
    list.addEventListener('toggle', (event) => {
      const opened = event.target;
      if (!(opened instanceof HTMLDetailsElement) || !opened.open) return;
      list.querySelectorAll('details[open]').forEach((item) => {
        if (item !== opened) item.open = false;
      });
    }, true);
  });

  translate(currentLanguage);
  updateScroll();
})();
