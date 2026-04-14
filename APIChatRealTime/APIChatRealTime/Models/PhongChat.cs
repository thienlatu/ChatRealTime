using System;
using System.Collections.Generic;

namespace APIChatRealTime.Models;

public partial class PhongChat
{
    public Guid Id { get; set; }

    public string? TenPhong { get; set; }

    public bool? LaNhom { get; set; }

    public Guid? NguoiTaoId { get; set; }

    public Guid? TinNhanCuoiId { get; set; }

    public DateTime? NgayCapNhat { get; set; }

    public virtual NguoiDung? NguoiTao { get; set; }

    public virtual ICollection<ThanhVien> ThanhViens { get; set; } = new List<ThanhVien>();

    public virtual ICollection<TinNhan> TinNhans { get; set; } = new List<TinNhan>();
}
