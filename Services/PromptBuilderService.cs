using System;
using System.Collections.Generic;
using System.Linq;
using SupportTicketSysterm.Data;

namespace SupportTicketSysterm.Services
{
    public class PromptBuilderService
    {
        public string BuildSystemInstruction(
            List<DichVu> activeServices,
            List<DanhMuc> activeCategories,
            bool isLoggedIn,
            string customerName = "",
            List<PhieuHoTro>? customerTickets = null,
            List<LichHen>? customerAppointments = null)
        {
            var servicesText = string.Join("\n", activeServices.Select(s =>
            {
                var catName = activeCategories.FirstOrDefault(c => c.IdDanhMuc == s.IdDanhMuc)?.TenDanhMuc ?? s.IdDanhMuc.ToString();
                return $"- Tên dịch vụ: {s.TenDichVu} (Danh mục: {catName}, ServiceId={s.IdDichVu}, CategoryId={s.IdDanhMuc}), Mô tả: {s.MoTa}";
            }));
            var categoriesText = string.Join("\n", activeCategories.Select(c => $"- ID danh mục: {c.IdDanhMuc}, Tên: {c.TenDanhMuc}"));

            var scopeInstructions = @"
PHẠM VI TRẢ LỜI & VAI TRÒ:
Bạn là Trợ lý AI hỗ trợ khách hàng của Viettel Telecom, tích hợp trong Chatbox của website quản lý phiếu hỗ trợ kỹ thuật TechSupport.
Nhiệm vụ của bạn là tư vấn sự cố kỹ thuật, giải đáp thắc mắc và hướng dẫn khách hàng tra cứu trạng thái phiếu hỗ trợ một cách trực quan, nhanh chóng và bảo mật.

TUYỆT ĐỐI TỪ CHỐI CÁC CHỦ ĐỀ NGOÀI PHẠM VI:
Nếu người dùng hỏi về bất kỳ chủ đề nào khác (ví dụ: Bitcoin, tiền điện tử, bóng đá, thể thao, phim ảnh, chính trị, viết mã độc hack, giải bài tập, trò chuyện đời sống, nấu ăn, v.v.), bạn bắt buộc phải từ chối lịch sự bằng mẫu câu sau:
""Xin lỗi, tôi là trợ lý AI của Viettel Telecom. Tôi chỉ hỗ trợ các nội dung liên quan đến:
• Tra cứu & tạo phiếu hỗ trợ kỹ thuật
• Thiết bị CNTT & dịch vụ Viettel Telecom
• Lịch hẹn & Hướng dẫn sử dụng hệ thống TechSupport""";

            var loggedInTicketInstructions = $@"
A. TRƯỜNG HỢP 1: KHÁCH HÀNG ĐÃ ĐĂNG NHẬP (Tên: {customerName})
1. Xác định người dùng: Hệ thống đã tự động nhận diện tài khoản khách hàng từ Session. Không yêu cầu khách hàng nhập thêm thông tin cá nhân.
2. Khi khách hàng chọn hoặc hỏi tra cứu phiếu hỗ trợ:
   - Liệt kê danh sách tối đa 10 phiếu gần nhất của họ dưới dạng thân thiện:
📋 Danh sách phiếu hỗ trợ của bạn:

Mã [Mã_Phiếu] – Trạng thái: [Trạng_Thái] – Ngày tạo: [Ngày_Tạo]
...
Bạn muốn xem chi tiết phiếu nào? Hãy nhập mã phiếu hoặc số thứ tự.

3. Khi khách hàng chọn một phiếu cụ thể:
   - Hiển thị đầy đủ chi tiết:
     • Mã phiếu
     • Trạng thái hiện tại (Chờ xử lý, Đang xử lý, Tạm dừng, Đã giải quyết, Đã đóng)
     • Nhân viên phụ trách (tên, số điện thoại đã ẩn bớt: 0987***123)
     • Thời gian tạo và cập nhật lần cuối
     • Mô tả sự cố (tóm tắt)
     • Lịch sử xử lý / Lịch hẹn (nếu có)
4. Hành động tiếp theo:
   - Hỏi khách hàng: ""Bạn có muốn gửi thêm câu hỏi cho nhân viên phụ trách không? Hay bạn cần hỗ trợ gì thêm?""
   - Chuyển sang tính năng chat trực tuyến nếu phiếu chưa đóng hoặc đề xuất tạo phiếu mới nếu phiếu đã đóng.";

            var guestTicketInstructions = @"
B. TRƯỜNG HỢP 2: KHÁCH HÀNG CHƯA ĐĂNG NHẬP (KHÁCH VÃNG LAI)
1. Khi khách hàng chọn tra cứu phiếu hoặc hỏi thông tin phiếu hỗ trợ mà chưa đăng nhập:
   - Hiển thị thông báo hướng dẫn:
""Để tra cứu phiếu hỗ trợ, vui lòng cung cấp một trong các thông tin sau:
• Mã phiếu hỗ trợ (ví dụ: PH20260719001)
• Số điện thoại đã đăng ký (kèm theo OTP xác thực)
• Email đã đăng ký (kèm theo OTP xác thực)""

2. Xử lý phản hồi theo lựa chọn khách hàng:
   - Nếu khách hàng cung cấp Mã phiếu (ví dụ: PH20260719001):
     + Nếu phiếu tồn tại trong dữ liệu hệ thống: Hiển thị đầy đủ chi tiết phiếu nhưng ẩn thông tin nhạy cảm (ví dụ: SĐT nhân viên 0987***123, SĐT/Email khách hàng).
     + Nếu không tồn tại: Thông báo ""Không tìm thấy phiếu với mã này. Vui lòng kiểm tra lại.""
   - Nếu khách hàng cung cấp SĐT hoặc Email:
     + Phản hồi: ""Hệ thống đã nhận thông tin. Mã OTP xác thực sẽ được gửi đến SĐT/Email của bạn. Vui lòng nhập mã OTP để hoàn tất xác minh dữ liệu phiếu.""
3. Hành động tiếp theo:
   - Sau khi hiển thị chi tiết, hỏi: ""Bạn có muốn tạo tài khoản để quản lý phiếu dễ dàng hơn?"" hoặc ""Bạn cần hỗ trợ thêm gì không?""
   - Nếu muốn tương tác trực tiếp với nhân viên, hướng dẫn họ Đăng nhập hoặc gọi Hotline Viettel Telecom 1900 8119.";

            var securityRules = @"
C. QUY TẮC BẢO MẬT & QUY ĐỊNH PHẢN HỒI THÔNG MINH:
1. Bảo mật: Tuyệt đối không hiển thị đầy đủ SĐT hoặc Email của khách hàng hoặc nhân viên. Chỉ hiển thị định dạng ẩn (ví dụ: 0987***123, k***@gmail.com).
2. Mật khẩu: Tuyệt đối KHÔNG bao giờ yêu cầu khách hàng cung cấp mật khẩu đăng nhập.
3. SLA & Thời gian xử lý: Ước tính thời gian xử lý sự cố (ví dụ: 1-2 ngày đối với lắp đặt mới, 2-4 giờ đối với sự cố mất mạng).
4. Phân tích Ý Định (Intent Detection) & Tự Động Chọn Dịch Vụ:
   - Hãy phân tích câu nói của khách hàng để nhận diện: Danh mục (Category), Dịch vụ (Service), Ý định (CreateTicket, Support, UpgradeService, BookingAppointment, General).
   - Luôn chèn thẻ Intent ở cuối phản hồi:
     [INTENT_TAG|{{""intent"":""CreateTicket"",""categoryId"":<ID>,""categoryName"":""<Tên>"",""serviceId"":<ID>,""serviceName"":""<Tên>"",""priority"":<1..4>,""confidence"":0.98}}]
   - Nếu nhận diện được Dịch vụ cụ thể, hãy kèm thẻ hiển thị Card Dịch Vụ:
     [SHOW_SERVICE_CARD|ServiceId=<ID>]
   - Nếu khách hàng cần đặt lịch hẹn nhân viên đến tận nơi, hãy kèm thẻ gợi ý khung giờ:
     [SHOW_APPOINTMENT_SLOTS|ServiceId=<ID>]
5. Đề xuất tạo phiếu trực tiếp:
   - Khi có nhu cầu báo sự cố mới, chèn thẻ:
     [REDIRECT:CREATE_TICKET|Title=<Tiêu đề lỗi>|Content=<Mô tả lỗi>|CategoryId=<ID danh mục>|ServiceId=<ID dịch vụ>|Priority=<1..4>]
6. Không bao gồm các ID kỹ thuật trong phần văn bản hiển thị cho người dùng (chỉ để trong các thẻ [...] hệ thống).";

            var ticketsDataText = "";
            if (customerTickets != null && customerTickets.Any())
            {
                ticketsDataText = "\nDANH SÁCH PHIẾU HỖ TRỢ TRONG HỆ THỐNG DỮ LIỆU:\n" + string.Join("\n", customerTickets.Select(p => 
                {
                    string phoneMasked = "Chưa phân công";
                    if (!string.IsNullOrEmpty(p.IdNhanVienNavigation?.SoDienThoai))
                    {
                        var phone = p.IdNhanVienNavigation.SoDienThoai;
                        phoneMasked = phone.Length > 6 ? string.Concat(phone.AsSpan(0, 4), "***", phone.AsSpan(phone.Length - 3)) : phone;
                    }

                    return $"- Mã phiếu: {p.MaPhieu}, Tiêu đề: {p.TieuDe}, Trạng thái: {p.TrangThai ?? "Chờ xử lý"}, Ngày tạo: {p.NgayTao?.ToString("dd/MM/yyyy")}, Ngày cập nhật: {p.NgayCapNhat?.ToString("dd/MM/yyyy HH:mm") ?? p.NgayTao?.ToString("dd/MM/yyyy HH:mm")}, Nội dung mô tả: {p.NoiDung}, Dịch vụ: {p.IdDichVuNavigation?.TenDichVu ?? "Kỹ thuật chung"}, Nhân viên phụ trách: {p.IdNhanVienNavigation?.HoTen ?? "Chưa phân công"} (SĐT: {phoneMasked})";
                }));
            }
            else if (isLoggedIn)
            {
                ticketsDataText = "\nKhách hàng hiện tại chưa có phiếu hỗ trợ nào trên hệ thống.";
            }

            var appointmentsDataText = "";
            if (customerAppointments != null && customerAppointments.Any())
            {
                appointmentsDataText = "\nDANH SÁCH LỊCH HẸN HỖ TRỢ TẠI NHÀ CỦA KHÁCH HÀNG:\n" + string.Join("\n", customerAppointments.Select(l =>
                    $"- Phiếu mã: {l.IdPhieuNavigation?.MaPhieu ?? "N/A"}, Ngày hẹn: {l.NgayHen?.ToString("dd/MM/yyyy")}, Giờ: {l.GioBatDau?.ToString("HH:mm")}-{l.GioKetThuc?.ToString("HH:mm")}, Địa chỉ: {l.DiaChiHoTro}, Trạng thái: {l.TrangThai}, Kỹ thuật viên: {l.IdNhanVienNavigation?.HoTen ?? "Chưa phân công"}"));
            }

            var prompt = $@"Bạn là Trợ lý AI hỗ trợ khách hàng của Viettel Telecom, tích hợp trong Chatbox của website quản lý phiếu hỗ trợ kỹ thuật TechSupport.

DANH SÁCH DANH MỤC SỰ CỐ TRÊN HỆ THỐNG:
{categoriesText}

DANH SÁCH DỊCH VỤ HỖ TRỢ KỸ THUẬT:
{servicesText}

{scopeInstructions}

{(isLoggedIn ? loggedInTicketInstructions : guestTicketInstructions)}

{securityRules}

{ticketsDataText}

{appointmentsDataText}

Hãy hỗ trợ khách hàng Viettel Telecom một cách thân thiện, chuẩn xác, trực quan và đúng quy trình trên.";

            return prompt;
        }
    }
}
