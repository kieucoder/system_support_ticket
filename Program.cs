using Microsoft.EntityFrameworkCore;
using SupportTicketSysterm.Data;
using System;
using Microsoft.AspNetCore.Authentication.Cookies;
using SupportTicketSysterm.Models;
using SupportTicketSysterm.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// Đăng ký DbContext
builder.Services.AddDbContext<TechSupportContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("SupportTicketSystem")));

// Đăng ký Twilio Service
builder.Services.AddScoped<ITwilioService, TwilioService>();

// Đăng ký HttpContextAccessor
builder.Services.AddHttpContextAccessor();

// Đăng ký SpeedSMS Service
builder.Services.Configure<SpeedSmsOptions>(builder.Configuration.GetSection("SpeedSMS"));
builder.Services.AddHttpClient<ISmsService, SpeedSmsService>();

// Đăng ký cấu hình EmailSettings Options
builder.Services.Configure<SupportTicketSysterm.Services.EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
builder.Services.AddScoped<SupportTicketSysterm.Services.IEmailService, SupportTicketSysterm.Services.EmailService>();

// Đăng ký OTP Service
builder.Services.AddScoped<IOtpService, OtpService>();
builder.Services.AddScoped<IAuthService, AuthService>();

// Đăng ký Gemini AI Service
builder.Services.AddHttpClient<IGeminiService, GeminiService>();

// Đăng ký Chat Service
builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddScoped<PromptBuilderService>();
builder.Services.AddScoped<ChatHistoryService>();

// Đăng ký Ticket Service
builder.Services.AddScoped<ITicketService, TicketService>();

// Đăng ký Backend Tra Cứu Phiếu AI (Repository Layer, Service Layer, Gemini Helpers)
builder.Services.AddScoped<SupportTicketSysterm.Repositories.Interfaces.ITicketRepository, SupportTicketSysterm.Repositories.Implementations.TicketRepository>();
builder.Services.AddScoped<SupportTicketSysterm.Services.Interfaces.ITicketLookupService, SupportTicketSysterm.Services.Implementations.TicketLookupService>();
builder.Services.AddScoped<SupportTicketSysterm.Services.Interfaces.IAIChatService, SupportTicketSysterm.Services.Implementations.AIChatService>();
builder.Services.AddScoped<SupportTicketSysterm.Gemini.IntentDetector>();
builder.Services.AddScoped<SupportTicketSysterm.Gemini.PromptBuilder>();

// Đăng ký Phản hồi Đánh giá (Repository & Service)
builder.Services.AddScoped<SupportTicketSysterm.Repositories.Interfaces.IDanhGiaRepository, SupportTicketSysterm.Repositories.Implementations.DanhGiaRepository>();
builder.Services.AddScoped<SupportTicketSysterm.Services.IDanhGiaService, SupportTicketSysterm.Services.DanhGiaService>();


// Đăng ký Cookie Authentication
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Auth/DangNhap";
        options.LogoutPath = "/Auth/DangXuat";
        options.AccessDeniedPath = "/Auth/AccessDenied";
        options.Cookie.HttpOnly = true;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Events.OnRedirectToLogin = context =>
        {
            var redirectUri = context.RedirectUri;
            if (!string.IsNullOrEmpty(redirectUri))
            {
                var cleanUri = System.Text.RegularExpressions.Regex.Replace(
                    redirectUri,
                    @"[^\x00-\x7F]",
                    m => Uri.EscapeDataString(m.Value)
                );
                context.Response.Redirect(cleanUri);
                return Task.CompletedTask;
            }
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            var redirectUri = context.RedirectUri;
            if (!string.IsNullOrEmpty(redirectUri))
            {
                var cleanUri = System.Text.RegularExpressions.Regex.Replace(
                    redirectUri,
                    @"[^\x00-\x7F]",
                    m => Uri.EscapeDataString(m.Value)
                );
                context.Response.Redirect(cleanUri);
                return Task.CompletedTask;
            }
            return Task.CompletedTask;
        };
    });

// Đăng ký SignalR
builder.Services.AddSignalR();

// Đăng ký LiveSupport Services và Repositories
builder.Services.AddScoped<SupportTicketSysterm.Repositories.ILiveSupportRepository, SupportTicketSysterm.Repositories.LiveSupportRepository>();
builder.Services.AddScoped<SupportTicketSysterm.Services.ILiveSupportService, SupportTicketSysterm.Services.LiveSupportService>();
builder.Services.AddScoped<SupportTicketSysterm.Services.IDashboardService, SupportTicketSysterm.Services.DashboardService>();
builder.Services.AddScoped<SupportTicketSysterm.Services.IChatPermissionService, SupportTicketSysterm.Services.ChatPermissionService>();
builder.Services.AddScoped<SupportTicketSysterm.Services.ISignalRService, SupportTicketSysterm.Services.SignalRService>();
// Đăng ký Notification Repository và Service
builder.Services.AddScoped<SupportTicketSysterm.Repositories.Interfaces.INotificationRepository, SupportTicketSysterm.Repositories.Implementations.NotificationRepository>();
builder.Services.AddScoped<SupportTicketSysterm.Services.INotificationService, SupportTicketSysterm.Services.NotificationService>();
builder.Services.AddScoped<SupportTicketSysterm.Services.IAppointmentService, SupportTicketSysterm.Services.AppointmentService>();
builder.Services.AddScoped<SupportTicketSysterm.Services.IAvailabilityService, SupportTicketSysterm.Services.AvailabilityService>();
builder.Services.AddScoped<SupportTicketSysterm.Repositories.Interfaces.ILichHenRepository, SupportTicketSysterm.Repositories.Implementations.LichHenRepository>();
builder.Services.AddScoped<SupportTicketSysterm.Services.ILichHenService, SupportTicketSysterm.Services.LichHenService>();
builder.Services.AddScoped<SupportTicketSysterm.Services.IRatingService, SupportTicketSysterm.Services.RatingService>();


// Đăng ký Authorization
builder.Services.AddAuthorization();

// Đăng ký Session
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});
var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseSession();
app.UseAuthentication();
app.UseAuthorization();

app.MapHub<SupportTicketSysterm.Controllers.ChatHub>("/chatHub");
app.MapHub<SupportTicketSysterm.Controllers.LiveSupportHub>("/liveSupportHub");
app.MapHub<SupportTicketSysterm.Hubs.NotificationHub>("/notificationHub");

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
