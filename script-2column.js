const robotMap = {};
let currentEditingRobot = null;
let currentDeletingRobot = null;
const SERVER_IP = "10.0.8.6";

// Configuration for 2-column layout
const LAYOUT_CONFIG = {
    leftSide: {
        maxRobots: 8,
        gridId: 'robotGridLeft',
        startIP: '192.168.33.1',
        label: 'Production Line A'
    },
    rightSide: {
        maxRobots: 8,
        gridId: 'robotGridRight', 
        startIP: '192.168.33.9',
        label: 'Production Line B'
    }
};

function getStatusColor(status) {
    switch (status) {
        case "Running": return "linear-gradient(135deg, #28a745, #20c997)";
        case "Wait_WK": return "linear-gradient(135deg, #e3f113ff, #fd7e14)";
        case "No_Plan": return "linear-gradient(135deg, #e607eeff, #fd7e14)";
        case "NP": return "linear-gradient(135deg, #d606baff, #f205faff)";
        case "MC_ERROR": return "linear-gradient(135deg, #f51303ff, #e00fa2ff)";
        default: return "linear-gradient(135deg, #6c757d, #495057)";
    }
}

function getStatusTextColor(status) {
    switch (status) {
        case "Running": return "#28a745";
        case "Wait_WK": return "#ffc107";
        case "No_Plan": return "#dc3545";
        case "NP": return "rgba(243, 4, 36, 1)";
        case "MC_ERROR": return "#db2404ff";
        default: return "#6c757d";
    }
}

let DEBUG_MODE = false;

function debugLog(...args) {
    if (DEBUG_MODE) console.log(...args);
}

function toggleLog() {
    DEBUG_MODE = !DEBUG_MODE;
    const state = DEBUG_MODE ? "BẬT" : "TẮT";
    showNotification(`🛠️ Log Debug đang ${state}`, 'warning');
}

function getStatusText(status) {
    switch (status) {
        case "Running": return "Running";
        case "Wait_WK": return "Wait_WK";
        case "PAUSE": return "Tạm dừng";
        case "No_Plan": return "No_Plan";
        case "NP": return "NP";
        case "MC_ERROR": return "MC_ERROR";
        case "RBCOUNT": return "";
        default: return "Chờ stt";
    }
}

function formatIP(ip) {
    if (ip && ip.startsWith('192.168.')) {
        const parts = ip.split('.');
        return parts[2] + '.' + parts[3];
    }
    return ip || '';
}

function getRobotSide(ip) {
    // Determine which side the robot belongs to based on IP
    if (ip && ip.startsWith('192.168.33.')) {
        const lastOctet = parseInt(ip.split('.')[3]);
        return lastOctet <= 8 ? 'left' : 'right';
    }
    // Default to left side for other IPs
    return 'left';
}

function getTargetGrid(ip) {
    const side = getRobotSide(ip);
    return side === 'left' ? LAYOUT_CONFIG.leftSide.gridId : LAYOUT_CONFIG.rightSide.gridId;
}

function createRobotCard(ip, targetSide = null) {
    // Check if card already exists
    if (document.getElementById("robot-" + ip)) {
        debugLog("❌ Card already exists for IP:", ip);
        return;
    }

    const card = document.createElement('div');
    card.className = "robot-card";
    card.id = "robot-" + ip;

    const header = document.createElement('div');
    header.className = "robot-header";
    header.id = "header-" + ip;
    header.style.background = getStatusColor("UNKNOWN");

    header.innerHTML = `
            <span id="ip-${ip}" style="flex:1; text-align:center; z-index: 1; position: relative;">${formatIP(ip)}</span>
            <div class="robot-actions">
                <button class="action-btn edit-btn" onclick="showEditModal('${ip}')" title="Chỉnh sửa">✏️</button>
                <button class="action-btn delete-btn" onclick="showDeleteModal('${ip}')" title="Xóa">🗑️</button>
            </div>
        `;

    const body = document.createElement('div');
    body.className = "robot-body";
    body.innerHTML = `
            <div class="status-line" id="status-${ip}" style="color: ${getStatusTextColor('UNKNOWN')};">Chờ</div>
            <div class="process-line" id="process-${ip}">--- | ---</div>
        `;

    card.appendChild(header);
    card.appendChild(body);
    
    // Determine target grid
    const targetGridId = targetSide || getTargetGrid(ip);
    const robotGrid = document.getElementById(targetGridId);
    
    if (robotGrid) {
        robotGrid.appendChild(card);

        // Add entrance animation
        setTimeout(() => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px) scale(0.9)';
            card.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0) scale(1)';
            }, 100);
        }, 50);
    } else {
        console.error("❌ Target grid not found:", targetGridId);
    }
}

function updateRobotInfo(ip, model, process, status) {
    debugLog("🔄 Updating robot info:", { ip, model, process, status });

    const statusElement = document.getElementById(`status-${ip}`);
    const processElement = document.getElementById(`process-${ip}`);
    const header = document.getElementById(`header-${ip}`);

    if (statusElement) {
        const statusText = getStatusText(status);
        const statusColor = getStatusTextColor(status);
        statusElement.innerText = statusText;
        statusElement.style.color = statusColor;
        statusElement.style.backgroundColor = statusColor + '20';
        statusElement.style.border = `1px solid ${statusColor}40`;
    }

    if (processElement) {
        const processText = `${process || '---'} | ${model || '---'}`;
        processElement.innerText = processText;
    }

    if (header) {
        const headerColor = getStatusColor(status);
        header.style.background = headerColor;

        // Add pulse effect for active status
        if (status === "Running") {
            header.classList.add('blink');
        } else {
            header.classList.remove('blink');
        }
    }
}

function showAddModal() {
    // Count robots in each side
    const leftGrid = document.getElementById(LAYOUT_CONFIG.leftSide.gridId);
    const rightGrid = document.getElementById(LAYOUT_CONFIG.rightSide.gridId);
    
    const leftCount = leftGrid ? leftGrid.children.length : 0;
    const rightCount = rightGrid ? rightGrid.children.length : 0;
    
    let addedCount = 0;
    
    // Add to left side first if space available
    if (leftCount < LAYOUT_CONFIG.leftSide.maxRobots) {
        const startNum = parseInt(LAYOUT_CONFIG.leftSide.startIP.split('.')[3]);
        for (let i = 0; i < LAYOUT_CONFIG.leftSide.maxRobots - leftCount; i++) {
            const newIP = `192.168.33.${startNum + leftCount + i}`;
            if (!robotMap[newIP]) {
                createRobotCard(newIP, LAYOUT_CONFIG.leftSide.gridId);
                robotMap[newIP] = { side: 'left' };
                addedCount++;
            }
        }
    }
    
    // Add to right side if space available
    if (rightCount < LAYOUT_CONFIG.rightSide.maxRobots) {
        const startNum = parseInt(LAYOUT_CONFIG.rightSide.startIP.split('.')[3]);
        for (let i = 0; i < LAYOUT_CONFIG.rightSide.maxRobots - rightCount; i++) {
            const newIP = `192.168.33.${startNum + rightCount + i}`;
            if (!robotMap[newIP]) {
                createRobotCard(newIP, LAYOUT_CONFIG.rightSide.gridId);
                robotMap[newIP] = { side: 'right' };
                addedCount++;
            }
        }
    }

    if (addedCount > 0) {
        saveLayout();
        showNotification(`✅ Đã thêm ${addedCount} robot thành công!`, 'success');
    } else {
        showNotification('⚠️ Không thể thêm robot mới. Cả 2 bên đã đầy (8 robots/side).', 'warning');
    }
}

function showEditModal(ip) {
    const modalTitle = document.getElementById('modalTitle');
    const modalInput = document.getElementById('modalInput');
    const modal = document.getElementById('addEditModal');
    
    if (!modalTitle || !modalInput || !modal) {
        console.error("❌ Modal elements not found");
        return;
    }

    modalTitle.textContent = 'Chỉnh sửa Robot';
    modalInput.value = ip;
    modalInput.placeholder = 'Nhập IP Robot mới';
    currentEditingRobot = ip;
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);
}

function showDeleteModal(ip) {
    const deleteRobotName = document.getElementById('deleteRobotName');
    const modal = document.getElementById('deleteModal');
    
    if (!deleteRobotName || !modal) {
        console.error("❌ Delete modal elements not found");
        return;
    }

    deleteRobotName.textContent = formatIP(ip);
    currentDeletingRobot = ip;
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeModal() {
    const addEditModal = document.getElementById('addEditModal');
    const deleteModal = document.getElementById('deleteModal');

    if (addEditModal) {
        addEditModal.classList.remove('show');
        setTimeout(() => {
            addEditModal.style.display = 'none';
        }, 300);
    }

    if (deleteModal) {
        deleteModal.classList.remove('show');
        setTimeout(() => {
            deleteModal.style.display = 'none';
        }, 300);
    }

    currentEditingRobot = null;
    currentDeletingRobot = null;
}

function confirmAddEdit() {
    const modalInput = document.getElementById('modalInput');
    if (!modalInput) {
        console.error("❌ Modal input not found");
        return;
    }

    const newIp = modalInput.value.trim();

    if (!newIp) {
        showNotification('⚠️ Vui lòng nhập IP Robot', 'error');
        return;
    }

    if (currentEditingRobot) {
        if (newIp !== currentEditingRobot) {
            if (robotMap[newIp]) {
                showNotification('❌ IP này đã tồn tại!', 'error');
                return;
            }

            // Store old side info
            const oldSide = robotMap[currentEditingRobot]?.side || getRobotSide(currentEditingRobot);
            
            robotMap[newIp] = { ...robotMap[currentEditingRobot], side: getRobotSide(newIp) };
            delete robotMap[currentEditingRobot];

            const card = document.getElementById("robot-" + currentEditingRobot);
            if (card) {
                // Check if robot needs to move to different side
                const newSide = getRobotSide(newIp);
                if (oldSide !== newSide) {
                    // Remove from old side and add to new side
                    card.remove();
                    createRobotCard(newIp);
                } else {
                    // Update in place
                    card.id = "robot-" + newIp;

                    const header = document.getElementById("header-" + currentEditingRobot);
                    if (header) header.id = "header-" + newIp;

                    const ipSpan = document.getElementById("ip-" + currentEditingRobot);
                    if (ipSpan) {
                        ipSpan.id = "ip-" + newIp;
                        ipSpan.textContent = formatIP(newIp);
                    }

                    const statusElement = document.getElementById("status-" + currentEditingRobot);
                    if (statusElement) statusElement.id = "status-" + newIp;

                    const processElement = document.getElementById("process-" + currentEditingRobot);
                    if (processElement) processElement.id = "process-" + newIp;

                    const actionsDiv = card.querySelector('.robot-actions');
                    if (actionsDiv) {
                        actionsDiv.innerHTML = `
                                <button class="action-btn edit-btn" onclick="showEditModal('${newIp}')" title="Chỉnh sửa">✏️</button>
                                <button class="action-btn delete-btn" onclick="showDeleteModal('${newIp}')" title="Xóa">🗑️</button>
                            `;
                    }
                }

                showNotification('✅ Đã cập nhật robot thành công!', 'success');
            }
        }
    }

    saveLayout();
    closeModal();
}

function confirmDelete() {
    if (currentDeletingRobot) {
        const card = document.getElementById("robot-" + currentDeletingRobot);
        if (card) {
            card.style.transform = 'scale(0.8)';
            card.style.opacity = '0';
            setTimeout(() => {
                card.remove();
            }, 300);
        }

        delete robotMap[currentDeletingRobot];
        saveLayout();
        showNotification('✅ Đã xóa robot thành công!', 'success');
        closeModal();
    }
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 3000);
}

function saveLayout() {
    const leftGrid = document.getElementById(LAYOUT_CONFIG.leftSide.gridId);
    const rightGrid = document.getElementById(LAYOUT_CONFIG.rightSide.gridId);
    
    const layout = {
        left: leftGrid ? Array.from(leftGrid.querySelectorAll(".robot-card")).map(card => card.id.replace("robot-", "")) : [],
        right: rightGrid ? Array.from(rightGrid.querySelectorAll(".robot-card")).map(card => card.id.replace("robot-", "")) : []
    };
    
    fetch(`http://${SERVER_IP}:3000/api/saveLayout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layout })
    }).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        debugLog("✅ Đã lưu layout");
    }).catch(err => console.error("❌ Lỗi khi lưu layout:", err));
}

// Close modal when clicking outside
window.onclick = function (event) {
    const addEditModal = document.getElementById('addEditModal');
    const deleteModal = document.getElementById('deleteModal');
    if (event.target === addEditModal || event.target === deleteModal) {
        closeModal();
    }
}

// Close modal with Escape key
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});

// Initialize page
document.addEventListener('DOMContentLoaded', function () {
    debugLog("✅ DOM loaded");

    // Add loading animation to body
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.8s ease';
        document.body.style.opacity = '1';
    }, 100);

    // Load layout after DOM is ready
    loadInitialLayout();
});

function loadInitialLayout() {
    fetch(`http://${SERVER_IP}:3000/api/getLayout`)
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            if (data && data.layout) {
                // Handle both old format (array) and new format (object with left/right)
                if (Array.isArray(data.layout)) {
                    // Old format - distribute evenly
                    data.layout.forEach((ip, index) => {
                        setTimeout(() => {
                            createRobotCard(ip);
                            robotMap[ip] = { side: getRobotSide(ip) };
                        }, index * 50);
                    });
                } else {
                    // New format with left/right sides
                    if (data.layout.left) {
                        data.layout.left.forEach((ip, index) => {
                            setTimeout(() => {
                                createRobotCard(ip, LAYOUT_CONFIG.leftSide.gridId);
                                robotMap[ip] = { side: 'left' };
                            }, index * 50);
                        });
                    }
                    
                    if (data.layout.right) {
                        data.layout.right.forEach((ip, index) => {
                            setTimeout(() => {
                                createRobotCard(ip, LAYOUT_CONFIG.rightSide.gridId);
                                robotMap[ip] = { side: 'right' };
                            }, (index + (data.layout.left?.length || 0)) * 50);
                        });
                    }
                }
            } else {
                debugLog("⚠️ No layout data received or invalid format");
            }
        })
        .catch(err => console.error("❌ Lỗi khi load layout:", err));
}

// SignalR Connection - Fixed initialization
function initializeSignalR() {
    // Check if signalR is available
    if (typeof signalR === 'undefined') {
        console.error("❌ SignalR library not loaded");
        showNotification("❌ SignalR library không có sẵn", 'error');
        return;
    }

    const connection = new signalR.HubConnectionBuilder()
        .withUrl("/myhub?type=viewer")
        .configureLogging(signalR.LogLevel.Information)
        .build();

    connection.on("ReceiveMessage", (message) => {
        debugLog("📨 Received message:", message);

        if (message && message.startsWith("CLIENT:DATA:MC_IP:")) {
            const data = message.split(":")[3];
            debugLog("📊 Data after split:", data);

            if (data) {
                const parts = data.split("|");
                if (parts.length >= 4) {
                    const [ip, model, process, status] = parts;
                    const trimmedIp = ip ? ip.trim() : '';

                    debugLog("🤖 Parsed data:", {
                        ip: trimmedIp,
                        model: model,
                        process: process,
                        status: status
                    });

                    if (trimmedIp && robotMap[trimmedIp]) {
                        debugLog("✅ Updating robot info for:", trimmedIp);
                        updateRobotInfo(trimmedIp, model, process, status);
                    } else {
                        debugLog("❌ Robot not found in map:", trimmedIp);
                    }
                } else {
                    debugLog("❌ Invalid data format:", data);
                }
            }
        }
    });

    connection.start()
        .then(() => {
            debugLog("✅ SignalR Connected");
            showNotification("🔗 Đã kết nối SignalR", 'success');
        })
        .catch(err => {
            console.error("❌ SignalR Error:", err);
            showNotification("❌ Lỗi kết nối SignalR", 'error');
        });

    return connection;
}

// Initialize SignalR after DOM is loaded
let signalRConnection = null;
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        signalRConnection = initializeSignalR();
    }, 1000);
});

// Add mouse interaction with bounds checking
document.addEventListener('mousemove', function (e) {
    const cards = document.querySelectorAll('.robot-card');
    cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = Math.max(-15, Math.min(15, (y - centerY) / 10));
            const rotateY = Math.max(-15, Math.min(15, (centerX - x) / 10));

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        }
    });
});

document.addEventListener('mouseleave', function () {
    const cards = document.querySelectorAll('.robot-card');
    cards.forEach(card => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
    });
});

// Add keyboard shortcuts with preventDefault
document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        showAddModal();
    }
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        toggleLog();
    }
});

// Add smooth scrolling
if (document.documentElement) {
    document.documentElement.style.scrollBehavior = 'smooth';
}

// Performance optimization: Use requestAnimationFrame for smooth animations
let animationFrameId;
function smoothUpdate() {
    // Only continue animation if page is visible
    if (!document.hidden) {
        animationFrameId = requestAnimationFrame(smoothUpdate);
    }
}

// Start animation loop when page becomes visible
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && !animationFrameId) {
        smoothUpdate();
    } else if (document.hidden && animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
});

// Start initial animation
smoothUpdate();