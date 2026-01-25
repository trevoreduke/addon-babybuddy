/**
 * Baby Buddy Voice Logger Widget
 *
 * Adds a floating microphone button to Baby Buddy interface
 * Can be loaded as a user script (Tampermonkey) or bookmarklet
 */

(function() {
    'use strict';

    // Configuration (can be overridden by window.VOICE_LOGGER_CONFIG)
    const config = window.VOICE_LOGGER_CONFIG || {};
    const N8N_WEBHOOK_URL = config.webhookUrl || 'https://n8n.trevorduke.com/webhook/baby-buddy-audio';
    const ENABLED = config.enabled !== false; // Default to true

    // Don't load if disabled
    if (!ENABLED) {
        console.log('Baby Buddy Voice Widget is disabled');
        return;
    }

    // Check if already loaded
    if (window.babyBuddyVoiceWidget) {
        console.log('Baby Buddy Voice Widget already loaded');
        return;
    }
    window.babyBuddyVoiceWidget = true;

    // State
    let mediaRecorder;
    let audioChunks = [];
    let audioBlob;
    let recordingStartTime;
    let timerInterval;

    // Create widget HTML
    const widgetHTML = `
        <div id="bb-voice-widget" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <!-- Floating Button -->
            <button id="bb-voice-btn" style="
                width: 60px;
                height: 60px;
                border-radius: 50%;
                border: none;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                font-size: 28px;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(102, 126, 234, 0.5);
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            " title="Voice Logger">
                🎤
            </button>

            <!-- Modal -->
            <div id="bb-voice-modal" style="
                display: none;
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border-radius: 20px;
                padding: 30px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
                max-width: 400px;
                width: 90%;
                z-index: 10000;
            ">
                <h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px; text-align: center;">
                    🎤 Voice Logger
                </h2>

                <div id="bb-voice-status" style="text-align: center; margin: 20px 0;">
                    <div id="bb-voice-status-text" style="color: #666; margin-bottom: 10px;">
                        Ready to record
                    </div>
                    <div id="bb-voice-timer" style="font-size: 24px; font-weight: bold; color: #333; font-variant-numeric: tabular-nums;">
                        00:00
                    </div>
                </div>

                <div style="display: flex; justify-content: center; margin: 20px 0;">
                    <button id="bb-record-btn" style="
                        width: 80px;
                        height: 80px;
                        border-radius: 50%;
                        border: none;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        font-size: 36px;
                        cursor: pointer;
                        box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
                        transition: all 0.3s ease;
                    ">
                        🎤
                    </button>
                </div>

                <div id="bb-audio-preview" style="display: none; margin: 20px 0;">
                    <audio id="bb-audio-player" controls style="width: 100%;"></audio>
                </div>

                <div id="bb-button-group" style="display: none; gap: 10px; margin-top: 20px;">
                    <button id="bb-cancel-btn" style="
                        flex: 1;
                        padding: 12px 20px;
                        border: none;
                        border-radius: 10px;
                        background: #f5f5f5;
                        color: #666;
                        font-size: 16px;
                        cursor: pointer;
                        font-weight: 600;
                    ">Cancel</button>
                    <button id="bb-submit-btn" style="
                        flex: 1;
                        padding: 12px 20px;
                        border: none;
                        border-radius: 10px;
                        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                        color: white;
                        font-size: 16px;
                        cursor: pointer;
                        font-weight: 600;
                    ">Submit</button>
                </div>

                <div id="bb-loading" style="display: none; text-align: center; margin: 20px 0;">
                    <div style="
                        border: 3px solid #f3f3f3;
                        border-top: 3px solid #667eea;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        animation: bb-spin 1s linear infinite;
                        margin: 0 auto;
                    "></div>
                    <p style="margin-top: 10px; color: #666;">Processing...</p>
                </div>

                <div id="bb-response" style="display: none; padding: 15px; border-radius: 10px; margin-top: 20px;"></div>

                <button id="bb-close-modal" style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: none;
                    border: none;
                    font-size: 24px;
                    color: #999;
                    cursor: pointer;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">×</button>
            </div>

            <!-- Overlay -->
            <div id="bb-voice-overlay" style="
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 9999;
            "></div>
        </div>

        <style>
            @keyframes bb-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            @keyframes bb-pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            #bb-voice-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6);
            }
            #bb-record-btn.recording {
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                animation: bb-pulse 1.5s infinite;
            }
            #bb-button-group {
                display: flex !important;
            }
        </style>
    `;

    // Inject widget
    const container = document.createElement('div');
    container.innerHTML = widgetHTML;
    document.body.appendChild(container);

    // Get elements
    const floatingBtn = document.getElementById('bb-voice-btn');
    const modal = document.getElementById('bb-voice-modal');
    const overlay = document.getElementById('bb-voice-overlay');
    const closeModal = document.getElementById('bb-close-modal');
    const recordBtn = document.getElementById('bb-record-btn');
    const statusText = document.getElementById('bb-voice-status-text');
    const timer = document.getElementById('bb-voice-timer');
    const audioPreview = document.getElementById('bb-audio-preview');
    const audioPlayer = document.getElementById('bb-audio-player');
    const buttonGroup = document.getElementById('bb-button-group');
    const cancelBtn = document.getElementById('bb-cancel-btn');
    const submitBtn = document.getElementById('bb-submit-btn');
    const loading = document.getElementById('bb-loading');
    const response = document.getElementById('bb-response');

    // Open modal
    function openModal() {
        modal.style.display = 'block';
        overlay.style.display = 'block';
        resetState();
    }

    // Close modal
    function closeModalFunc() {
        modal.style.display = 'none';
        overlay.style.display = 'none';
        stopRecording();
        resetState();
    }

    // Reset state
    function resetState() {
        audioBlob = null;
        audioPlayer.src = '';
        audioPreview.style.display = 'none';
        buttonGroup.style.display = 'none';
        response.style.display = 'none';
        loading.style.display = 'none';
        statusText.textContent = 'Ready to record';
        timer.textContent = '00:00';
        recordBtn.classList.remove('recording');
        recordBtn.textContent = '🎤';
    }

    // Start recording
    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                audioPlayer.src = audioUrl;
                audioPreview.style.display = 'block';
                buttonGroup.style.display = 'flex';
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            recordingStartTime = Date.now();

            recordBtn.classList.add('recording');
            recordBtn.textContent = '⏹️';
            statusText.textContent = 'Recording... Click to stop';

            timerInterval = setInterval(updateTimer, 100);

        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone. Please check permissions.');
        }
    }

    // Stop recording
    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            clearInterval(timerInterval);
            recordBtn.classList.remove('recording');
            recordBtn.textContent = '🎤';
            statusText.textContent = 'Recording complete! Review and submit';
        }
    }

    // Update timer
    function updateTimer() {
        const elapsed = Date.now() - recordingStartTime;
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        timer.textContent = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    // Submit recording
    async function submitRecording() {
        if (!audioBlob) {
            alert('No recording to submit');
            return;
        }

        loading.style.display = 'block';
        submitBtn.disabled = true;
        response.style.display = 'none';

        try {
            const formData = new FormData();
            formData.append('data', audioBlob, 'recording.webm');

            const res = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            loading.style.display = 'none';

            if (res.ok && data.success) {
                response.style.display = 'block';
                response.style.background = '#d4edda';
                response.style.color = '#155724';
                response.style.border = '1px solid #c3e6cb';
                response.innerHTML = `
                    <h3 style="margin: 0 0 10px 0;">✅ Success!</h3>
                    <p style="margin: 5px 0;"><strong>Transcription:</strong> ${data.transcription}</p>
                    ${data.feeding ? `<p style="margin: 5px 0;"><strong>Logged:</strong> ${data.feeding.type} feeding</p>` : ''}
                    ${data.sleep ? `<p style="margin: 5px 0;"><strong>Logged:</strong> Sleep session</p>` : ''}
                    ${data.change ? `<p style="margin: 5px 0;"><strong>Logged:</strong> Diaper change</p>` : ''}
                `;

                // Reload Baby Buddy page after success
                setTimeout(() => {
                    location.reload();
                }, 2000);
            } else {
                throw new Error(data.error || 'Unknown error');
            }

        } catch (error) {
            console.error('Error submitting:', error);
            loading.style.display = 'none';
            response.style.display = 'block';
            response.style.background = '#f8d7da';
            response.style.color = '#721c24';
            response.style.border = '1px solid #f5c6cb';
            response.innerHTML = `
                <h3 style="margin: 0 0 10px 0;">❌ Error</h3>
                <p>${error.message}</p>
            `;
        } finally {
            submitBtn.disabled = false;
        }
    }

    // Event listeners
    floatingBtn.addEventListener('click', openModal);
    overlay.addEventListener('click', closeModalFunc);
    closeModal.addEventListener('click', closeModalFunc);

    recordBtn.addEventListener('click', () => {
        if (!mediaRecorder || mediaRecorder.state === 'inactive') {
            startRecording();
        } else {
            stopRecording();
        }
    });

    cancelBtn.addEventListener('click', resetState);
    submitBtn.addEventListener('click', submitRecording);

    console.log('✅ Baby Buddy Voice Widget loaded');
})();
