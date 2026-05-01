declare global {
  namespace Express {
    interface Request {
      user_uuid?: number;
    }
  }
}

export {};
