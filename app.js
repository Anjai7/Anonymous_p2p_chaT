// Anonymous P2P Chat Application
class P2PChat {
    constructor() {
        this.peers = new Map(); // Map of peer connections
        this.dataChannels = new Map(); // Map of data channels
        this.userId = this.generateUserId();
        this.nickname = '';
        this.fileTransfers = new Map(); // Track ongoing file transfers
        
        // WebRTC Configuration
        this.rtcConfig = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ]
        };

        // File transfer constants
        this.MAX_FILE_SIZE = 104857600; // 100MB
        this.CHUNK_SIZE = 65536; // 64KB

        this.init();
    }

    generateUserId() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID().substring(0, 8);
        }
        // Fallback for browsers without crypto.randomUUID
        return 'xxxxxxxx'.replace(/[x]/g, () => 
            (Math.random() * 16 | 0).toString(16)
        );
    }

    init() {
        this.setupUI();
        this.bindEvents();
        document.getElementById('userId').textContent = this.userId;
        
        // Check WebRTC support
        if (!this.checkWebRTCSupport()) {
            this.showError('Your browser does not support WebRTC');
        }
    }

    checkWebRTCSupport() {
        return !!(window.RTCPeerConnection && window.RTCDataChannel);
    }

    setupUI() {
        // Initialize UI state
        this.updateConnectionStatus();
        this.updatePeersList();
        
        // Initially hide code output sections
        document.getElementById('offerOutput').style.display = 'none';
        document.getElementById('answerOutput').style.display = 'none';
    }

    bindEvents() {
        // Nickname input
        document.getElementById('nicknameInput').addEventListener('input', (e) => {
            this.nickname = e.target.value.trim();
        });

        // Connection buttons
        document.getElementById('createOfferBtn').addEventListener('click', () => this.createOffer());
        document.getElementById('joinSessionBtn').addEventListener('click', () => this.joinSession());
        document.getElementById('completeConnectionBtn').addEventListener('click', () => this.completeConnection());
        
        // Copy buttons
        document.getElementById('copyOfferBtn').addEventListener('click', () => this.copyToClipboard('offerText'));
        document.getElementById('copyAnswerBtn').addEventListener('click', () => this.copyToClipboard('answerText'));
        
        // Chat functionality
        document.getElementById('sendMessageBtn').addEventListener('click', () => this.sendMessage());
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // File handling
        document.getElementById('fileDropZone').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop
        const dropZone = document.getElementById('fileDropZone');
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
            this.handleFileSelect(e);
        });

        // Show connection panel toggle
        document.getElementById('showConnectionPanelBtn').addEventListener('click', () => {
            const panel = document.getElementById('connectionPanel');
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });

        // Auto-resize message input
        const messageInput = document.getElementById('messageInput');
        messageInput.addEventListener('input', () => {
            messageInput.style.height = 'auto';
            messageInput.style.height = messageInput.scrollHeight + 'px';
        });
    }

    async createOffer() {
        try {
            this.showStatus('Creating connection code...', 'info');
            
            const peerId = 'peer_' + Date.now();
            const peerConnection = new RTCPeerConnection(this.rtcConfig);
            
            // Setup data channel
            const dataChannel = peerConnection.createDataChannel('chat', {
                ordered: true
            });
            this.setupDataChannel(dataChannel, peerId);
            
            // Setup peer connection
            this.setupPeerConnection(peerConnection, peerId);
            this.peers.set(peerId, peerConnection);
            
            // Create offer
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            
            // Wait for ICE gathering to complete
            await this.waitForICEGathering(peerConnection);
            
            // Display offer for sharing
            const offerData = {
                type: 'offer',
                sdp: peerConnection.localDescription,
                userId: this.userId,
                nickname: this.nickname || `User ${this.userId}`
            };
            
            document.getElementById('offerText').value = JSON.stringify(offerData, null, 2);
            document.getElementById('offerOutput').style.display = 'block';
            
            this.showStatus('Connection code generated successfully!', 'success');
            
        } catch (error) {
            console.error('Error creating offer:', error);
            this.showError('Failed to create connection offer: ' + error.message);
        }
    }

    async joinSession() {
        try {
            const offerInput = document.getElementById('offerInput').value.trim();
            if (!offerInput) {
                this.showError('Please paste a connection code');
                return;
            }

            this.showStatus('Processing connection code...', 'info');

            const offerData = JSON.parse(offerInput);
            const peerId = 'peer_' + Date.now();
            const peerConnection = new RTCPeerConnection(this.rtcConfig);
            
            // Setup peer connection
            this.setupPeerConnection(peerConnection, peerId);
            this.peers.set(peerId, peerConnection);
            
            // Set remote description
            await peerConnection.setRemoteDescription(offerData.sdp);
            
            // Create answer
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            
            // Wait for ICE gathering
            await this.waitForICEGathering(peerConnection);
            
            // Display answer for sharing
            const answerData = {
                type: 'answer',
                sdp: peerConnection.localDescription,
                userId: this.userId,
                nickname: this.nickname || `User ${this.userId}`
            };
            
            document.getElementById('answerText').value = JSON.stringify(answerData, null, 2);
            document.getElementById('answerOutput').style.display = 'block';
            
            this.showStatus('Response code generated successfully!', 'success');
            
        } catch (error) {
            console.error('Error joining session:', error);
            this.showError('Failed to join session: ' + error.message);
        }
    }

    async completeConnection() {
        try {
            const answerInput = document.getElementById('answerInput').value.trim();
            if (!answerInput) {
                this.showError('Please paste a response code');
                return;
            }

            this.showStatus('Establishing connection...', 'info');

            const answerData = JSON.parse(answerInput);
            
            // Find the peer connection that's waiting for this answer
            let connected = false;
            for (const [peerId, peerConnection] of this.peers) {
                if (peerConnection.signalingState === 'have-local-offer') {
                    await peerConnection.setRemoteDescription(answerData.sdp);
                    this.showStatus('Connection established!', 'success');
                    connected = true;
                    break;
                }
            }
            
            if (!connected) {
                this.showError('No pending connection found. Please create an offer first.');
            }
            
        } catch (error) {
            console.error('Error completing connection:', error);
            this.showError('Failed to complete connection: ' + error.message);
        }
    }

    setupPeerConnection(peerConnection, peerId) {
        peerConnection.oniceconnectionstatechange = () => {
            console.log(`ICE connection state for ${peerId}:`, peerConnection.iceConnectionState);
            
            if (peerConnection.iceConnectionState === 'connected' || 
                peerConnection.iceConnectionState === 'completed') {
                this.addSystemMessage(`Connected to peer`);
                this.showChatInterface();
            } else if (peerConnection.iceConnectionState === 'disconnected' || 
                       peerConnection.iceConnectionState === 'failed') {
                this.addSystemMessage(`Peer disconnected`);
                this.removePeer(peerId);
            }
            this.updateConnectionStatus();
        };

        peerConnection.ondatachannel = (event) => {
            this.setupDataChannel(event.channel, peerId);
        };

        peerConnection.onicecandidate = (event) => {
            // ICE candidates are included in the SDP when gathering is complete
            if (event.candidate) {
                console.log('ICE candidate:', event.candidate);
            }
        };
    }

    setupDataChannel(dataChannel, peerId) {
        this.dataChannels.set(peerId, dataChannel);

        dataChannel.onopen = () => {
            console.log(`Data channel opened for ${peerId}`);
            this.updatePeersList();
            this.showStatus('Data channel connected!', 'success');
        };

        dataChannel.onclose = () => {
            console.log(`Data channel closed for ${peerId}`);
            this.dataChannels.delete(peerId);
            this.updatePeersList();
        };

        dataChannel.onmessage = (event) => {
            this.handleMessage(event.data, peerId);
        };

        dataChannel.onerror = (error) => {
            console.error('Data channel error:', error);
            this.showError('Data channel error: ' + error.message);
        };
    }

    async waitForICEGathering(peerConnection) {
        return new Promise((resolve) => {
            if (peerConnection.iceGatheringState === 'complete') {
                resolve();
                return;
            }

            const checkState = () => {
                if (peerConnection.iceGatheringState === 'complete') {
                    peerConnection.removeEventListener('icegatheringstatechange', checkState);
                    resolve();
                }
            };

            peerConnection.addEventListener('icegatheringstatechange', checkState);
            
            // Timeout after 10 seconds
            setTimeout(() => {
                peerConnection.removeEventListener('icegatheringstatechange', checkState);
                resolve();
            }, 10000);
        });
    }

    handleMessage(data, peerId) {
        try {
            const message = JSON.parse(data);
            
            switch (message.type) {
                case 'text':
                    this.displayMessage(message, false);
                    break;
                case 'file-offer':
                    this.handleFileOffer(message, peerId);
                    break;
                case 'file-chunk':
                    this.handleFileChunk(message, peerId);
                    break;
                case 'file-complete':
                    this.handleFileComplete(message, peerId);
                    break;
                default:
                    console.log('Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    }

    sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const text = messageInput.value.trim();
        
        if (!text) return;
        
        if (this.dataChannels.size === 0) {
            this.showError('No peers connected');
            return;
        }

        const message = {
            type: 'text',
            content: text,
            userId: this.userId,
            nickname: this.nickname || `User ${this.userId}`,
            timestamp: new Date().toISOString()
        };

        // Send to all connected peers
        this.broadcastMessage(message);
        
        // Display in own chat
        this.displayMessage(message, true);
        
        // Clear input
        messageInput.value = '';
        messageInput.style.height = 'auto';
    }

    broadcastMessage(message) {
        const messageStr = JSON.stringify(message);
        for (const [peerId, dataChannel] of this.dataChannels) {
            if (dataChannel.readyState === 'open') {
                try {
                    dataChannel.send(messageStr);
                } catch (error) {
                    console.error(`Failed to send message to ${peerId}:`, error);
                }
            }
        }
    }

    displayMessage(message, isOwn) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageEl = document.createElement('div');
        messageEl.className = `message ${isOwn ? 'own' : ''}`;

        const time = new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit', 
            minute: '2-digit'
        });

        messageEl.innerHTML = `
            <div class="message-bubble">
                ${this.escapeHtml(message.content)}
            </div>
            <div class="message-info">
                <div class="message-sender">${this.escapeHtml(message.nickname)}</div>
                <div class="message-time">${time}</div>
            </div>
        `;

        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    handleFileSelect(event) {
        const files = event.target?.files || event.dataTransfer?.files;
        if (!files || files.length === 0) return;

        for (const file of files) {
            if (file.size > this.MAX_FILE_SIZE) {
                this.showError(`File "${file.name}" is too large. Maximum size is 100MB.`);
                continue;
            }
            
            if (this.dataChannels.size === 0) {
                this.showError('No peers connected for file sharing');
                return;
            }
            
            this.sendFile(file);
        }

        // Clear file input
        document.getElementById('fileInput').value = '';
    }

    async sendFile(file) {
        const transferId = 'transfer_' + Date.now();
        const totalChunks = Math.ceil(file.size / this.CHUNK_SIZE);
        
        // Send file offer to all peers
        const fileOffer = {
            type: 'file-offer',
            transferId: transferId,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            totalChunks: totalChunks,
            userId: this.userId,
            nickname: this.nickname || `User ${this.userId}`,
            timestamp: new Date().toISOString()
        };

        this.broadcastMessage(fileOffer);

        // Show progress
        this.showFileProgress(file.name, file.size, 0);

        // Send file chunks
        try {
            const arrayBuffer = await file.arrayBuffer();
            
            for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
                const start = chunkIndex * this.CHUNK_SIZE;
                const end = Math.min(start + this.CHUNK_SIZE, file.size);
                const chunk = arrayBuffer.slice(start, end);
                
                const chunkMessage = {
                    type: 'file-chunk',
                    transferId: transferId,
                    chunkIndex: chunkIndex,
                    data: Array.from(new Uint8Array(chunk))
                };

                this.broadcastMessage(chunkMessage);
                
                // Update progress
                const progress = ((chunkIndex + 1) / totalChunks) * 100;
                this.updateFileProgress(progress);

                // Small delay to prevent overwhelming the connection
                if (chunkIndex % 10 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            }

            // Send completion message
            const completeMessage = {
                type: 'file-complete',
                transferId: transferId
            };

            this.broadcastMessage(completeMessage);
            
            // Hide progress after a delay
            setTimeout(() => this.hideFileProgress(), 1000);

        } catch (error) {
            console.error('Error sending file:', error);
            this.showError('Failed to send file: ' + error.message);
            this.hideFileProgress();
        }
    }

    handleFileOffer(message, peerId) {
        // Initialize file transfer tracking
        this.fileTransfers.set(message.transferId, {
            fileName: message.fileName,
            fileSize: message.fileSize,
            fileType: message.fileType,
            totalChunks: message.totalChunks,
            chunks: new Array(message.totalChunks),
            receivedChunks: 0
        });

        // Display file message
        this.displayFileMessage(message);
    }

    handleFileChunk(message, peerId) {
        const transfer = this.fileTransfers.get(message.transferId);
        if (!transfer) return;

        transfer.chunks[message.chunkIndex] = new Uint8Array(message.data);
        transfer.receivedChunks++;

        // Check if all chunks received
        if (transfer.receivedChunks === transfer.totalChunks) {
            this.completeFileTransfer(message.transferId);
        }
    }

    handleFileComplete(message, peerId) {
        // File transfer completed
        console.log('File transfer completed:', message.transferId);
    }

    completeFileTransfer(transferId) {
        const transfer = this.fileTransfers.get(transferId);
        if (!transfer) return;

        // Combine all chunks
        const totalSize = transfer.chunks.reduce((size, chunk) => size + chunk.length, 0);
        const fileData = new Uint8Array(totalSize);
        let offset = 0;

        for (const chunk of transfer.chunks) {
            fileData.set(chunk, offset);
            offset += chunk.length;
        }

        // Create download link
        const blob = new Blob([fileData], { type: transfer.fileType });
        const downloadUrl = URL.createObjectURL(blob);
        
        // Update the file message with download link
        this.updateFileMessageWithDownload(transferId, downloadUrl, transfer.fileName);
        
        // Clean up
        this.fileTransfers.delete(transferId);
    }

    displayFileMessage(message) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageEl = document.createElement('div');
        messageEl.className = 'message';
        messageEl.dataset.transferId = message.transferId;

        const time = new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit', 
            minute: '2-digit'
        });

        const fileSize = this.formatFileSize(message.fileSize);
        const fileExtension = message.fileName.split('.').pop()?.toUpperCase() || 'FILE';

        messageEl.innerHTML = `
            <div class="message-bubble">
                <div class="file-message">
                    <div class="file-icon">${fileExtension.charAt(0)}</div>
                    <div class="file-info">
                        <div class="file-name">${this.escapeHtml(message.fileName)}</div>
                        <div class="file-size">${fileSize}</div>
                    </div>
                    <div class="file-status">Receiving...</div>
                </div>
            </div>
            <div class="message-info">
                <div class="message-sender">${this.escapeHtml(message.nickname)}</div>
                <div class="message-time">${time}</div>
            </div>
        `;

        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    updateFileMessageWithDownload(transferId, downloadUrl, fileName) {
        const messageEl = document.querySelector(`[data-transfer-id="${transferId}"]`);
        if (messageEl) {
            const statusEl = messageEl.querySelector('.file-status');
            statusEl.innerHTML = `<button class="btn btn--primary file-download">Download</button>`;
            
            // Add click handler for download
            const downloadBtn = statusEl.querySelector('.file-download');
            downloadBtn.addEventListener('click', () => {
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = fileName;
                a.click();
                URL.revokeObjectURL(downloadUrl);
            });
        }
    }

    showFileProgress(fileName, fileSize, progress) {
        const progressEl = document.getElementById('fileTransferProgress');
        document.getElementById('progressFileName').textContent = fileName;
        document.getElementById('progressSize').textContent = this.formatFileSize(fileSize);
        this.updateFileProgress(progress);
        progressEl.style.display = 'block';
    }

    updateFileProgress(progress) {
        const progressBar = document.getElementById('progressBar');
        const progressPercent = document.getElementById('progressPercent');
        progressBar.style.width = progress + '%';
        progressPercent.textContent = Math.round(progress) + '%';
    }

    hideFileProgress() {
        document.getElementById('fileTransferProgress').style.display = 'none';
    }

    addSystemMessage(text) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageEl = document.createElement('div');
        messageEl.className = 'system-message';
        messageEl.textContent = text;
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showChatInterface() {
        document.getElementById('chatContainer').style.display = 'flex';
    }

    updateConnectionStatus() {
        const connectedCount = this.dataChannels.size;
        const statusDot = document.getElementById('connectionStatus');
        const statusText = document.getElementById('connectionText');
        
        if (connectedCount > 0) {
            statusDot.className = 'status-dot connected';
            statusText.textContent = 'Connected';
        } else {
            statusDot.className = 'status-dot';
            statusText.textContent = 'Disconnected';
        }
    }

    updatePeersList() {
        const peerCount = document.getElementById('peerCount');
        const peersList = document.getElementById('peersList');
        
        peerCount.textContent = this.dataChannels.size;
        peersList.innerHTML = '';
        
        let peerIndex = 1;
        for (const [peerId, dataChannel] of this.dataChannels) {
            if (dataChannel.readyState === 'open') {
                const peerEl = document.createElement('div');
                peerEl.className = 'peer-item';
                peerEl.textContent = `Peer ${peerIndex}`;
                peersList.appendChild(peerEl);
                peerIndex++;
            }
        }
    }

    removePeer(peerId) {
        this.peers.delete(peerId);
        this.dataChannels.delete(peerId);
        this.updateConnectionStatus();
        this.updatePeersList();
    }

    async copyToClipboard(elementId) {
        const element = document.getElementById(elementId);
        try {
            await navigator.clipboard.writeText(element.value);
            this.showStatus('Copied to clipboard!', 'success');
        } catch (error) {
            // Fallback for older browsers
            element.select();
            document.execCommand('copy');
            this.showStatus('Copied to clipboard!', 'success');
        }
    }

    showStatus(message, type = 'info') {
        const container = document.getElementById('statusMessages');
        const messageEl = document.createElement('div');
        messageEl.className = `status-message ${type}`;
        messageEl.textContent = message;
        
        container.appendChild(messageEl);
        
        // Trigger animation
        setTimeout(() => messageEl.classList.add('show'), 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            messageEl.classList.remove('show');
            setTimeout(() => container.removeChild(messageEl), 300);
        }, 3000);
    }

    showError(message) {
        this.showStatus(message, 'error');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new P2PChat();
});