# Ứng dụng Từ điển Tiếng Anh sử dụng Radix Trie

**Báo cáo dự án – Cấu trúc dữ liệu và Giải thuật nâng cao**

---

## 1. Giới thiệu

Dự án xây dựng một ứng dụng từ điển Tiếng Anh sử dụng **Radix Trie** (cây Trie nén, còn gọi là Patricia Trie) làm cấu trúc dữ liệu lập chỉ mục chính. Ứng dụng cho phép người dùng thêm, xóa và tra cứu từ vựng thông qua giao diện web hiện đại, đồng thời trực quan hóa cấu trúc cây trong thời gian thực để minh họa cách Radix Trie hoạt động bên trong.

Mục tiêu của dự án là chuyển hóa kiến thức lý thuyết về cấu trúc dữ liệu thành một hệ thống trực quan, có thể thao tác và có khả năng giải thích — giúp người học hiểu rõ cơ chế nén cạnh (edge compression), tách nút (node split) và gộp nút (node merge) thông qua tương tác thực tế.

---

## 2. Trie và Radix Trie

### 2.1. Trie chuẩn (Standard Trie)

**Trie** (phát âm "try") là cấu trúc cây dùng để lưu trữ chuỗi ký tự. Trong Trie chuẩn, mỗi nút đại diện cho **một ký tự duy nhất**; đường đi từ gốc đến một nút được đánh dấu kết thúc sẽ tạo thành một từ hoàn chỉnh.

Ví dụ: lưu ba từ `"cat"`, `"car"` và `"card"` trong Trie chuẩn:

```
(root)
 └── c
      └── a
           ├── t   ← kết thúc "cat"
           └── r   ← kết thúc "car"
                └── d   ← kết thúc "card"
```

Mỗi ký tự chiếm một nút riêng — đơn giản nhưng lãng phí bộ nhớ khi nhiều từ chia sẻ tiền tố dài.

### 2.2. Radix Trie (Trie nén)

**Radix Trie** cải tiến Trie chuẩn bằng cách **gộp các chuỗi nút đơn con** thành một cạnh duy nhất mang nhãn là **chuỗi con** (substring) thay vì chỉ một ký tự.

Cùng ba từ trên, biểu diễn trong Radix Trie:

```
(root)
 └── ca
      ├── t   [KT] meaning = "a small pet"
      └── r   [KT] meaning = "a vehicle"
           └── d   [KT] meaning = "a piece of paper"
```

Nhận xét:
- Ký tự `c` và `a` được gộp thành cạnh `"ca"` vì `c` chỉ có duy nhất một nút con `a`.
- Số lượng nút và cạnh ít hơn Trie chuẩn → tiết kiệm bộ nhớ.
- Tốc độ tra cứu nhanh hơn vì mỗi bước di chuyển so khớp nhiều ký tự cùng lúc.

---

## 3. Các thao tác trên Radix Trie

### 3.1. Thêm từ (Insert)

Khi thêm một từ mới, thuật toán duyệt cây từ gốc, so khớp từ cần chèn với nhãn các cạnh:

**Trường hợp 1: Không có cạnh nào khớp**
Tạo một cạnh mới mang nhãn là toàn bộ phần còn lại của từ.

```
Trước:  (root)

Sau:    (root)
         └── apple   [KT]
```

**Trường hợp 2: Nhãn cạnh khớp hoàn toàn**
Đi theo cạnh đó và tiếp tục so khớp với phần còn lại của từ.

**Trường hợp 3: Khớp một phần → Tách nút (Node Split)**
Nếu chỉ một phần nhãn cạnh trùng với từ cần chèn, hệ thống sẽ **tách** cạnh hiện tại.

Ví dụ: chèn `"apply"` khi `"apple"` đã tồn tại:

```
Trước:  (root)
         └── apple   [KT]

Sau:    (root)
         └── appl
              ├── e   [KT]  ← "apple"
              └── y   [KT]  ← "apply"
```

Cạnh `"apple"` bị tách thành `"appl"` (tiền tố chung) + `"e"` (phần còn lại). Cạnh mới `"y"` được thêm cho `"apply"`.

### 3.2. Xóa từ (Delete)

Khi xóa một từ:

1. **Tìm nút** tương ứng bằng cách duyệt theo các cạnh.
2. **Bỏ đánh dấu** nút đó không còn là kết thúc từ.
3. **Dọn dẹp** cấu trúc cây:
   - Nếu nút không còn nút con → xóa cạnh dẫn đến nút đó.
   - Nếu sau khi xóa, nút cha chỉ còn đúng một nút con và bản thân nút cha không phải là kết thúc từ → **gộp** (merge) hai cạnh thành một.

Ví dụ gộp nút: xóa `"apple"` khi chỉ còn `"apple"` và `"apply"`:

```
Trước:                          Sau:
(root)                          (root)
 └── appl                       └── apply   [KT]
      ├── e   [KT] "apple"
      └── y   [KT] "apply"
```

Sau khi xóa `"e"`, nút trung gian `"appl"` chỉ còn một con (`"y"`), nên hai cạnh được gộp thành `"apply"`.

### 3.3. Tra cứu từ (Search)

Tra cứu là thao tác **chỉ đọc** — không làm thay đổi cấu trúc cây:

1. Bắt đầu tại nút gốc.
2. Tìm cạnh có nhãn bắt đầu bằng các ký tự đầu tiên của từ cần tra.
3. Nếu nhãn cạnh khớp hoàn toàn, chuyển sang nút con và lặp lại với phần còn lại.
4. Nếu tiêu thụ hết toàn bộ từ và nút hiện tại được đánh dấu là kết thúc từ → **tìm thấy**.
5. Nếu không có cạnh phù hợp hoặc nhãn chỉ khớp một phần → **không tìm thấy**.

---

## 4. Kiến trúc hệ thống

Hệ thống gồm hai tầng chính giao tiếp qua HTTP REST API:

```
┌───────────────────────────┐    HTTP/REST    ┌───────────────────────────┐
│   Frontend (Next.js)      │ ◄────────────► │   Backend (FastAPI)       │
│   React · TypeScript      │                │   ┌───────────────────┐   │
│                           │                │   │    Radix Trie     │   │
│   • Bảng điều khiển       │                │   │   (trong bộ nhớ)  │   │
│   • Trực quan hóa cây     │                │   └────────┬──────────┘   │
│   • Bảng từ vựng          │                │            │              │
│   • Lịch sử thao tác      │                │   ┌────────▼──────────┐   │
│                           │                │   │ dictionary.json   │   │
└───────────────────────────┘                │   └───────────────────┘   │
                                             └───────────────────────────┘
```

| Thành phần  | Công nghệ                                                        |
|-------------|-------------------------------------------------------------------|
| Frontend    | Next.js, TypeScript, Tailwind CSS, React Flow (@xyflow/react)     |
| Backend     | Python 3.11+, FastAPI, Pydantic                                   |
| Cấu trúc DL | Radix Trie (cài đặt thủ công, không dùng thư viện ngoài)         |
| Lưu trữ    | Tệp JSON cục bộ (`backend/data/dictionary.json`)                 |

---

## 5. Chức năng chính

| STT | Chức năng           | Ý nghĩa thực hiện                                                                                           |
|-----|---------------------|--------------------------------------------------------------------------------------------------------------|
| 1   | Thêm từ             | Chèn từ mới vào Radix Trie; nếu tiền tố trùng một phần, hệ thống tự động tách nút và ghi lại sự kiện.      |
| 2   | Xóa từ              | Xóa từ khỏi cây; khi cạnh thừa, hệ thống tự gộp nút để duy trì cấu trúc nén.                              |
| 3   | Tra cứu từ          | Duyệt cây và hiển thị đường đi (traversal path) để người học theo dõi quá trình tra cứu.                    |
| 4   | Trực quan hóa cây   | Hiển thị cấu trúc Radix Trie dạng cây tương tác bằng React Flow, cập nhật theo thời gian thực.             |
| 5   | Lịch sử thao tác    | Ghi lại mọi thao tác kèm kết quả, giải thích cấu trúc và dấu thời gian.                                   |
| 6   | Bảng từ vựng        | Hiển thị toàn bộ từ và nghĩa đã lưu, hỗ trợ lọc nhanh.                                                    |
| 7   | Load demo / Reset   | Nạp dữ liệu mẫu để trình diễn nhanh và khôi phục trạng thái rỗng khi cần.                                 |

---

## 6. Giao diện và quy trình sử dụng

Giao diện chính được tổ chức thành các vùng chức năng rõ ràng:

- **Bên trái**: Bảng điều khiển thao tác (Thêm / Xóa / Tra cứu) dạng tab, kèm nút Load Demo và Reset All.
- **Bên phải – trên**: Vùng trực quan hóa Radix Trie tương tác (pan, zoom, hover tooltip).
- **Bên phải – dưới**: Bảng từ vựng và lịch sử thao tác.

Quy trình thao tác chuẩn:

1. Khởi động backend và frontend (xem Mục 8).
2. Nhấn **Load Demo** để nạp dữ liệu mẫu, hoặc thêm từ thủ công.
3. Thực hiện thao tác thêm / xóa / tra cứu từ bảng điều khiển.
4. Quan sát cấu trúc cây cập nhật tức thì trên vùng trực quan hóa.
5. Kiểm tra kết quả chi tiết tại bảng kết quả thao tác (giải thích tách nút, gộp nút…).
6. Rê chuột vào một dòng trong bảng từ vựng để làm nổi bật đường đi tương ứng trên cây.

---

## 7. Cấu trúc repository

| Khu vực     | Tệp / thư mục tiêu biểu              | Chức năng                                                              |
|-------------|---------------------------------------|------------------------------------------------------------------------|
| Backend     | `backend/app/radix_trie.py`           | Cài đặt thuật toán Radix Trie: insert, delete, search, to_graph.       |
| Backend     | `backend/app/routes.py`               | Khai báo API endpoint cho tất cả thao tác từ điển.                     |
| Backend     | `backend/app/storage.py`              | Đọc và ghi trạng thái hệ thống xuống tệp JSON.                       |
| Backend     | `backend/app/schemas.py`              | Định nghĩa Pydantic schema cho request / response.                    |
| Frontend    | `frontend/src/app/page.tsx`           | Quản lý state tổng, thao tác người dùng và luồng hiển thị chính.      |
| Frontend    | `frontend/src/components/trie/`       | Thành phần trực quan hóa Radix Trie bằng React Flow.                  |
| Frontend    | `frontend/src/components/dictionary/` | Bảng điều khiển, bảng từ vựng, lịch sử thao tác.                      |
| Scripts     | `scripts/dev-all.js`                  | Hỗ trợ chạy đồng thời backend và frontend ở môi trường local.         |
| Kiểm thử   | `backend/tests/`                      | Bao gồm test đơn vị cho Radix Trie (21 test cases).                   |
| Tài liệu   | `User_Guide/`, `README.md`            | Mô tả dự án, cấu trúc repo và tài liệu thuyết minh đi kèm.          |

---

## 8. Hướng dẫn cài đặt và chạy

### 8.1. Yêu cầu

- **Python 3.11+** (kèm pip)
- **Node.js 18+** (kèm npm)

### 8.2. Cài đặt Backend

```bash
cd backend
pip install -r requirements.txt
```

### 8.3. Cài đặt Frontend

```bash
cd frontend
npm install
```

### 8.4. Chạy ứng dụng

**Bước 1 – Khởi động Backend:**
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```
API khả dụng tại `http://localhost:8000`. Tài liệu API tại `http://localhost:8000/docs`.

**Bước 2 – Khởi động Frontend:**
```bash
cd frontend
npm run dev
```
Giao diện web khả dụng tại `http://localhost:3000`.

### 8.5. Chạy kiểm thử

```bash
cd backend
python -m pytest tests/ -v
```

---

## 9. API tóm tắt

| Phương thức | Endpoint             | Mô tả                                  |
|-------------|----------------------|-----------------------------------------|
| `GET`       | `/api/entries`       | Lấy toàn bộ từ vựng                     |
| `GET`       | `/api/trie`          | Lấy cấu trúc cây hiện tại               |
| `POST`      | `/api/words`         | Thêm hoặc cập nhật từ                   |
| `DELETE`    | `/api/words/{word}`  | Xóa một từ                              |
| `GET`       | `/api/search?word=…` | Tra cứu từ                              |
| `GET`       | `/api/history`       | Lấy lịch sử thao tác                    |
| `POST`      | `/api/demo`          | Nạp dữ liệu mẫu                        |
| `POST`      | `/api/reset`         | Xóa toàn bộ dữ liệu và khôi phục rỗng  |

---

## 10. Kiểm thử và xử lý sự cố

### 10.1. Kiểm thử

Dự án bao gồm **21 test cases** cho cấu trúc Radix Trie, bao gồm:
- 7 kiểm thử chèn (insert): từ đơn, từ trùng, tách nút, chia sẻ tiền tố.
- 5 kiểm thử tra cứu (search): từ tồn tại, không tồn tại, đường duyệt.
- 6 kiểm thử xóa (delete): xóa lá, gộp nút, bảo toàn từ còn lại.
- 3 kiểm thử trực quan hóa: cây rỗng, cây văn bản, cấu trúc dữ liệu.

### 10.2. Xử lý sự cố thường gặp

| STT | Tình huống                        | Hướng xử lý                                                                |
|-----|-----------------------------------|-----------------------------------------------------------------------------|
| 1   | Trang không tải được dữ liệu      | Kiểm tra backend đã chạy cùng frontend hay chưa.                          |
| 2   | Không thể thêm từ                 | Kiểm tra các trường bắt buộc có đang để trống hay không.                   |
| 3   | Cây hiển thị chồng chéo           | Thu nhỏ bằng scroll hoặc kéo vùng nhìn để quan sát rõ hơn.                |
| 4   | Lỗi phụ thuộc backend / frontend  | Cài lại: `pip install -r requirements.txt` và `npm install`.               |
| 5   | Xung đột cổng                     | Giải phóng cổng 3000 hoặc 8000, hoặc điều chỉnh cấu hình.                |

---

## 11. Bảng tham khảo nhanh

| Thao tác   | Thay đổi cây? | Điểm cần quan sát                |
|------------|----------------|----------------------------------|
| Thêm       | Có             | Cạnh mới hoặc tách nút           |
| Xóa        | Có             | Xóa cạnh hoặc gộp nút           |
| Tra cứu    | Không          | Chỉ duyệt — không thay đổi cây  |

---

## 12. Kết luận

Dự án **Ứng dụng Từ điển Tiếng Anh sử dụng Radix Trie** minh họa thành công cách cấu trúc dữ liệu nâng cao có thể được ứng dụng trong một hệ thống thực tế. Việc kết hợp giữa cấu trúc dữ liệu hiệu quả (Radix Trie) với kiến trúc full-stack hiện đại (FastAPI + Next.js) tạo ra một công cụ trực quan, có giá trị học thuật — giúp người học không chỉ hiểu lý thuyết mà còn quan sát trực tiếp cơ chế tách nút, gộp nút và nén cạnh thông qua tương tác thực tế.
