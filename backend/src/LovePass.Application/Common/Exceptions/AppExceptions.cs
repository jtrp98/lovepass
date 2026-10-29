namespace LovePass.Application.Common.Exceptions;

public class NotFoundException(string name, object key)
    : Exception($"\"{name}\" ({key}) was not found.");

public class ConflictException(string message)
    : Exception(message);

public class ForbiddenAccessException()
    : Exception("Access forbidden.");

public class UnauthorizedException(string message = "Unauthorized.")
    : Exception(message);
