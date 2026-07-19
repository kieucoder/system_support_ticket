using System.Collections.Generic;

namespace SupportTicketSysterm.ViewModels
{
    public class DanhGiaListViewModel
    {
        public List<DanhGiaChiTietViewModel> Items { get; set; } = new();
        public int TotalItems { get; set; }
        public int TotalPages { get; set; }
        public int CurrentPage { get; set; }
        public int PageSize { get; set; }

        // Filters
        public string? Keyword { get; set; }
        public string? StatusFilter { get; set; }
        public string? SortOrder { get; set; }

        // Stats
        public int TotalReviews { get; set; }
        public int RepliedCount { get; set; }
        public int NotRepliedCount { get; set; }
        public double AverageRating { get; set; }
    }
}
