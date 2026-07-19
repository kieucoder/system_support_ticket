using Microsoft.Extensions.Configuration;
using System;
using System.Threading.Tasks;
using Twilio;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;

namespace SupportTicketSysterm.Services
{
    public class TwilioService : ITwilioService
    {
        private readonly string _accountSid;
        private readonly string _authToken;
        private readonly string _fromPhoneNumber;

        public TwilioService(IConfiguration configuration)
        {
            var section = configuration.GetSection("Twilio");
            _accountSid = section["AccountSid"] ?? "";
            _authToken = section["AuthToken"] ?? "";
            _fromPhoneNumber = section["PhoneNumber"] ?? "";
        }

        public async Task<bool> SendOtpAsync(string phoneNumber, string otp)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(_accountSid) || string.IsNullOrWhiteSpace(_authToken))
                {
                    return false;
                }

                TwilioClient.Init(_accountSid, _authToken);

                string formattedPhoneNumber = phoneNumber.Trim();
                if (formattedPhoneNumber.StartsWith("0"))
                {
                    formattedPhoneNumber = "+84" + formattedPhoneNumber.Substring(1);
                }

                var message = await MessageResource.CreateAsync(
                    to: new PhoneNumber(formattedPhoneNumber),
                    from: new PhoneNumber(_fromPhoneNumber),
                    body: $"Tech Support\n\nXin chào,\nMã OTP của bạn là: {otp}\nMã có hiệu lực trong 5 phút.\nKhông chia sẻ mã này với bất kỳ ai."
                );

                if (message != null && message.ErrorCode == null)
                {
                    return true;
                }

                return false;
            }
            catch (Exception)
            {
                return false;
            }
        }
    }
}
