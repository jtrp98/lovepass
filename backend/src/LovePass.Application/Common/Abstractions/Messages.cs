using MediatR;

namespace LovePass.Application.Common.Abstractions;

/// <summary>Command = use case ที่เปลี่ยนข้อมูล (รันภายใน transaction อัตโนมัติ)</summary>
public interface ICommand<TResponse> : IRequest<TResponse>;

/// <summary>Query = use case ที่อ่านข้อมูล (ไม่มี transaction)</summary>
public interface IQuery<TResponse> : IRequest<TResponse>;
