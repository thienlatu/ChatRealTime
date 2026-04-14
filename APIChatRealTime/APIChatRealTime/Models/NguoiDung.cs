using System;
using System.Collections.Generic;

namespace APIChatRealTime.Models;

public partial class NguoiDung
{
    public Guid Id { get; set; }

    public string Ten { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string MatKhau { get; set; } = null!;

    public string? AnhDaiDien { get; set; }

    public bool? DangOnline { get; set; }

    public DateTime? LanCuoiOnline { get; set; }

    public bool? TrangThai { get; set; }

    public virtual ICollection<PhongChat> PhongChats { get; set; } = new List<PhongChat>();

    public virtual ICollection<ThanhVien> ThanhViens { get; set; } = new List<ThanhVien>();

    public virtual ICollection<TinNhan> TinNhans { get; set; } = new List<TinNhan>();
}
