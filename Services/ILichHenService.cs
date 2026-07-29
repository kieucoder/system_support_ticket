using System.Collections.Generic;
using System.Threading.Tasks;
using SupportTicketSysterm.Data;
using SupportTicketSysterm.Models;

namespace SupportTicketSysterm.Services;

/// <summary>
/// Interface Quản lý Nghiệp vụ Lịch Hẹn theo đúng quy trình Help Desk và Phân Quyền RBAC
/// </summary>
public interface ILichHenService
{
    /// <summary>
    /// Kiểm tra người dùng hiện tại có quyền xem/truy cập lịch hẹn này không
    /// </summary>
    Task<bool> CanUserAccessAppointmentAsync(int idLichHen, int currentUserId, string currentUserRole);

    /// <summary>
    /// Kiểm tra người dùng hiện tại có quyền chỉnh sửa/hủy/hoàn thành lịch hẹn này không
    /// </summary>
    Task<bool> CanUserModifyAppointmentAsync(int idLichHen, int currentUserId, string currentUserRole);

    /// <summary>
    /// Khách hàng gửi yêu cầu lịch hẹn mới (Tạo lịch với trạng thái Chờ xác nhận)
    /// </summary>
    Task<LichHen> CreateAppointmentRequestAsync(CreateLichHenRequestDto dto, int idKhachHang);

    /// <summary>
    /// Admin/KTV Phân công nhân viên & Xác nhận lịch hẹn (Có kiểm tra quyền RBAC)
    /// </summary>
    Task<LichHen> AssignAndConfirmAppointmentAsync(AssignLichHenDto dto, int currentUserId, string currentUserRole);

    /// <summary>
    /// Đổi lịch hẹn (Có kiểm tra quyền RBAC)
    /// </summary>
    Task<LichHen> RescheduleAppointmentAsync(RescheduleLichHenDto dto, int currentUserId, string currentUserRole);

    /// <summary>
    /// Hủy lịch hẹn (Có kiểm tra quyền RBAC)
    /// </summary>
    Task<LichHen> CancelAppointmentAsync(CancelLichHenDto dto, int currentUserId, string currentUserRole);

    /// <summary>
    /// KTV/Staff Bắt đầu hỗ trợ (Chuyển trạng thái sang Đang thực hiện) (Có kiểm tra RBAC)
    /// </summary>
    Task<LichHen> StartSupportAppointmentAsync(int idLichHen, int currentUserId, string currentUserRole);

    /// <summary>
    /// Hoàn thành lịch hẹn (Có kiểm tra quyền RBAC & cập nhật ghi chú kết quả hỗ trợ)
    /// </summary>
    Task<LichHen> CompleteAppointmentAsync(int idLichHen, int currentUserId, string currentUserRole, string? ghiChuKetQua = null);

    /// <summary>
    /// Lấy chi tiết lịch hẹn theo ID dành cho người dùng hiện tại (Kiểm tra 403 Forbidden nếu không có quyền)
    /// </summary>
    Task<LichHen?> GetByIdForUserAsync(int idLichHen, int currentUserId, string currentUserRole);

    /// <summary>
    /// Lấy chi tiết lịch hẹn theo ID (dùng nội bộ)
    /// </summary>
    Task<LichHen?> GetByIdAsync(int idLichHen);

    /// <summary>
    /// Lấy danh sách lịch hẹn của Khách hàng
    /// </summary>
    Task<List<LichHen>> GetCustomerAppointmentsAsync(int idKhachHang);

    /// <summary>
    /// Lấy danh sách lịch hẹn phân công cho KTV theo ID nhân viên
    /// </summary>
    Task<List<LichHen>> GetStaffAppointmentsAsync(int idNhanVien);

    /// <summary>
    /// Lấy danh sách lịch hẹn theo phân quyền người dùng (RBAC):
    /// - Admin: Xem toàn bộ lịch hẹn
    /// - Nhân viên: Chỉ xem lịch hẹn do chính mình xử lý (IdNhanVien == currentUserId)
    /// </summary>
    Task<List<LichHen>> GetAppointmentsForUserAsync(int currentUserId, string currentUserRole, LichHenFilterDto? filter = null);

    /// <summary>
    /// Lấy toàn bộ danh sách phiếu hỗ trợ đủ điều kiện tạo lịch hẹn của Khách hàng
    /// </summary>
    Task<List<PhieuHoTro>> GetEligibleTicketsForCustomerAsync(int idKhachHang);

    /// <summary>
    /// Lấy toàn bộ danh sách lịch hẹn (cho Admin) có bộ lọc
    /// </summary>
    Task<List<LichHen>> GetAllAppointmentsAsync(LichHenFilterDto? filter = null);

    /// <summary>
    /// Xuất danh sách lịch hẹn ra file Excel (.xlsx) theo bộ lọc
    /// </summary>
    Task<byte[]> ExportExcelAsync(SupportTicketSysterm.ViewModels.AdminLichHenFilterInput filter);
}
