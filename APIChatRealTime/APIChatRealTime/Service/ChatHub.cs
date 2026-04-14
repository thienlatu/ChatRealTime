using Microsoft.AspNetCore.SignalR;

namespace APIChatRealTime.Service
{
    public class ChatHub : Hub
    {
        public async Task JoinRoom(string phongChatId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, phongChatId);
        }

        public async Task LeaveRoom(string phongChatId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, phongChatId);
        }
    }
}
