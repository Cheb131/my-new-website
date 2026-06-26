let currentSkillElement = null; // Biến lưu vết ô kỹ năng đang được click
let currentSkillName = "";      // Lưu tên kỹ năng gốc để hiển thị lúc chọn xong

/**
 * HÀM GỘP CHUNG: Xử lý cơ chế Rút 3 chọn 1 cho bất kỳ kỹ năng nào
 * @param {HTMLElement} element - Ô kỹ năng vừa được click
 * @param {string} originalName - Tên kỹ năng gốc (Độn Thế, Bác Lãm...)
 * @param {string} apiUrl - Đường dẫn API tương ứng để lấy dữ liệu pool
 */
async function trigger3pick1(element, originalName, apiUrl) {
    currentSkillElement = element;
    currentSkillName = originalName; 
    
    const panel = document.getElementById('choicesPanel');
    const list = document.getElementById('choicesList');
    
    panel.style.display = "block";
    list.innerHTML = '<p class="status-msg" style="font-size:12px;">Đang bốc 3 quẻ bùa...</p>';
    
    // Cuộn màn hình mượt xuống khu vực bốc chọn trên mobile
    setTimeout(() => { panel.scrollIntoView({ behavior: 'smooth' }); }, 100);

    try {
        // Gọi API động tùy thuộc vào tham số truyền vào từ thẻ bài tướng
        const response = await fetch(apiUrl);
        const skills = await response.json();
        
        list.innerHTML = '';
        skills.forEach(skill => {
            const option = document.createElement('div');
            option.className = 'choice-item';
            option.innerHTML = `<span class="skill-name" style="color:#ffcc00">【${skill.name}】</span> ${skill.desc}`;
            option.onclick = () => selectSkill(skill.name, skill.desc);
            list.appendChild(option);
        });
    } catch (err) {
        list.innerHTML = '<p style="color:#ff4444; font-size:12px;">Lỗi kết nối kho báu!</p>';
    }
}

// Hàm xử lý khi người dùng ấn chọn 1 kỹ năng
function selectSkill(name, desc) {
    const selectedList = document.getElementById('selectedList');
    
    const emptyMsg = selectedList.querySelector('.empty-msg');
    if (emptyMsg) emptyMsg.remove();

    const item = document.createElement('div');
    item.className = 'selected-item';
    item.innerHTML = `
        <span class="skill-name" style="color:var(--theme-color)">【${currentSkillName} ➔ ${name}】</span> ${desc}
        <button class="delete-btn" onclick="deleteSkill(this)">✖</button>
    `;
    
    selectedList.appendChild(item);
    
    document.getElementById('choicesPanel').style.display = "none";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteSkill(btnElement) {
    btnElement.parentElement.remove();
    const selectedList = document.getElementById('selectedList');
    if (selectedList.children.length === 0) {
        selectedList.innerHTML = '<div class="empty-msg">Chưa có kỹ năng nào được chọn. Hãy nhấn vào các ô kỹ năng đặc biệt phía trên.</div>';
    }
}

// Hàm khởi tạo tải thông tin các tướng từ Backend
async function loadGenerals() {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '<p class="status-msg" style="font-size:14px;">Đang triệu hồi các võ tướng...</p>';
    
    try {
        const response = await fetch('/api/generals');
        const generals = await response.json();
        
        resultDiv.innerHTML = '';
        generals.forEach(gen => {
            const card = document.createElement('div');
            card.className = 'card donthe-effect';
            
            const baseColor = gen.bg_color || '#4a3525';
            card.style.backgroundColor = baseColor;
            card.style.setProperty('--theme-color', baseColor);
            
            const wrapper = document.createElement('div');
            wrapper.className = 'skills-wrapper';
            
            gen.skillPool.forEach(s => {
                const skillBox = document.createElement('div');
                
                // MẸO ĐƠN GIẢN: Phân phối API động ngay tại lúc dựng thẻ bài bằng cách ánh xạ tên kỹ năng
                let targetApi = null;
                if (s.name === "Độn Thế") targetApi = '/api/random-three-skills';
                if (s.name === "Bác Lãm") targetApi = '/api/random-baclam-skills';
                
                // Nếu nằm trong danh sách kỹ năng có API bốc bài, biến nó thành ô bấm được
                if (targetApi) {
                    skillBox.className = 'skill-box clickable-donthe';
                    // Gọi hàm gộp trigger3pick1 và truyền chính xác endpoint API vào làm đối số thứ 3
                    skillBox.setAttribute('onclick', `trigger3pick1(this, '${s.name}', '${targetApi}')`);
                } else {
                    skillBox.className = 'skill-box';
                }
                
                skillBox.innerHTML = `<span class="skill-name">【${s.name}】</span>${s.desc}`;
                wrapper.appendChild(skillBox);
            });

            card.innerHTML = `
                <span class="kingdom">${gen.kingdom}</span>
                <h2>${gen.name}</h2>
                <span class="title-tag">Danh hiệu: ${gen.title}</span>
            `;
            card.appendChild(wrapper);
            resultDiv.appendChild(card);
        });
    } catch (error) {
        resultDiv.innerHTML = '<p style="color: #ff4444; font-weight: bold; font-size:13px;">⚠️ Lỗi kết nối máy chủ local!</p>';
    }
}

document.addEventListener('DOMContentLoaded', loadGenerals);