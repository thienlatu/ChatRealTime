namespace APIChatRealTime.DTO.OAuth
{
    public class ProfileRequest
    {
        public Guid Id { get; set; }
        public string Ten { get; set; } = null!;
        public string? AnhDaiDien { get; set; }
    }
}
