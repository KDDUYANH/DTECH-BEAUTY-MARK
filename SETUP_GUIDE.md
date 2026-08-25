# D-TECH BEAUTY VISION — HƯỚNG DẪN THIẾT LẬP & CÀI ĐẶT TRÊN MÁY MỚI
(NEW MACHINE SETUP & INSTALLATION PROTOCOL)

Tài liệu này hướng dẫn chi tiết quy trình cài đặt ứng dụng trên máy mới cho hai đối tượng:
1. **Máy trạm vận hành (Production Client)**: Máy tính tại các quầy dịch vụ/spa (yêu cầu vận hành offline 100%, không cần cài đặt Node.js/Python).
2. **Máy lập trình (Developer Machine)**: Dành cho lập trình viên cần phát triển, cập nhật và rebuild mã nguồn.

---

## 💻 PHẦN 1: CÀI ĐẶT TRÊN MÁY VẬN HÀNH (PRODUCTION CLIENT)
*Quy trình tinh gọn, không yêu cầu kết nối Internet, không cần cài đặt môi trường lập trình.*

### 🛠️ Yêu cầu hệ thống tối thiểu:
- **Hệ điều hành**: Windows 10 / 11 (64-bit).
- **Phần cứng**: Có Camera/Webcam tích hợp hoặc webcam ngoài cổng USB.
- **Môi trường**: 100% Offline (Không yêu cầu internet, không cần cài Node.js, Python hay các thư viện AI ngoài).

### 📦 Quy trình cài đặt (3 bước):
1. **Sao chép bộ cài đặt**: 
   - Copy file bộ cài `D-Tech Beauty Vision Setup 0.1.0.exe` (nằm trong thư mục `release/` sau khi build) vào máy trạm bằng USB hoặc ổ cứng di động.
2. **Chạy trình cài đặt**:
   - Double-click vào file `D-Tech Beauty Vision Setup 0.1.0.exe`.
   - Hệ thống sẽ tự động giải nén, cài đặt ứng dụng và tạo biểu tượng shortcut **D-Tech Beauty Vision** trên Desktop.
3. **Vận hành**:
   - Mở ứng dụng từ Desktop.
   - Cấp quyền truy cập Camera khi được yêu cầu.
   - Ứng dụng sẽ tự động chạy kiểm tra kiểm định mô hình nội bộ (`MODEL_MANIFEST.json` & `/models/face_landmarker.task`) và hoạt động độc lập hoàn toàn.

---

## 🛠️ PHẦN 2: THIẾT LẬP TRÊN MÁY LẬP TRÌNH (DEVELOPER MACHINE)
*Dành cho lập trình viên thiết lập môi trường để phát triển mã nguồn.*

### 📋 Yêu cầu chuẩn bị:
1. **Node.js**: Phiên bản LTS v18 trở lên.
2. **Git** (nếu cần quản lý mã nguồn).
3. **Mã nguồn dự án**: Copy hoặc Clone thư mục dự án `DTECH BEAUTY MARK` vào ổ cứng máy mới.

### ⚙️ Quy trình thiết lập môi trường (5 bước):

#### Bước 1: Cài đặt Node Modules
Mở Terminal (Command Prompt hoặc PowerShell) tại thư mục dự án và chạy lệnh:
```bash
npm install
```

#### Bước 2: Kiểm tra cấu trúc tài nguyên Offline AI
Đảm bảo các file mô hình cục bộ và thư viện WebAssembly đã nằm đúng vị trí trong thư mục `public/`:
- **Model file**: `public/models/face_landmarker.task` (File mô hình trích xuất khuôn mặt cục bộ).
- **WebAssembly Binaries**: Các file WASM trong thư mục `public/wasm/`.
- **Model Manifest**: `public/MODEL_MANIFEST.json` (Chứa mã hash SHA-256 để xác thực an toàn).

#### Bước 3: Chạy ứng dụng ở chế độ phát triển (Development Mode)
Khởi chạy server lập trình cục bộ:
```bash
npm run dev
```
*Truy cập địa chỉ `http://localhost:5173` trên trình duyệt để kiểm tra.*

#### Bước 4: Chạy thử chế độ Desktop (Electron Mode)
Để chạy thử ứng dụng dưới dạng cửa sổ Desktop app:
```bash
npm run electron
```

#### Bước 5: Đóng gói sản phẩm (Build & Pack Installer)
Chúng tôi đã tích hợp sẵn tập lệnh đóng gói tự động chỉ với 1 click. Bạn chỉ cần chạy file:
- 👉 **[`build_and_release.bat`](file:///d:/DTECH%20BEAYTY%20MARK/build_and_release.bat)** (Double-click để tự động dọn dẹp bộ nhớ đệm, chạy kiểm tra unit test, quét an ninh bảo mật và đóng gói ra file cài đặt `.exe` hoàn chỉnh tại thư mục `release/`).

Hoặc chạy lệnh thủ công:
```bash
npm run dist
```

---

## 🔒 XÁC MINH AN TOÀN & BẢO MẬT (SECURITY AUDIT)
Trước khi đóng gói, bạn nên chạy quét mã nguồn bằng công cụ kiểm định an ninh cục bộ:
```bash
npm run security:audit
```
*Báo cáo kết quả kiểm định sẽ được lưu tự động tại `release/SECURITY_AUDIT_REPORT.txt` để đảm bảo ứng dụng không chứa mã rò rỉ dữ liệu hoặc kết nối đám mây trái phép.*
