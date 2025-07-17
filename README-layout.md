# Robot Dashboard - 2 Column Layout

## 🎯 Tổng quan

Layout mới được thiết kế với **2 bên riêng biệt**, mỗi bên có tối đa **8 robots** với khoảng cách rõ ràng để phân biệt giữa các production lines.

## 📁 Files đã tạo

1. **`styles.css`** - CSS với layout 2 cột responsive
2. **`index.html`** - HTML template với cấu trúc mới
3. **`script-2column.js`** - JavaScript hỗ trợ 2-column layout
4. **`script.js`** - JavaScript gốc đã sửa lỗi (single column)

## 🏗️ Cấu trúc Layout

```
┌─────────────────────────────────────────┐
│              ROBOT DASHBOARD             │
├──────────────────┬──────────────────────┤
│  Production      │      Production      │
│    Line A        │        Line B        │
│                  │                      │
│  🤖 🤖 🤖 🤖    │    🤖 🤖 🤖 🤖      │
│  🤖 🤖 🤖 🤖    │    🤖 🤖 🤖 🤖      │
│   (tối đa 8)     │     (tối đa 8)       │
└──────────────────┴──────────────────────┘
```

## ⚙️ Cấu hình

### Layout Configuration (trong `script-2column.js`):

```javascript
const LAYOUT_CONFIG = {
    leftSide: {
        maxRobots: 8,
        gridId: 'robotGridLeft',
        startIP: '192.168.33.1',    // IP từ 1-8
        label: 'Production Line A'
    },
    rightSide: {
        maxRobots: 8,
        gridId: 'robotGridRight', 
        startIP: '192.168.33.9',    // IP từ 9-16
        label: 'Production Line B'
    }
};
```

## 🚀 Cách sử dụng

### 1. HTML Structure
```html
<div class="robot-container">
    <!-- Bên trái -->
    <div class="robot-side">
        <div class="side-label">🏭 Production Line A</div>
        <div id="robotGridLeft" class="robot-grid"></div>
    </div>
    
    <!-- Separator -->
    <div class="separator"></div>
    
    <!-- Bên phải -->
    <div class="robot-side">
        <div class="side-label">🔧 Production Line B</div>
        <div id="robotGridRight" class="robot-grid"></div>
    </div>
</div>
```

### 2. Quy tắc phân bổ IP

- **Bên trái (Production Line A)**: `192.168.33.1` đến `192.168.33.8`
- **Bên phải (Production Line B)**: `192.168.33.9` đến `192.168.33.16`

### 3. Thêm Robot

Khi nhấn nút **"Thêm Robot"** (➕):
1. Ưu tiên thêm vào **bên trái** trước
2. Nếu bên trái đầy, thêm vào **bên phải**
3. Tối đa **16 robots** tổng cộng (8 + 8)

### 4. Chỉnh sửa Robot

- Robot có thể **tự động chuyển bên** khi đổi IP
- VD: Đổi từ `192.168.33.5` (bên trái) sang `192.168.33.12` (bên phải)

## 📱 Responsive Design

### Desktop (>1200px)
```
[Left Grid: 4x2] | [Right Grid: 4x2]
```

### Tablet (768px-1200px)
```
[Grid: 6 cột]
[Grid: 6 cột]
```

### Mobile (<768px)
```
[Grid: 4 cột]
[Grid: 4 cột]
```

### Very Small (<480px)
```
[Grid: 3 cột]
[Grid: 3 cột]
```

## 🎨 Visual Features

### 1. Side Labels
- **Glass morphism** effect với backdrop blur
- **Gradient borders** 
- **Custom icons** cho từng production line

### 2. Separator Line
- **Animated glow** effect
- **Gradient background**
- Tự động ẩn trên mobile

### 3. Robot Cards
- **3D hover effects**
- **Entrance animations**
- **Status-based coloring**
- **Responsive sizing**

## 🔧 Customization

### Thay đổi số lượng robots tối đa:
```javascript
const LAYOUT_CONFIG = {
    leftSide: { maxRobots: 12 },  // Tăng lên 12
    rightSide: { maxRobots: 12 }
};
```

### Thay đổi IP range:
```javascript
const LAYOUT_CONFIG = {
    leftSide: { startIP: '192.168.1.1' },    // IP mới
    rightSide: { startIP: '192.168.1.21' }
};
```

### Thay đổi grid layout:
```css
.robot-grid {
    grid-template-columns: repeat(5, 1fr); /* 5 cột thay vì 4 */
}
```

## 🎯 Ưu điểm

1. **Tổ chức rõ ràng** - Phân biệt 2 production lines
2. **Scalable** - Dễ dàng thêm robots
3. **Responsive** - Hoạt động tốt trên mọi thiết bị
4. **Visual feedback** - Animations và effects đẹp mắt
5. **Backward compatible** - Hỗ trợ cả layout cũ và mới

## 📦 File cần sử dụng

### Cho layout 2 cột:
- `index.html`
- `styles.css` 
- `script-2column.js`

### Cho layout đơn cột (cũ):
- HTML file của bạn
- `styles.css`
- `script.js`

## 🔄 Migration từ layout cũ

JavaScript sẽ **tự động detect** format layout:
- **Array format** (cũ): `["192.168.33.1", "192.168.33.2"]`
- **Object format** (mới): `{ left: [...], right: [...] }`

Không cần thay đổi server-side code!

---

## 💡 Tips

1. **Keyboard shortcuts**:
   - `Ctrl + A`: Thêm robots
   - `Ctrl + L`: Toggle debug log

2. **Hover effects**: Di chuột lên robot cards để xem 3D effects

3. **Status colors**: 
   - 🟢 Running (Green)
   - 🟡 Wait_WK (Yellow)  
   - 🔴 Error (Red)
   - ⚫ Unknown (Gray)

4. **Notifications**: Tự động hiển thị kết quả các thao tác