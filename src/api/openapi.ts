export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Order Backend Service API',
    version: '1.0.0',
    description:
      'Order domain microservice for cart, discount, and order lifecycle operations used in a cloud-native e-commerce architecture.'
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local development'
    }
  ],
  tags: [
    { name: 'System', description: 'Service status endpoints' },
    { name: 'Orders', description: 'Order management endpoints' },
    { name: 'Cart', description: 'Shopping cart endpoints' },
    { name: 'Discounts', description: 'Discount application and validation endpoints' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Invalid token' }
        }
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          service: { type: 'string', example: 'order-backend-service' },
          timestamp: { type: 'string', format: 'date-time' },
          uptimeSeconds: { type: 'integer', example: 512 }
        }
      },
      ReadyResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ready' },
          service: { type: 'string', example: 'order-backend-service' },
          timestamp: { type: 'string', format: 'date-time' },
          checks: {
            type: 'object',
            properties: {
              databaseUrlConfigured: { type: 'boolean', example: true },
              redisUrlConfigured: { type: 'boolean', example: true },
              rabbitmqUrlConfigured: { type: 'boolean', example: true },
              jwtSecretConfigured: { type: 'boolean', example: true }
            }
          }
        }
      },
      CartItemInput: {
        type: 'object',
        required: ['productId', 'quantity', 'price'],
        properties: {
          productId: { type: 'string', example: 'SKU-1001' },
          productName: { type: 'string', example: 'Mechanical Keyboard' },
          quantity: { type: 'integer', minimum: 1, example: 2 },
          price: { type: 'number', minimum: 0, example: 149.99 }
        }
      },
      CartItemQuantityUpdate: {
        type: 'object',
        required: ['quantity'],
        properties: {
          quantity: { type: 'integer', minimum: 1, example: 3 }
        }
      },
      CartItem: {
        type: 'object',
        properties: {
          itemId: { type: 'string', example: '1711022331234-ab12cd' },
          productId: { type: 'string', example: 'SKU-1001' },
          productName: { type: 'string', example: 'Mechanical Keyboard' },
          quantity: { type: 'integer', example: 2 },
          unitPrice: { type: 'number', example: 149.99 },
          totalPrice: { type: 'number', example: 299.98 }
        }
      },
      CartSnapshot: {
        type: 'object',
        properties: {
          userUuid: { type: 'string', example: '4da7ce8f-66f1-4a4c-a968-dce7e6e92461' },
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/CartItem' }
          },
          subtotal: { type: 'number', example: 299.98 },
          discountAmount: { type: 'number', example: 29.99 },
          finalAmount: { type: 'number', example: 269.99 },
          discountCode: { type: 'string', example: 'WELCOME10' }
        }
      },
      CartEnvelope: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Cart fetched' },
          data: { $ref: '#/components/schemas/CartSnapshot' }
        }
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1711022331234 },
          userUuid: { type: 'string', example: '4da7ce8f-66f1-4a4c-a968-dce7e6e92461' },
          status: { type: 'string', example: 'PLACED' },
          totalAmount: { type: 'number', example: 299.98 },
          discountAmount: { type: 'number', example: 29.99 },
          finalAmount: { type: 'number', example: 269.99 },
          createdAt: { type: 'string', format: 'date-time' },
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/CartItem' }
          }
        }
      },
      OrderEnvelope: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Order fetched' },
          data: { $ref: '#/components/schemas/Order' }
        }
      },
      OrderListEnvelope: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Orders fetched' },
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/Order' }
          }
        }
      },
      OrderStatusUpdateRequest: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', example: 'CONFIRMED' }
        }
      },
      OrderHistoryEntry: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'PLACED' },
          changedAt: { type: 'string', format: 'date-time' },
          changedBy: { type: 'string', example: '4da7ce8f-66f1-4a4c-a968-dce7e6e92461' }
        }
      },
      OrderHistoryEnvelope: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Order history fetched' },
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/OrderHistoryEntry' }
          }
        }
      },
      DiscountApplyRequest: {
        type: 'object',
        required: ['code', 'orderAmount'],
        properties: {
          code: { type: 'string', example: 'WELCOME10' },
          orderAmount: { type: 'number', minimum: 0, example: 299.98 }
        }
      },
      DiscountValidateRequest: {
        type: 'object',
        required: ['code', 'orderAmount'],
        properties: {
          code: { type: 'string', example: 'WELCOME10' },
          orderAmount: { type: 'number', minimum: 0, example: 299.98 }
        }
      },
      DiscountValidationResult: {
        type: 'object',
        properties: {
          valid: { type: 'boolean', example: true },
          code: { type: 'string', example: 'WELCOME10' },
          orderAmount: { type: 'number', example: 299.98 },
          discountAmount: { type: 'number', example: 29.99 }
        }
      },
      DiscountValidationEnvelope: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Discount validation completed' },
          data: { $ref: '#/components/schemas/DiscountValidationResult' }
        }
      },
      RootResponse: {
        type: 'object',
        properties: {
          service: { type: 'string', example: 'order-backend-service' },
          status: { type: 'string', example: 'ok' },
          docs: { type: 'string', example: '/api-docs' },
          health: { type: 'string', example: '/health' },
          ready: { type: 'string', example: '/ready' }
        }
      }
    }
  },
  paths: {
    '/': {
      get: {
        tags: ['System'],
        summary: 'Get service information',
        responses: {
          '200': {
            description: 'Service metadata',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RootResponse' }
              }
            }
          }
        }
      }
    },
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Liveness probe',
        responses: {
          '200': {
            description: 'Service is alive',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' }
              }
            }
          }
        }
      }
    },
    '/ready': {
      get: {
        tags: ['System'],
        summary: 'Readiness probe',
        responses: {
          '200': {
            description: 'Service is ready',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ReadyResponse' }
              }
            }
          },
          '503': {
            description: 'Service is not ready',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ReadyResponse' }
              }
            }
          }
        }
      }
    },
    '/api/orders/health': {
      get: {
        tags: ['Orders'],
        summary: 'Order module health',
        responses: {
          '200': {
            description: 'Order module is healthy'
          }
        }
      }
    },
    '/api/orders': {
      get: {
        tags: ['Orders'],
        summary: 'List orders for authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Order list',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OrderListEnvelope' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      post: {
        tags: ['Orders'],
        summary: 'Create order from current cart',
        security: [{ bearerAuth: [] }],
        responses: {
          '201': {
            description: 'Order created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OrderEnvelope' }
              }
            }
          },
          '400': {
            description: 'Invalid request or empty cart',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/orders/{orderId}': {
      get: {
        tags: ['Orders'],
        summary: 'Get order by id',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'orderId',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '200': {
            description: 'Order details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OrderEnvelope' }
              }
            }
          },
          '404': {
            description: 'Order not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/orders/{orderId}/history': {
      get: {
        tags: ['Orders'],
        summary: 'Get order status history',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'orderId',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '200': {
            description: 'History entries',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OrderHistoryEnvelope' }
              }
            }
          },
          '400': {
            description: 'Invalid order id',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/orders/{orderId}/status': {
      patch: {
        tags: ['Orders'],
        summary: 'Update order status',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'orderId',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OrderStatusUpdateRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Status updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OrderEnvelope' }
              }
            }
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/orders/{orderId}/cancel': {
      post: {
        tags: ['Orders'],
        summary: 'Cancel order',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'orderId',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '200': {
            description: 'Order cancelled',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OrderEnvelope' }
              }
            }
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/cart': {
      get: {
        tags: ['Cart'],
        summary: 'Get current cart',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Current cart',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CartEnvelope' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Cart'],
        summary: 'Clear current cart',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Cart cleared',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CartEnvelope' }
              }
            }
          }
        }
      }
    },
    '/api/cart/items': {
      post: {
        tags: ['Cart'],
        summary: 'Add item to cart',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CartItemInput' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Cart item added',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CartEnvelope' }
              }
            }
          },
          '400': {
            description: 'Validation failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/cart/items/{itemId}': {
      patch: {
        tags: ['Cart'],
        summary: 'Update cart item quantity',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'itemId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CartItemQuantityUpdate' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Cart item updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CartEnvelope' }
              }
            }
          },
          '400': {
            description: 'Invalid request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Cart'],
        summary: 'Remove cart item',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'itemId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Cart item removed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CartEnvelope' }
              }
            }
          },
          '400': {
            description: 'Invalid request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/discounts/apply': {
      post: {
        tags: ['Discounts'],
        summary: 'Apply discount code to cart',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DiscountApplyRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Discount applied',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CartEnvelope' }
              }
            }
          },
          '400': {
            description: 'Validation failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/discounts': {
      delete: {
        tags: ['Discounts'],
        summary: 'Remove applied discount',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Discount removed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CartEnvelope' }
              }
            }
          }
        }
      }
    },
    '/api/discounts/validate': {
      post: {
        tags: ['Discounts'],
        summary: 'Validate a discount code',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DiscountValidateRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Validation result',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DiscountValidationEnvelope' }
              }
            }
          },
          '400': {
            description: 'Validation failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    }
  }
} as const;
