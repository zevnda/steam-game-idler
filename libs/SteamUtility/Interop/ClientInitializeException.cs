using System;

namespace SteamUtility.Interop
{
    public class ClientInitializeException : Exception
    {
        public ClientInitializeFailure FailureReason { get; }

        public ClientInitializeException(ClientInitializeFailure reason)
        {
            FailureReason = reason;
        }

        public ClientInitializeException(ClientInitializeFailure reason, string message)
            : base(message)
        {
            FailureReason = reason;
        }

        public ClientInitializeException(
            ClientInitializeFailure reason,
            string message,
            Exception innerException
        )
            : base(message, innerException)
        {
            FailureReason = reason;
        }
    }
}
