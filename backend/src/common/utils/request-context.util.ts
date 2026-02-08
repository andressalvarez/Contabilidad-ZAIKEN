export interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  path?: string;
  method?: string;
}

function firstForwardedIp(value?: string): string | undefined {
  if (!value) return undefined;
  return value.split(',')[0]?.trim();
}

export function extractRequestContext(req: any): RequestContext {
  const forwarded = req?.headers?.['x-forwarded-for'];
  const requestId =
    req?.headers?.['x-request-id'] || req?.headers?.['x-correlation-id'];

  return {
    ipAddress:
      firstForwardedIp(forwarded) || req?.ip || req?.connection?.remoteAddress,
    userAgent: req?.headers?.['user-agent'],
    requestId: Array.isArray(requestId) ? requestId[0] : requestId,
    path: req?.originalUrl || req?.url,
    method: req?.method,
  };
}
