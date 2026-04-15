namespace APIChatRealTime.DTO.Chat
{
    public class ChatRequest
    {
        public Guid PhongChatId { get; set; }
        public Guid NguoiGuiId { get; set; } // Note: Thực tế cái này nên lấy từ Token thay vì client gửi lên để chống hack
        public byte LoaiTinNhan { get; set; } // BẮT BUỘC PHẢI CÓ: 0 là Text, 1 là Image
        public string NoiDung { get; set; } = null!;
    }
}
