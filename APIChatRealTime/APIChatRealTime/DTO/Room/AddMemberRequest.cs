namespace APIChatRealTime.DTO.Room
{
    public class AddMemberRequest
    {
        public Guid PhongChatId { get; set; }
        public List<Guid> DanhSachNguoiDungId { get; set; } = new();
    }
}
