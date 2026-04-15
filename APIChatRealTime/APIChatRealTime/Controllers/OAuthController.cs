using Microsoft.AspNetCore.Mvc;
using APIChatRealTime.DTO.OAuth;
using APIChatRealTime.Models;
using Microsoft.EntityFrameworkCore;

namespace APIChatRealTime.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OAuthController : ControllerBase
    {
        private readonly ChatRealTimeContext _context;

        public OAuthController(ChatRealTimeContext context)
        {
            _context = context;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterRequest request)
        {
            if (await _context.NguoiDungs.AnyAsync(u => u.Email == request.Email))
                return BadRequest("Email đã tồn tại.");

            var user = new NguoiDung
            {
                Id = Guid.NewGuid(),
                Ten = request.Ten,
                Email = request.Email,
                MatKhau = request.MatKhau, // Hash mật khẩu
     
                DangOnline = false
            };

            _context.NguoiDungs.Add(user);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đăng ký thành công" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _context.NguoiDungs
                .FirstOrDefaultAsync(u => u.Email == request.Email && u.MatKhau == request.MatKhau);

            if (user == null) return Unauthorized(new { Message = "Sai email hoặc mật khẩu." });

            // --- BỔ SUNG: Cập nhật trạng thái vào Database ---
            user.DangOnline = true;
            user.LanCuoiOnline = DateTime.Now; // Lưu thời điểm đăng nhập mới nhất

            await _context.SaveChangesAsync();
            // ------------------------------------------------

            var response = new UserResponse
            {
                Id = user.Id,
                Ten = user.Ten,
                Email = user.Email,
                AnhDaiDien = user.AnhDaiDien,
                DangOnline = true, // Lúc này DB và Response đã khớp nhau
                LanCuoiOnline = user.LanCuoiOnline
            };

            return Ok(response);
        }

        [HttpPut("update-profile")]
        public async Task<IActionResult> UpdateProfile(ProfileRequest request)
        {
            var user = await _context.NguoiDungs.FindAsync(request.Id);
            if (user == null) return NotFound();

            user.Ten = request.Ten;
            user.AnhDaiDien = request.AnhDaiDien;

            await _context.SaveChangesAsync();
            return Ok(user);
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

            [HttpPost("users-by-ids")]
        public async Task<IActionResult> UsersByIds([FromBody] UsersByIdsRequest body)
        {
            if (body.UserIds == null || body.UserIds.Count == 0)
                return Ok(Array.Empty<object>());

            var ids = body.UserIds.Where(s => Guid.TryParse(s, out _)).Select(Guid.Parse).ToList();
            if (ids.Count == 0)
                return Ok(Array.Empty<object>());

            var users = await _context.NguoiDungs
                .AsNoTracking()
                .Where(u => ids.Contains(u.Id))
                .Select(u => new { u.Id, u.Ten, AnhDaiDien = u.AnhDaiDien ?? "" })
                .ToListAsync();

            return Ok(users);
        }
    }
}