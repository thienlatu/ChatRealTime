using Microsoft.AspNetCore.SignalR;

namespace APIChatRealTime.Service
{
    public class ChatHub : Hub
    {
        public async Task JoinRoom(string roomId)
        {
            if (string.IsNullOrWhiteSpace(roomId)) return;
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
        }

        public async Task LeaveRoom(string roomId)
        {
            if (string.IsNullOrWhiteSpace(roomId)) return;
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);
        }
    }
}
