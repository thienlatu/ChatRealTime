using APIChatRealTime.Models;
using Microsoft.EntityFrameworkCore;

namespace APIChatRealTime
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // 🔥 1. Add services trước khi build
            builder.Services.AddDbContext<ChatRealTimeContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();
            builder.Services.AddSignalR();

            // ✅ FIX: AddCors phải đặt ở đây
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAll", policy =>
                {
                    policy.SetIsOriginAllowed(_ => true)
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials();
                });
            });

            var app = builder.Build();

            // 🔥 2. Middleware pipeline
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseRouting();

            app.UseCors("AllowAll"); // phải nằm sau UseRouting

            app.UseHttpsRedirection();
            app.UseAuthorization();

            // 🔥 3. Map endpoint
            app.MapHub<Service.ChatHub>("/chathub");
            app.MapControllers();

            app.Run();
        }
    }
}