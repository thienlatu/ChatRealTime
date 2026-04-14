namespace APIChatRealTime.DTO
{
    public class UpdateProfileDto
    {
        public Guid UserId { get; set; }
        public string Ten { get; set; } = null!;
    }

    // DTO đổi mật khẩu
    public class DoiMatKhauDto
    {
        public Guid UserId { get; set; }
        public string MatKhauCu { get; set; } = null!;
        public string MatKhauMoi { get; set; } = null!;
    }
}
