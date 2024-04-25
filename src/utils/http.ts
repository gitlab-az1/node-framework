import type { CommonHttpHeaders, LooseAutocomplete } from '../types';
import IterableMap, { type IterableMapEntries } from '../iterable-map';



export const enum StatusCode {
  Continue = 0x64,
  SwitchingProtocols = 0x65,
  Processing = 0x66,
  EarlyHints = 0x67,
  Success = 0xC8,
  Created = 0xC9,
  Accepted = 0xCA,
  NonAuthoritativeInformation = 0xCB,
  NoContent = 0xCC,
  ResetContent = 0xCD,
  PartialContent = 0xCE,
  MultiStatus = 0xCF,
  AlreadyReported = 0xD0,
  ImUsed = 0xE2,
  MultipleChoices = 0x12C,
  MovedPermanently = 0x12D,
  Found = 0x12E,
  SeeOther = 0x12F,
  NotModified = 0x130,
  UseProxy = 0x131,
  Unused = 0x132,
  TemporaryRedirect = 0x133,
  PermanentRedirect = 0x134,
  BadRequest = 0x190,
  Unauthorized = 0x191,
  PaymentRequired = 0x192,
  Forbidden = 0x193,
  NotFound = 0x194,
  MethodNotAllowed = 0x195,
  NotAcceptable = 0x196,
  ProxyAuthenticationRequired = 0x197,
  RequestTimeout = 0x198,
  Conflict = 0x199,
  Gone = 0x19A,
  LengthRequired = 0x19B,
  PreconditionFailed = 0x19C,
  PayloadTooLarge = 0x19D,
  URITooLong = 0x19E,
  UnsupportedMediaType = 0x19F,
  RangeNotSatisfiable = 0x1A0,
  ExpectationFailed = 0x1A1,
  ImATeapot = 0x1A2,
  MisdirectedRequest = 0x1A5,
  UnprocessableEntity = 0x1A6,
  Locked = 0x1A7,
  FailedDependency = 0x1A8,
  TooEarly = 0x1A9,
  UpgradeRequired = 0x1AA,
  PreconditionRequired = 0x1AB,
  TooManyRequests = 0x1AC,
  RequestHeadersFieldsTooLarge = 0x1AF,
  UnavaliableForLegalReasons = 0x1C3,
  InternalServerError = 0x1F4,
  NotImplemented = 0x1F5,
  BadGateway = 0x1F6,
  ServiceUnavailable = 0x1F7,
  GatewayTimeout = 0x1F8,
  HttpVersionNotSupported = 0x1F9,
  VariantAlsoNegotiates = 0x1FA,
  InsufficientStorage = 0x1FB,
  LoopDetected = 0x1FC,
  NotExtended = 0x1FE,
  NetworkAuthenticationRequired = 0x1FF
}


export class Headers extends IterableMap<LooseAutocomplete<keyof CommonHttpHeaders>, string | string[]> {
  public constructor(entries?: IterableMapEntries<LooseAutocomplete<keyof CommonHttpHeaders>, string | string[]> | null) {
    super(entries);

    super._setValidator((value, key) => {
      if(!key || !value) return false;
      if(typeof key !== 'string') return false;

      if(typeof value === 'string') return true;
      if(Array.isArray(value)) return value.every(v => typeof v === 'string');

      return false;
    }, 'Invalid header key or value, the key must be a string and the value must be a string or an array of strings.');
  }

  public contact(...headers: Headers[]): Headers {
    const entries = this.entries();
    const newHeaders = new Headers(entries);

    for(const header of headers) {
      for(const [key, value] of header.entries()) {
        if(newHeaders.contains(key)) {
          const existing = newHeaders.get(key);

          if(Array.isArray(existing)) {
            newHeaders.set(key, [...existing, ...(typeof value === 'string' ? [value] : value)].filter(Boolean));
          } else {
            newHeaders.set(key, Array.isArray(value) ? [existing!, ...value].filter(Boolean) : value);
          }
        } else {
          newHeaders.set(key, value);
        }
      }
    }

    return newHeaders;
  }

  public toString(eol: string = '\r\n'): string {
    const lines = [] as string[];

    for(const [key, value] of this.entries()) {
      if(Array.isArray(value)) {
        for(const v of value) {
          lines.push(`${key}: ${v}`);
        }
      } else {
        lines.push(`${key}: ${value}`);
      }
    }

    return lines.join(eol);
  }

  public override [Symbol.toStringTag](): string {
    return '[object Headers]';
  }
}


export function statusCodeToString(code: number): string {
  switch(code) {
    case StatusCode.Continue:
      return 'Continue';
    case StatusCode.SwitchingProtocols:
      return 'Switching Protocols';
    case StatusCode.Processing:
      return 'Processing';
    case StatusCode.EarlyHints:
      return 'Early Hints';
    case StatusCode.Success:
      return 'OK';
    case StatusCode.Created:
      return 'Created';
    case StatusCode.Accepted:
      return 'Accepted';
    case StatusCode.NonAuthoritativeInformation:
      return 'Non-Authoritative Information';
    case StatusCode.NoContent:
      return 'No Content';
    case StatusCode.ResetContent:
      return 'Reset Content';
    case StatusCode.PartialContent:
      return 'Partial Content';
    case StatusCode.MultiStatus:
      return 'Multi-Status';
    case StatusCode.AlreadyReported:
      return 'Already Reported';
    case StatusCode.ImUsed:
      return 'IM Used';
    case StatusCode.MultipleChoices:
      return 'Multiple Choices';
    case StatusCode.MovedPermanently:
      return 'Moved Permanently';
    case StatusCode.Found:
      return 'Found';
    case StatusCode.SeeOther:
      return 'See Other';
    case StatusCode.NotModified:
      return 'Not Modified';
    case StatusCode.UseProxy:
      return 'Use Proxy';
    case StatusCode.Unused:
      return 'Unused';
    case StatusCode.TemporaryRedirect:
      return 'Temporary Redirect';
    case StatusCode.PermanentRedirect:
      return 'Permanent Redirect';
    case StatusCode.BadRequest:
      return 'Bad Request';
    case StatusCode.Unauthorized:
      return 'Unauthorized';
    case StatusCode.PaymentRequired:
      return 'Payment Required';
    case StatusCode.Forbidden:
      return 'Forbidden';
    case StatusCode.NotFound:
      return 'Not Found';
    case StatusCode.MethodNotAllowed:
      return 'Method Not Allowed';
    case StatusCode.NotAcceptable:
      return 'Not Acceptable';
    case StatusCode.ProxyAuthenticationRequired:
      return 'Proxy Authentication Required';
    case StatusCode.RequestTimeout:
      return 'Request Timeout';
    case StatusCode.Conflict:
      return 'Conflict';
    case StatusCode.Gone:
      return 'Gone';
    case StatusCode.LengthRequired:
      return 'Length Required';
    case StatusCode.PreconditionFailed:
      return 'Precondition Failed';
    case StatusCode.PayloadTooLarge:
      return 'Payload Too Large';
    case StatusCode.URITooLong:
      return 'URI Too Long';
    case StatusCode.UnsupportedMediaType:
      return 'Unsupported Media Type';
    case StatusCode.RangeNotSatisfiable:
      return 'Range Not Satisfiable';
    case StatusCode.ExpectationFailed:
      return 'Expectation Failed';
    case StatusCode.ImATeapot:
      return 'I\'m a teapot';
    case StatusCode.MisdirectedRequest:
      return 'Misdirected Request';
    case StatusCode.UnprocessableEntity:
      return 'Unprocessable Entity';
    case StatusCode.Locked:
      return 'Locked';
    case StatusCode.FailedDependency:
      return 'Failed Dependency';
    case StatusCode.TooEarly:
      return 'Too Early';
    case StatusCode.UpgradeRequired:
      return 'Upgrade Required';
    case StatusCode.PreconditionRequired:
      return 'Precondition Required';
    case StatusCode.TooManyRequests:
      return 'Too Many Requests';
    case StatusCode.RequestHeadersFieldsTooLarge:
      return 'Request Header Fields Too Large';
    case StatusCode.UnavaliableForLegalReasons:
      return 'Unavaliable For Legal Reasons';
    case StatusCode.InternalServerError:
      return 'Internal Server Error';
    case StatusCode.NotImplemented:
      return 'Not Implemented';
    case StatusCode.BadGateway:
      return 'Bad Gateway';
    case StatusCode.ServiceUnavailable:
      return 'Service Unavailable';
    case StatusCode.GatewayTimeout:
      return 'Gateway Timeout';
    case StatusCode.HttpVersionNotSupported:
      return 'HTTP Version Not Supported';
    case StatusCode.VariantAlsoNegotiates:
      return 'Variant Also Negotiates';
    case StatusCode.InsufficientStorage:
      return 'Insufficient Storage';
    case StatusCode.LoopDetected:
      return 'Loop Detected';
    case StatusCode.NotExtended:
      return 'Not Extended';
    case StatusCode.NetworkAuthenticationRequired:
      return 'Network Authentication Required';
    default:
      return 'Unknown Status Code';
  }
}

export function httpStatusExplanation(status: number): string {
  switch(status) {
    case StatusCode.Continue:
      return 'This interim response indicates that the client should continue the request or ignore the response if the request is already finished.';
    case StatusCode.SwitchingProtocols:
      return 'This code is sent in response to an Upgrade request header from the client, and indicates the protocol the server is switching to.';
    case StatusCode.Processing:
      return 'This code indicates that the server has received and is processing the request, but no response is available yet.';
    case StatusCode.EarlyHints:
      return 'This status code is primarily intended to be used with the Link header, letting the user agent start preloading resources while the server prepares a response.';
    case StatusCode.Success:
      return 'The request has succeeded.';
    case StatusCode.Created:
      return 'The request has been fulfilled, resulting in the creation of a new resource.';
    case StatusCode.Accepted:
      return 'The request has been accepted for processing, but the processing has not been completed.';
    case StatusCode.NonAuthoritativeInformation:
      return 'The request has been successfully processed, but is returning information that may be from another source. Generally it\'s means the returned metadata is not exactly the same as is available from the origin server, but is collected from a local or a third-party copy.';
    case StatusCode.NoContent:
      return 'The request has been successfully processed, but is not returning any content.';
    case StatusCode.ResetContent:
      return 'The request has been successfully processed, but requires that the user agent to reset the document which sent this request.';
    case StatusCode.PartialContent:
      return 'The server is delivering only part of the resource, normally due to a range header sent by the client.';
    case StatusCode.MultiStatus:
      return 'Conveys information about multiple resources, for situations where multiple status codes might be appropriate.';
    case StatusCode.AlreadyReported:
      return 'Used inside a <dav:propstat> response element to avoid repeatedly enumerating the internal members of multiple bindings to the same collection.';
    case StatusCode.ImUsed:
      return 'The server has fulfilled a request for the resource, and the response is a representation of the result of one or more instance-manipulations applied to the current instance.';
    case StatusCode.MultipleChoices:
      return 'The request has more than one possible response. The user-agent or the user should choose one of them.';
    case StatusCode.MovedPermanently:
      return 'The URI of the requested resource has been changed permanently. Probably, the new URI would be given in the response.';
    case StatusCode.Found:
      return 'The URI of requested resource has been changed temporarily and the new URI would be given in the Location header.';
    case StatusCode.SeeOther:
      return 'The server sent this response to direct the client to get the requested resource at another URI with a GET request.';
    case StatusCode.NotModified:
      return 'This is used for caching purposes. It tells the client that the response has not been modified, so the client can continue to use the same cached version of the response.';
    case StatusCode.UseProxy:
      console.warn('The UseProxy status code is deprecated.');
      return 'Was defined in a previous version of the HTTP specification to indicate that a requested response must be accessed by a proxy.';
    case StatusCode.Unused:
      console.warn('The Unused status code is deprecated.');
      return 'The code is no longer used and is reserved.';
    case StatusCode.TemporaryRedirect:
      return 'The server sends this response to direct the client to get the requested resource at another URI with the same method that was used in the prior request.';
    case StatusCode.PermanentRedirect:
      return 'This means that the resource is now permanently located at another URI, specified by the Location header.';
    case StatusCode.BadRequest:
      return 'The server cannot or will not process the request due to something that is perceived to be a client error.';
    case StatusCode.Unauthorized:
      return 'The request has not been applied because it lacks valid authentication credentials for the target resource.';
    case StatusCode.PaymentRequired:
      return 'Reserved for future use. The initial aim for creating this code was using it for digital payment systems, however this status code is used very rarely and no standard convention exists.';
    case StatusCode.Forbidden:
      return 'The client does not have access rights to the content, i.e., they are unauthorized, so server is rejecting to give proper response.';
    case StatusCode.NotFound:
      return 'The server can not find the requested resource. In the browser, this means the URL is not recognized.';
    case StatusCode.MethodNotAllowed:
      return 'The request method is known by the server but has been disabled or not supported by the target resource.';
    case StatusCode.NotAcceptable:
      return 'This response is sent when the web server, after performing server-driven content negotiation, doesn\'t find any content that conforms to the criteria given by the user agent.';
    case StatusCode.ProxyAuthenticationRequired:
      return 'This is similar to 401 Unauthorized but authentication is needed to be done by a proxy.';
    case StatusCode.RequestTimeout:
      return 'This response is sent on an idle connection by some servers, even without any previous request by the client.';
    case StatusCode.Conflict:
      return 'This response is sent when a request conflicts with the current state of the server.';
    case StatusCode.Gone:
      return 'This response is sent when the requested content has been permanently deleted from server, with no forwarding address.';
    case StatusCode.LengthRequired:
      return 'Server rejected the request because the Content-Length header field is not defined and the server requires it.';
    case StatusCode.PreconditionFailed:
      return 'The client has indicated preconditions in its headers which the server does not meet.';
    case StatusCode.PayloadTooLarge:
      return 'Request entity is larger than limits defined by server; the server might close the connection or return Retry-After header field.';
    case StatusCode.URITooLong:
      return 'The URI requested by the client is longer than the server is willing to interpret.';
    case StatusCode.UnsupportedMediaType:
      return 'The media format of the requested data is not supported by the server, so the server is rejecting the request.';
    case StatusCode.RangeNotSatisfiable:
      return 'The range specified by the Range header field in the request can\'t be fulfilled; it\'s possible that the range is outside the size of the target URI\'s data.';
    case StatusCode.ExpectationFailed:
      return 'This response code means the expectation indicated by the Expect request header field can\'t be met by the server.';
    case StatusCode.ImATeapot:
      return 'The server refuses the attempt to brew coffee with a teapot.';
    case StatusCode.MisdirectedRequest:
      return 'The request was directed at a server that is not able to produce a response.';
    case StatusCode.UnprocessableEntity:
      return 'The request was well-formed but was unable to be followed due to semantic errors.';
    case StatusCode.Locked:
      return 'The resource that is being accessed is locked.';
    case StatusCode.FailedDependency:
      return 'The request failed due to failure of a previous request.';
    case StatusCode.TooEarly:
      return 'Indicates that the server is unwilling to risk processing a request that might be replayed.';
    case StatusCode.UpgradeRequired:
      return 'The server refuses to perform the request using the current protocol but might be willing to do so after the client upgrades to a different protocol.';
    case StatusCode.PreconditionRequired:
      return 'The origin server requires the request to be conditional.';
    case StatusCode.TooManyRequests:
      return 'The user has sent too many requests in a given amount of time.';
    case StatusCode.RequestHeadersFieldsTooLarge:
      return 'The server is unwilling to process the request because either an individual header field, or all the header fields collectively, are too large.';
    case StatusCode.UnavaliableForLegalReasons:
      return 'The user agent requested a resource that cannot legally be provided, such as a web page censored by a government.';
    case StatusCode.InternalServerError:
      return 'The server has encountered a situation it doesn\'t know how to handle.';
    case StatusCode.NotImplemented:
      return 'The request method is not supported by the server and cannot be handled.';
    case StatusCode.BadGateway:
      return 'This error response means that the server, while working as a gateway to get a response needed to handle the request, got an invalid response.';
    case StatusCode.ServiceUnavailable:
      return 'The server is not ready to handle the request. Common causes are a server that is down for maintenance or that is overloaded.';
    case StatusCode.GatewayTimeout:
      return 'This error response is given when the server is acting as a gateway and cannot get a response in time.';
    case StatusCode.HttpVersionNotSupported:
      return 'The HTTP version used in the request is not supported by the server.';
    case StatusCode.VariantAlsoNegotiates:
      return 'The server has an internal configuration error: transparent content negotiation for the request results in a circular reference.';
    case StatusCode.InsufficientStorage:
      return 'The server is unable to store the representation needed to complete the request.';
    case StatusCode.LoopDetected:
      return 'The server detected an infinite loop while processing the request.';
    case StatusCode.NotExtended:
      return 'Further extensions to the request are required for the server to fulfill it.';
    case StatusCode.NetworkAuthenticationRequired:
      return 'The client needs to authenticate to gain network access.';
    default:
      return 'Unknown status code';
  }
}
