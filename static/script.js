document.addEventListener('DOMContentLoaded', () => {
    // --- Application State ---
    let appData = null; // Cached analysis response
    let activeJDTab = 'upload'; // 'upload' or 'text'
    const progressIntervals = [];

    // Helper to resolve API URLs (enables running static HTML files directly from local filesystem)
    const getApiUrl = (endpoint) => {
        const baseUrl = window.location.protocol === 'file:' ? 'http://127.0.0.1:8000' : '';
        return `${baseUrl}${endpoint}`;
    };

    // --- DOM Elements ---
    const apiStatus = document.getElementById('api-status');
    const uploadPanel = document.getElementById('upload-panel');
    const loadingPanel = document.getElementById('loading-panel');
    const resultsPanel = document.getElementById('results-panel');
    
    // Form and inputs
    const form = document.getElementById('analyzer-form');
    const resumeInput = document.getElementById('resume-input');
    const resumeDropZone = document.getElementById('resume-drop-zone');
    const resumeFileInfo = document.getElementById('resume-file-info');
    const resumeSelectedName = document.getElementById('resume-selected-name');
    const resumeSelectedSize = document.getElementById('resume-selected-size');
    const removeResumeBtn = document.getElementById('remove-resume-btn');
    
    const tabJdUpload = document.getElementById('tab-jd-upload');
    const tabJdText = document.getElementById('tab-jd-text');
    const jdDropZone = document.getElementById('jd-drop-zone');
    const jdInput = document.getElementById('jd-input');
    const jdFileInfo = document.getElementById('jd-file-info');
    const jdSelectedName = document.getElementById('jd-selected-name');
    const jdSelectedSize = document.getElementById('jd-selected-size');
    const removeJdBtn = document.getElementById('remove-jd-btn');
    const jdTextContainer = document.getElementById('jd-text-container');
    const jdTextInput = document.getElementById('jd-text-input');
    
    const submitBtn = document.getElementById('submit-btn');
    
    // Loader elements
    const loaderTitle = document.getElementById('loader-title');
    const loaderSubtitle = document.getElementById('loader-subtitle');
    const progressBarInner = document.getElementById('progress-bar-inner');
    
    // Result Header actions
    const resetBtn = document.getElementById('reset-btn');
    const downloadBtn = document.getElementById('download-btn');
    
    // Score & Summary Dashboard
    const scoreRing = document.getElementById('score-ring');
    const scoreText = document.getElementById('score-text');
    const scoreQuality = document.getElementById('score-quality');
    const matchSummaryText = document.getElementById('match-summary-text');
    
    // Tab switching elements
    const dashTabs = document.querySelectorAll('.dash-tab');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    // Lists and Containers
    const matchingSkillsList = document.getElementById('matching-skills-list');
    const missingSkillsList = document.getElementById('missing-skills-list');
    const editsContainer = document.getElementById('edits-container');
    const interviewAccordion = document.getElementById('interview-accordion');
    const alternativeRolesList = document.getElementById('alternative-roles-list');

    // --- 1. Health Status Check ---
    async function checkAPIHealth() {
        try {
            const response = await fetch(getApiUrl('/api/health'));
            const data = await response.json();
            if (response.ok && data.api_key_configured) {
                apiStatus.className = 'status-badge online';
                apiStatus.querySelector('.status-text').innerText = 'API Connected';
            } else {
                apiStatus.className = 'status-badge offline';
                apiStatus.querySelector('.status-text').innerText = 'API Key Missing';
            }
        } catch (error) {
            apiStatus.className = 'status-badge offline';
            apiStatus.querySelector('.status-text').innerText = 'Server Offline';
        }
    }
    checkAPIHealth();

    // --- 2. File Upload Dropzone Management ---
    
    function setupDragAndDrop(dropZone, fileInput, fileInfo, nameEl, sizeEl, removeBtn) {
        // Trigger file input dialog when clicking drop zone
        dropZone.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON' && !fileInfo.contains(e.target)) {
                fileInput.click();
            }
        });

        // Drag events
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.remove('drag-over');
            }, false);
        });

        // Handle drop file
        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length) {
                fileInput.files = files;
                handleFileSelection(files[0], dropZone, fileInfo, nameEl, sizeEl);
            }
        });

        // Handle browser click file selection
        fileInput.addEventListener('change', (e) => {
            if (fileInput.files.length) {
                handleFileSelection(fileInput.files[0], dropZone, fileInfo, nameEl, sizeEl);
            }
        });

        // Remove selected file click
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.value = '';
            fileInfo.classList.add('hidden');
            dropZone.querySelector('.drop-zone-prompt').classList.remove('hidden');
        });
    }

    function handleFileSelection(file, dropZone, fileInfo, nameEl, sizeEl) {
        // Validate type
        if (file.type !== 'application/pdf') {
            alert('Only PDF documents are supported currently.');
            return;
        }
        
        // Show file details
        nameEl.innerText = file.name;
        sizeEl.innerText = formatFileSize(file.size);
        
        dropZone.querySelector('.drop-zone-prompt').classList.add('hidden');
        fileInfo.classList.remove('hidden');
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    setupDragAndDrop(resumeDropZone, resumeInput, resumeFileInfo, resumeSelectedName, resumeSelectedSize, removeResumeBtn);
    setupDragAndDrop(jdDropZone, jdInput, jdFileInfo, jdSelectedName, jdSelectedSize, removeJdBtn);

    // --- 3. Job Description Input Type Toggle ---
    
    tabJdUpload.addEventListener('click', () => {
        activeJDTab = 'upload';
        tabJdUpload.classList.add('active');
        tabJdText.classList.remove('active');
        
        jdDropZone.classList.remove('hidden');
        jdTextContainer.classList.add('hidden');
        
        // Clear text input if switched
        jdTextInput.value = '';
    });

    tabJdText.addEventListener('click', () => {
        activeJDTab = 'text';
        tabJdText.classList.add('active');
        tabJdUpload.classList.remove('active');
        
        jdTextContainer.classList.remove('hidden');
        jdDropZone.classList.add('hidden');
        
        // Clear file input if switched
        jdInput.value = '';
        jdFileInfo.classList.add('hidden');
        jdDropZone.querySelector('.drop-zone-prompt').classList.remove('hidden');
    });

    // --- 4. Form Submit and API Request ---

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Check if resume exists
        if (!resumeInput.files.length) {
            alert('Please select or upload your Resume PDF.');
            return;
        }

        // Check job profile target details
        const isJdFile = jdInput.files.length > 0;
        const isJdText = jdTextInput.value.trim().length > 0;
        
        if (activeJDTab === 'upload' && !isJdFile) {
            alert('Please upload the target Job Description PDF.');
            return;
        }
        
        if (activeJDTab === 'text' && !isJdText) {
            alert('Please paste the target Job Description text.');
            return;
        }

        // Create Payload
        const formData = new FormData();
        formData.append('resume', resumeInput.files[0]);
        
        if (activeJDTab === 'upload') {
            formData.append('job_desc_file', jdInput.files[0]);
        } else {
            formData.append('job_desc_text', jdTextInput.value.trim());
        }

        // Show loading screen
        uploadPanel.classList.add('hidden');
        loadingPanel.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        startLoadingSimulation();

        try {
            const response = await fetch(getApiUrl('/api/analyze'), {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Internal server analysis error.');
            }

            appData = await response.json();
            
            // Finish loader
            completeLoadingSimulation(() => {
                // Show results panel
                loadingPanel.classList.add('hidden');
                resultsPanel.classList.remove('hidden');
                
                // Render dashboard components
                renderDashboard(appData);
            });

        } catch (error) {
            stopAllIntervals();
            alert(`Analysis Failed: ${error.message}`);
            loadingPanel.classList.add('hidden');
            uploadPanel.classList.remove('hidden');
        }
    });

    // Simulated Progress Tracker
    function startLoadingSimulation() {
        progressBarInner.style.width = '0%';
        loaderTitle.innerText = 'Analyzing Candidate Match';
        
        const loaderSteps = [
            { limit: 25, text: 'Parsing documents and extracting text...', time: 80 },
            { limit: 55, text: 'Identifying matching competencies...', time: 100 },
            { limit: 80, text: 'Running evaluations with Gemini 2.5 Flash...', time: 150 },
            { limit: 98, text: 'Structuring recommendations & templates...', time: 200 }
        ];

        let currentProgress = 0;
        let stepIdx = 0;

        const interval = setInterval(() => {
            if (stepIdx >= loaderSteps.length) {
                clearInterval(interval);
                return;
            }

            const step = loaderSteps[stepIdx];
            loaderSubtitle.innerText = step.text;

            if (currentProgress < step.limit) {
                currentProgress += 1;
                progressBarInner.style.width = `${currentProgress}%`;
            } else {
                stepIdx++;
            }
        }, 120);

        progressIntervals.push(interval);
    }

    function completeLoadingSimulation(callback) {
        stopAllIntervals();
        loaderSubtitle.innerText = 'Complete!';
        progressBarInner.style.width = '100%';
        setTimeout(callback, 500);
    }

    function stopAllIntervals() {
        while (progressIntervals.length > 0) {
            clearInterval(progressIntervals.pop());
        }
    }

    // --- 5. Dashboard Render Controller ---

    function renderDashboard(data) {
        // Reset scroll position
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Set match summary
        matchSummaryText.innerText = data.match_summary || 'No summary available.';

        // Animate Radial Gauge Score
        animateRadialGauge(data.match_score || 0);

        // Render matching skills tags
        matchingSkillsList.innerHTML = '';
        if (data.matching_skills && data.matching_skills.length > 0) {
            data.matching_skills.forEach(skill => {
                const tag = document.createElement('span');
                tag.className = 'tag matching-tag';
                tag.innerText = skill;
                matchingSkillsList.appendChild(tag);
            });
        } else {
            matchingSkillsList.innerHTML = '<p class="text-muted">No direct skill matches identified.</p>';
        }

        // Render missing skills tags
        missingSkillsList.innerHTML = '';
        if (data.missing_skills && data.missing_skills.length > 0) {
            data.missing_skills.forEach(skill => {
                const tag = document.createElement('span');
                tag.className = 'tag missing-tag';
                tag.innerText = skill;
                missingSkillsList.appendChild(tag);
            });
        } else {
            missingSkillsList.innerHTML = '<p class="text-muted">No critical missing skills detected.</p>';
        }

        // Render Suggested edits
        editsContainer.innerHTML = '';
        if (data.suggested_edits && data.suggested_edits.length > 0) {
            data.suggested_edits.forEach(edit => {
                const editCard = document.createElement('div');
                editCard.className = 'edit-item-card';

                const beforeContent = edit.original_text ? `
                    <div class="edit-pane before">
                        <div class="pane-label label-before">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            Current Wording
                        </div>
                        <p class="pane-text"><del>${escapeHTML(edit.original_text)}</del></p>
                    </div>
                ` : '';

                editCard.innerHTML = `
                    <div class="edit-item-header">
                        <span class="edit-section-badge">${escapeHTML(edit.section)}</span>
                    </div>
                    <div class="edit-content-grid ${!edit.original_text ? 'single-pane' : ''}">
                        ${beforeContent}
                        <div class="edit-pane after">
                            <div class="pane-label label-after">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Recommended Edit
                            </div>
                            <p class="pane-text"><ins>${escapeHTML(edit.suggested_text)}</ins></p>
                        </div>
                    </div>
                    <div class="edit-reason-footer">
                        <strong>Feedback:</strong> <span>${escapeHTML(edit.reason)}</span>
                    </div>
                `;
                editsContainer.appendChild(editCard);
            });
        } else {
            editsContainer.innerHTML = '<p class="text-muted">Your resume matches perfectly! No edits recommended.</p>';
        }

        // Render Interview Prep Accordion
        interviewAccordion.innerHTML = '';
        if (data.interview_questions && data.interview_questions.length > 0) {
            data.interview_questions.forEach((qItem, idx) => {
                const item = document.createElement('div');
                item.className = 'accordion-item';
                
                item.innerHTML = `
                    <button class="accordion-header" id="faq-header-${idx}" aria-expanded="false" aria-controls="faq-body-${idx}">
                        <span class="accordion-title">Q${idx + 1}: ${escapeHTML(qItem.question)}</span>
                        <span class="accordion-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </span>
                    </button>
                    <div class="accordion-collapse" id="faq-body-${idx}" role="region" aria-labelledby="faq-header-${idx}">
                        <div class="accordion-body">
                            <strong>Preparation Guide:</strong><br>
                            ${escapeHTML(qItem.suggested_answer)}
                        </div>
                    </div>
                `;
                
                // Add toggle accordion listener
                const header = item.querySelector('.accordion-header');
                const collapse = item.querySelector('.accordion-collapse');
                
                header.addEventListener('click', () => {
                    const isActive = item.classList.contains('active');
                    
                    // Close others (optional, let's keep simple one-at-a-time or multi-open)
                    // Toggle current
                    if (isActive) {
                        item.classList.remove('active');
                        header.setAttribute('aria-expanded', 'false');
                        collapse.style.maxHeight = '0';
                    } else {
                        item.classList.add('active');
                        header.setAttribute('aria-expanded', 'true');
                        collapse.style.maxHeight = collapse.scrollHeight + 'px';
                    }
                });

                interviewAccordion.appendChild(item);
            });
        } else {
            interviewAccordion.innerHTML = '<p class="text-muted">No custom interview questions generated.</p>';
        }

        // Render Alternative Roles Cards
        alternativeRolesList.innerHTML = '';
        if (data.alternative_roles && data.alternative_roles.length > 0) {
            data.alternative_roles.forEach(role => {
                const card = document.createElement('div');
                card.className = 'role-card';
                card.innerHTML = `
                    <div class="role-icon-box">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>
                    </div>
                    <div class="role-card-content">
                        <h5>${escapeHTML(role)}</h5>
                        <p>Viable career transition based on skills and keywords extracted from your credentials.</p>
                    </div>
                `;
                alternativeRolesList.appendChild(card);
            });
        } else {
            alternativeRolesList.innerHTML = '<p class="text-muted">No alternative roles needed.</p>';
        }

        // Ensure we defaults back to the first tab (Skills)
        document.getElementById('tab-skills').click();
    }

    function animateRadialGauge(score) {
        // Circumference: 2 * PI * r = 2 * 3.14159 * 76 = 477.5
        const circumference = 477.5;
        scoreRing.style.strokeDasharray = `${circumference} ${circumference}`;
        
        let currentVal = 0;
        scoreText.innerText = '0';
        
        const offset = circumference - (score / 100) * circumference;
        scoreRing.style.strokeDashoffset = offset;

        const countInterval = setInterval(() => {
            if (currentVal >= score) {
                scoreText.innerText = score;
                clearInterval(countInterval);
            } else {
                currentVal += 1;
                scoreText.innerText = currentVal;
            }
        }, 12);

        // Adjust Score Badges
        scoreQuality.className = 'score-badge';
        if (score >= 80) {
            scoreQuality.classList.add('match-excellent');
            scoreQuality.innerText = 'Excellent Match';
        } else if (score >= 60) {
            scoreQuality.classList.add('match-good');
            scoreQuality.innerText = 'Good Match';
        } else if (score >= 40) {
            scoreQuality.classList.add('match-moderate');
            scoreQuality.innerText = 'Moderate Match';
        } else {
            scoreQuality.classList.add('match-weak');
            scoreQuality.innerText = 'Weak Match';
        }
    }

    function escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // --- 6. Tab Navigation controls ---
    
    dashTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active states
            dashTabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            tabPanels.forEach(p => p.classList.remove('active'));

            // Add active states to clicked
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            const targetPanelId = tab.getAttribute('data-panel');
            document.getElementById(targetPanelId).classList.add('active');
        });
    });

    // --- 7. Toolbar actions (Start Over & PDF) ---

    // Reset button handler
    resetBtn.addEventListener('click', () => {
        appData = null;
        resultsPanel.classList.add('hidden');
        uploadPanel.classList.remove('hidden');
        
        // Reset form controls
        form.reset();
        
        // Hide file preview UI blocks
        resumeFileInfo.classList.add('hidden');
        resumeDropZone.querySelector('.drop-zone-prompt').classList.remove('hidden');
        
        jdFileInfo.classList.add('hidden');
        jdDropZone.querySelector('.drop-zone-prompt').classList.remove('hidden');
        jdTextInput.value = '';
        
        // Default to file tab for Job Description
        tabJdUpload.click();
        
        // Reset score animations
        scoreRing.style.strokeDashoffset = 477.5;
        scoreText.innerText = '0';
    });

    // Download PDF report
    downloadBtn.addEventListener('click', async () => {
        if (!appData) return;

        // Toggle state and show loading
        const origContent = downloadBtn.innerHTML;
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = `
            <div class="loader-spinner" style="width: 14px; height: 14px; margin-bottom: 0; display: inline-block; vertical-align: middle;"></div>
            Generating Report...
        `;

        try {
            const response = await fetch(getApiUrl('/api/download-pdf'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(appData)
            });

            if (!response.ok) throw new Error('PDF download generation failed.');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${appData.match_score}_match_resume_report.pdf`;
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            alert(`Download Error: ${error.message}`);
        } finally {
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = origContent;
        }
    });
});
