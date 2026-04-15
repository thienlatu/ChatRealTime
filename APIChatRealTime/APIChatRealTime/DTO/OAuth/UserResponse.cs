namespace APIChatRealTime.DTO.OAuth
{
    public class UserResponse
    {
        public Guid Id { get; set; }
        public string Ten { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? AnhDaiDien { get; set; }
        public bool? DangOnline { get; set; }
        public DateTime? LanCuoiOnline { get; set; }
    }
}
