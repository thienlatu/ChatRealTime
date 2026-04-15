export interface NguoiDungDto {
  id: string;
  ten: string;
  email: string;
  anhDaiDien: string;
  dangOnline: boolean;
  lanCuoiOnline?: string;
}

export interface TinNhanDto {
  id: string;
  phongChatId: string;
  nguoiGuiId: string;
  tenNguoiGui: string;
  anhDaiDien: string;
  loaiTinNhan: number;
  noiDung: string;
  ngayTao: string;
}

export interface ChatInbox {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar: string;
  dangOnline?: boolean;
  lanCuoiOnline?: string;
  laNhom?: boolean;
}