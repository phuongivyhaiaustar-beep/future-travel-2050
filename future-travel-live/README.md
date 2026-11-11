# FUTURE TRAVEL: MISSION 2050 – Live Quiz

Web app đa thiết bị, giáo viên tạo PIN, tối đa 13 học sinh tham gia cùng lúc, 18 câu hỏi về Future Travel, directions và will. Có chấm điểm dựa trên độ chính xác và tốc độ, bảng xếp hạng real-time, giới hạn 25 giây/câu.

## Chạy thử trên máy
1. Cài Node.js 18+.
2. Trong thư mục dự án, chạy `npm install` rồi `npm start`.
3. Mở http://localhost:3000 trên máy giáo viên.

## Cho điện thoại và máy tính cùng chơi qua Internet
Đưa thư mục này lên GitHub rồi deploy dưới dạng **Web Service** trên Render hoặc nền tảng Node.js có hỗ trợ WebSocket. Build command: `npm install`; start command: `npm start`. Sau khi có URL HTTPS, giáo viên và học sinh mở cùng URL. Giáo viên chọn **Tạo phòng**, học sinh nhập PIN và tên hoặc mở link được sao chép.

## Lưu ý
- Phiên bản này lưu phòng trong RAM. Khi máy chủ khởi động lại, phòng và điểm bị mất.
- Nếu giáo viên đóng tab hoặc mất kết nối, phòng đóng. Không hỗ trợ tự kết nối lại để khôi phục lượt.
- Dùng một tiến trình máy chủ (không scale nhiều instance) vì dữ liệu phòng chưa được chia sẻ qua database.
- Không thu thập thông tin cá nhân ngoài tên hiển thị; nên dùng biệt danh hoặc tên ngắn.
- Tổng thời lượng phụ thuộc thời gian giáo viên chuyển câu. 18 câu × 25 giây = tối đa 7,5 phút trả lời, cộng giới thiệu và chuyển câu, phù hợp tiết ôn 15 phút.
