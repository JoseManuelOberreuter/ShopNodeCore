import { jest, describe, it, expect, beforeAll, afterEach } from '@jest/globals';

const createResponseMock = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authHelper.requireAuth', () => {
  let requireAuth;

  beforeAll(async () => {
    ({ requireAuth } = await import('../utils/authHelper.js'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns false and responds 401 when user is missing', () => {
    const req = {};
    const res = createResponseMock();

    const result = requireAuth(req, res);

    expect(result).toBe(false);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.stringContaining('Debes iniciar sesión')
    }));
  });

  it('returns false and responds 403 when user is not verified', () => {
    const req = { user: { isVerified: false } };
    const res = createResponseMock();

    const result = requireAuth(req, res);

    expect(result).toBe(false);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.stringContaining('Debes verificar tu cuenta'),
      code: 'VERIFICATION_REQUIRED'
    }));
  });

  it('allows verified users to continue', () => {
    const req = { user: { isVerified: true } };
    const res = createResponseMock();

    const result = requireAuth(req, res);

    expect(result).toBe(true);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});

