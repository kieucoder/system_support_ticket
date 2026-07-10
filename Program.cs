using Microsoft.EntityFrameworkCore;
using SupportTicketSysterm.Data;
using System;

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

<<<<<<< HEAD
// Đăng ký Session
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

=======
>>>>>>> f27fcf8921ddad14015781ef7ddf6a8f873bdde0
var app = builder.Build();

// Configure the HTTP request pipeline.nôn
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

<<<<<<< HEAD
app.UseSession();

=======
>>>>>>> f27fcf8921ddad14015781ef7ddf6a8f873bdde0
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
