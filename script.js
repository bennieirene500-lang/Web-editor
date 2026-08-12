(() => {
  const fileInput = document.getElementById('fileInput'),
    uploadZone = document.getElementById('uploadZone'),
    fileCard = document.getElementById('fileCard'),
    fileName = document.getElementById('fileName'),
    fileMeta = document.getElementById('fileMeta'),
    removeBtn = document.getElementById('removeBtn'),
    videoPreview = document.getElementById('videoPreview'),
    previewEmpty = document.getElementById('previewEmpty'),
    intentButtons = [...document.querySelectorAll('#intentRow button')],
    produceBtn = document.getElementById('produceBtn'),
    helper = document.getElementById('helper'),
    processingPanel = document.getElementById('processingPanel'),
    progressBar = document.getElementById('progressBar'),
    progressPercent = document.getElementById('progressPercent'),
    processingTitle = document.getElementById('processingTitle'),
    processingMessage = document.getElementById('processingMessage'),
    processingSteps = [...document.querySelectorAll('.processing-steps span')],
    upgradeModal = document.getElementById('upgradeModal'),
    modalClose = document.getElementById('modalClose'),
    keepDemoBtn = document.getElementById('keepDemoBtn'),
    leadForm = document.getElementById('leadForm'),
    leadName = document.getElementById('leadName'),
    leadEmail = document.getElementById('leadEmail'),
    leadStatus = document.getElementById('leadStatus'),
    submitLeadBtn = document.getElementById('submitLeadBtn');

  const LEAD_CONFIG = {
    endpoint: '/api/lead',
    thankYouUrl: 'https://nateg27.gonowos.com/pb/idealclieantalliance'
  };

  let objectUrl = '',
    hasVideo = false,
    selectedIntent = '';

  const setLeadStatus = (message, isError = false) => {
    if (!leadStatus) return;
    leadStatus.textContent = message;
    leadStatus.classList.toggle('error', isError);
    leadStatus.classList.toggle('success', !isError && !!message);
  };

  const submitLead = async (event) => {
    event.preventDefault();

    const fullName = leadName.value.trim();
    const email = leadEmail.value.trim();

    if (!fullName || !email) {
      setLeadStatus('Please add both your full name and email.', true);
      return;
    }

    submitLeadBtn.disabled = true;
    setLeadStatus('Saving your details...');

    try {
      const response = await fetch(LEAD_CONFIG.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: fullName,
          email,
          source: 'ica-ai-video-editor'
        })
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result?.message || 'Lead submission failed.');
      }

      window.location.href = LEAD_CONFIG.thankYouUrl;
    } catch (error) {
      console.error('Lead submission failed:', error);
      setLeadStatus('We could not save your details. Please try again.', true);
      submitLeadBtn.disabled = false;
    }
  };

  const updateState = () => {
    produceBtn.disabled = !(hasVideo && selectedIntent);

    helper.textContent = !hasVideo
      ? 'Upload a video and choose a direction.'
      : !selectedIntent
      ? 'Now choose what this video should do.'
      : 'Ready to experience the ICA production flow.';
  };

  function loadFile(file) {
    if (!file || !file.type.startsWith('video/')) {
      alert('Please choose a video file.');
      return;
    }

    if (objectUrl) URL.revokeObjectURL(objectUrl);

    objectUrl = URL.createObjectURL(file);
    hasVideo = true;

    fileName.textContent = file.name;
    fileMeta.textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB · stays on your device`;

    fileCard.hidden = false;
    uploadZone.hidden = true;

    videoPreview.src = objectUrl;
    videoPreview.hidden = false;
    previewEmpty.hidden = true;

    updateState();
  }

  function resetVideo() {
    if (objectUrl) URL.revokeObjectURL(objectUrl);

    objectUrl = '';
    hasVideo = false;
    fileInput.value = '';

    fileCard.hidden = true;
    uploadZone.hidden = false;

    videoPreview.pause();
    videoPreview.removeAttribute('src');
    videoPreview.load();
    videoPreview.hidden = true;

    previewEmpty.hidden = false;

    updateState();
  }

  uploadZone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    loadFile(fileInput.files[0]);
  });

  removeBtn.addEventListener('click', resetVideo);

  ['dragenter', 'dragover'].forEach((evt) => {
    uploadZone.addEventListener(evt, (e) => {
      e.preventDefault();
      uploadZone.classList.add('is-dragging');
    });
  });

  ['dragleave', 'drop'].forEach((evt) => {
    uploadZone.addEventListener(evt, (e) => {
      e.preventDefault();
      uploadZone.classList.remove('is-dragging');
    });
  });

  uploadZone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];

    if (file) {
      loadFile(file);
    }
  });

  intentButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      intentButtons.forEach((b) => {
        b.classList.toggle('selected', b === btn);
      });

      selectedIntent = btn.dataset.intent;

      updateState();
    });
  });

  produceBtn.addEventListener('click', () => {
    processingPanel.hidden = false;

    processingPanel.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });

    const stages = [
      [18, 'Analysing your video', 'Reading the video and production direction.'],
      [38, 'Mapping pacing', 'Preparing where pauses and dead space would be tightened.'],
      [60, 'Preparing captions', 'Building the caption direction.'],
      [82, 'Planning visual emphasis', 'Mapping movement and visual support.'],
      [100, 'Production plan ready', 'The demo has reached the real generation step.']
    ];

    processingSteps.forEach((step) => {
      step.className = '';
    });

    progressBar.style.width = '0%';
    progressPercent.textContent = '0%';

    stages.forEach((stage, index) => {
      setTimeout(() => {
        const [pct, title, msg] = stage;

        progressBar.style.width = pct + '%';
        progressPercent.textContent = pct + '%';
        processingTitle.textContent = title;
        processingMessage.textContent = msg;

        processingSteps.forEach((el, i) => {
          el.className =
            i < index
              ? 'done'
              : i === index
              ? 'active'
              : '';
        });

        if (pct === 100) {
          processingSteps.forEach((el) => {
            el.className = 'done';
          });

          setTimeout(() => {
            upgradeModal.hidden = false;
            document.body.style.overflow = 'hidden';
          }, 650);
        }
      }, 350 + index * 760);
    });
  });

  const closeModal = () => {
    upgradeModal.hidden = true;
    document.body.style.overflow = '';
  };

  modalClose.addEventListener('click', closeModal);
  keepDemoBtn.addEventListener('click', closeModal);

  upgradeModal.addEventListener('click', (e) => {
    if (e.target === upgradeModal) {
      closeModal();
    }
  });

  if (leadForm) {
    leadForm.addEventListener('submit', submitLead);
  }

  document.querySelectorAll('[data-target]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document
        .getElementById(btn.dataset.target)
        ?.scrollIntoView({
          behavior: 'smooth'
        });
    });
  });

  updateState();
})();