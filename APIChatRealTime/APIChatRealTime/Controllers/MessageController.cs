using APIChatRealTime.DTO.Chat;
using APIChatRealTime.DTO.OAuth;
using APIChatRealTime.DTO.Room;
using APIChatRealTime.Models;
using APIChatRealTime.Service;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace APIChatRealTime.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MessageController : ControllerBase
    {
        private readonly ChatRealTimeContext _context;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly ILogger<MessageController> _logger;

        public MessageController(ChatRealTimeContext context, IHubContext<ChatHub> hubContext, ILogger<MessageController> logger)
        {
            _context = context;
            _hubContext = hubContext;
            _logger = logger;
        }

        /// <summary>Danh sách phòng (inbox) — cùng shape cũ cho app RN.</summary>
        [HttpGet("inbox/{nguoiDungId:guid}")]
        public async Task<IActionResult> GetInbox(Guid nguoiDungId)
        {
            var inboxes = await _context.PhongChats
                .AsNoTracking()
                .Where(p => p.ThanhViens.Any(tv => tv.NguoiDungId == nguoiDungId))
                .OrderByDescending(p => p.NgayCapNhat)
                .Select(p => new
                {
                    Id = p.Id,
                    Name = p.LaNhom == true
                        ? (p.TenPhong ?? "Nhóm Chat")
                        : p.ThanhViens.Where(tv => tv.NguoiDungId != nguoiDungId).Select(tv => tv.NguoiDung.Ten).FirstOrDefault() ?? "Người dùng",
                    Avatar = p.LaNhom == true
                        ? "https://ui-avatars.com/api/?name=Group&background=D4AF37&color=fff"
                        : p.ThanhViens.Where(tv => tv.NguoiDungId != nguoiDungId).Select(tv => tv.NguoiDung.AnhDaiDien).FirstOrDefault() ?? "https://ui-avatars.com/api/?name=U",
                    LastMessage = p.TinNhanCuoiId != null
                        ? _context.TinNhans.Where(t => t.Id == p.TinNhanCuoiId).Select(t => t.NoiDung).FirstOrDefault()
                        : "Bắt đầu cuộc trò chuyện...",
                    Time = p.NgayCapNhat != null ? p.NgayCapNhat.Value.ToString("HH:mm") : "",
                    Unread = 0,
                    LaNhom = p.LaNhom == true
                }).ToListAsync();

            return Ok(inboxes);
        }

        // 1. Lấy tất cả tin nhắn của một phòng chat
        [HttpGet("all/{roomId}")]
        public async Task<IActionResult> GetAllMessages(Guid roomId)
        {
            try
            {
                _logger.LogInformation("Đang lấy tin nhắn cho phòng: {roomId}", roomId);

                var messages = await _context.TinNhans
                    .Where(m => m.PhongChatId == roomId)
                    .OrderByDescending(m => m.NgayTao)
                    .Select(m => new ChatResponse
                    {
                        Id = m.Id,
                        PhongChatId = m.PhongChatId,
                        NguoiGuiId = m.NguoiGuiId,
                        TenNguoiGui = m.NguoiGui.Ten,
                        AnhDaiDien = m.NguoiGui.AnhDaiDien ?? "",
                        LoaiTinNhan = m.LoaiTinNhan,
                        NoiDung = m.NoiDung,
                        NgayTao = m.NgayTao
                    }).ToListAsync();

                return Ok(new { Message = "Lấy tất cả tin nhắn thành công!", Data = messages });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy tin nhắn của phòng: {roomId}", roomId);
                return StatusCode(500, new { Message = "Lỗi máy chủ nội bộ khi lấy tin nhắn" });
            }
        }

        // 2. Lấy chi tiết 1 tin nhắn
        [HttpGet("{id}")]
        public async Task<IActionResult> GetMessages(Guid id)
        {
            try
            {
                var msg = await _context.TinNhans
                    .Where(m => m.Id == id)
                    .Select(m => new ChatResponse
                    {
                        Id = m.Id,
                        NoiDung = m.NoiDung,
                        NgayTao = m.NgayTao,
                        LoaiTinNhan = m.LoaiTinNhan
                    }).FirstOrDefaultAsync();

                if (msg == null) return NotFound(new { Message = "Không tìm thấy tin nhắn" });

                return Ok(new { Message = "Lấy tin nhắn thành công!", Data = msg });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy chi tiết tin nhắn: {id}", id);
                return StatusCode(500, new { Message = "Lỗi hệ thống" });
            }
        }

        // 3. Gửi tin nhắn (Lưu DB + Realtime)
        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] ChatRequest chatRequest)
        {
            if (chatRequest == null || string.IsNullOrEmpty(chatRequest.NoiDung))
                return BadRequest(new { Message = "Dữ liệu không hợp lệ" });

            try
            {
                var tinNhan = new TinNhan
                {
                    Id = Guid.NewGuid(),
                    PhongChatId = chatRequest.PhongChatId,
                    NguoiGuiId = chatRequest.NguoiGuiId,
                    LoaiTinNhan = chatRequest.LoaiTinNhan,
                    NoiDung = chatRequest.NoiDung,
                    NgayTao = DateTime.UtcNow.AddHours(7)
                };

                _context.TinNhans.Add(tinNhan);

                // Cập nhật TinNhanCuoiId và NgayCapNhat cho PhongChat (Theo ERD m vẽ)
                var phong = await _context.PhongChats.FindAsync(chatRequest.PhongChatId);
                if (phong != null)
                {
                    phong.TinNhanCuoiId = tinNhan.Id;
                    phong.NgayCapNhat = DateTime.UtcNow.AddHours(7);
                }

                await _context.SaveChangesAsync();

                var sender = await _context.NguoiDungs.AsNoTracking()
                    .FirstOrDefaultAsync(u => u.Id == chatRequest.NguoiGuiId);

                var response = new ChatResponse
                {
                    Id = tinNhan.Id,
                    PhongChatId = tinNhan.PhongChatId,
                    NguoiGuiId = tinNhan.NguoiGuiId,
                    TenNguoiGui = sender?.Ten ?? "",
                    AnhDaiDien = sender?.AnhDaiDien ?? "",
                    NoiDung = tinNhan.NoiDung,
                    LoaiTinNhan = tinNhan.LoaiTinNhan,
                    NgayTao = tinNhan.NgayTao
                };

                // Real-time qua SignalR
                await _hubContext.Clients.Group(chatRequest.PhongChatId.ToString())
                    .SendAsync("ReceiveMessage", response);

                return Ok(new { Message = "Tin nhắn đã được gửi!", Data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi gửi tin nhắn");
                return StatusCode(500, new { Message = "Lỗi hệ thống khi gửi tin nhắn" });
            }
        }
        [HttpGet("get-private-room/{partnerId}/{currentUserId}")]
        public async Task<IActionResult> GetPrivateRoom(Guid partnerId, Guid currentUserId)
        {
            try
            {
                var roomId = await _context.PhongChats
                    .Where(p => p.LaNhom == false &&
                                p.ThanhViens.Any(t => t.NguoiDungId == currentUserId) &&
                                p.ThanhViens.Any(t => t.NguoiDungId == partnerId))
                    .Select(p => p.Id)
                    .FirstOrDefaultAsync();

                if (roomId != Guid.Empty)
                {
                    return Ok(new { Message = "Lấy phòng chat 1-1 thành công!", RoomId = roomId });
                }

                // Nếu chưa có thì tạo mới phòng 1-1 chuẩn theo Model của m
                var newRoom = new PhongChat
                {
                    Id = Guid.NewGuid(),
                    TenPhong = null, // Chat 1-1 thường không để tên phòng
                    LaNhom = false,
                    NgayCapNhat = DateTime.UtcNow.AddHours(7),
                    NguoiTaoId = currentUserId
                };

                _context.PhongChats.Add(newRoom);

                // Thêm 2 thành viên vào bảng trung gian
                var members = new List<ThanhVien>
        {
            new ThanhVien { PhongChatId = newRoom.Id, NguoiDungId = currentUserId, NgayThamGia =DateTime.UtcNow.AddHours(7) },
            new ThanhVien { PhongChatId = newRoom.Id, NguoiDungId = partnerId, NgayThamGia = DateTime.UtcNow.AddHours(7) }
        };

                _context.ThanhViens.AddRange(members);
                await _context.SaveChangesAsync();

                return Ok(new { Message = "Đã tạo phòng chat 1-1 mới!", RoomId = newRoom.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xử lý phòng chat 1-1");
                return StatusCode(500, new { Message = "Lỗi hệ thống chat 1-1" });
            }
        }
        // 4. Tạo phòng chat chuẩn theo Model image_7e2c26 và Request image_7e2c45
        [HttpPost("create-room")]
        public async Task<IActionResult> createRoom([FromBody] CreateRoomRequest createRoomRequest)
        {
            try
            {
                if (createRoomRequest.MemberIds == null || createRoomRequest.MemberIds.Count == 0)
                    return BadRequest(new { Message = "Danh sách thành viên không được để trống" });

                var phongMoi = new PhongChat
                {
                    Id = Guid.NewGuid(),
                    TenPhong = createRoomRequest.TenPhong,
                    LaNhom = createRoomRequest.LaNhom,
                    NgayCapNhat = DateTime.UtcNow.AddHours(7),
                    // Lấy ID người đầu tiên làm người tạo nếu m chưa có logic lấy CurrentUser
                    NguoiTaoId = createRoomRequest.MemberIds.FirstOrDefault()
                };

                _context.PhongChats.Add(phongMoi);

                // Thêm thành viên vào bảng ThanhVien (Cột NgayThamGia theo ERD)
                foreach (var userId in createRoomRequest.MemberIds)
                {
                    _context.ThanhViens.Add(new ThanhVien
                    {
                        PhongChatId = phongMoi.Id,
                        NguoiDungId = userId,
                        NgayThamGia = DateTime.UtcNow.AddHours(7)
                    });
                }

                await _context.SaveChangesAsync();
                return Ok(new { Message = "Phòng chat đã được tạo!", RoomId = phongMoi.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tạo phòng");
                return StatusCode(500, new { Message = "Lỗi hệ thống khi tạo phòng" });
            }
        }

        // 5. Thêm người vào phòng
        [HttpPost("add-user")]
        public async Task<IActionResult> addUserToRoom([FromBody] AddMemberRequest addUserToRoomRequest)
        {
            try
            {
                foreach (var userId in addUserToRoomRequest.DanhSachNguoiDungId)
                {
                    var daTonTai = await _context.ThanhViens
                        .AnyAsync(tv => tv.PhongChatId == addUserToRoomRequest.PhongChatId && tv.NguoiDungId == userId);

                    if (!daTonTai)
                    {
                        _context.ThanhViens.Add(new ThanhVien
                        {
                            PhongChatId = addUserToRoomRequest.PhongChatId,
                            NguoiDungId = userId,
                            NgayThamGia = DateTime.UtcNow.AddHours(7) 
                        });
                    }
                }

                await _context.SaveChangesAsync();
                return Ok(new { Message = "Người dùng đã được thêm vào phòng chat!" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi thêm thành viên");
                return StatusCode(500, new { Message = "Lỗi hệ thống" });
            }
        }
  
        [HttpGet("search-users")]
        public async Task<IActionResult> SearchUsers([FromQuery] string? tuKhoa, [FromQuery] Guid nguoiGoiId)
        {
            // 1. Lấy danh sách mặc định (loại trừ bản thân)
            var query = _context.NguoiDungs
                .AsNoTracking()
                .Where(u => u.Id != nguoiGoiId && (u.TrangThai == null || u.TrangThai == true));

            // 2. NẾU CÓ GÕ CHỮ THÌ MỚI LỌC. (Tuyệt đối không return rỗng nếu chưa gõ chữ)
            if (!string.IsNullOrWhiteSpace(tuKhoa))
            {
                query = query.Where(u => u.Ten.Contains(tuKhoa) || u.Email.Contains(tuKhoa));
            }

            // 3. Trả về tối đa 20 người để hiển thị ngay khi vừa mở màn hình Tạo Nhóm
            var users = await query.Take(20)
                .Select(u => new UserResponse
                {
                    Id = u.Id,
                    Ten = u.Ten,
                    Email = u.Email,
                    AnhDaiDien = u.AnhDaiDien,
                    DangOnline = u.DangOnline,
                    LanCuoiOnline = u.LanCuoiOnline
                })
                .ToListAsync();

            return Ok(users);
        }
    }
}